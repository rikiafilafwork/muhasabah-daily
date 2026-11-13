/**
 * Antrean sinkron hitungan dzikir.
 *
 * - Hitungan disimpan sebagai nilai akhir per `(dzikir, tanggal)`, bukan selisih,
 *   sehingga mengirim ulang selalu aman (PUT idempoten di server).
 * - Penyimpanan lokal menjaga hitungan yang belum terkirim bila koneksi putus
 *   atau halaman ditutup; antrean dikirim ulang saat online kembali.
 * - Error 4xx (data ditolak server) dibuang agar antrean tidak macet;
 *   error jaringan/5xx disimpan untuk dicoba lagi.
 */
export type SyncStatus = 'idle' | 'saving' | 'pending' | 'offline' | 'error';

export interface QueueStorage {
  load(): Record<string, number>;
  save(entries: Record<string, number>): void;
}

export interface SyncQueueOptions {
  storage: QueueStorage;
  send: (dhikrId: string, date: string, count: number) => Promise<void>;
  /** `true` bila error tidak perlu diulang (mis. 4xx). */
  isPermanentError: (err: unknown) => boolean;
  debounceMs?: number;
  onStatus?: (status: SyncStatus) => void;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export const queueKey = (dhikrId: string, date: string) => `${dhikrId}|${date}`;
const parseKey = (key: string) => {
  const i = key.lastIndexOf('|');
  return { dhikrId: key.slice(0, i), date: key.slice(i + 1) };
};

export class DhikrSyncQueue {
  private pending: Record<string, number>;
  private timer: unknown = null;
  private flushing: Promise<void> | null = null;
  private status: SyncStatus = 'idle';
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (handle: unknown) => void;

  constructor(private readonly opts: SyncQueueOptions) {
    this.pending = { ...opts.storage.load() };
    this.setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
    if (Object.keys(this.pending).length) this.setStatus('pending');
  }

  /** Hitungan lokal yang belum terkirim untuk sebuah tanggal. */
  pendingFor(date: string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [key, count] of Object.entries(this.pending)) {
      const k = parseKey(key);
      if (k.date === date) out[k.dhikrId] = count;
    }
    return out;
  }

  get size(): number {
    return Object.keys(this.pending).length;
  }

  /** Menetapkan hitungan dan menjadwalkan pengiriman setelah jeda ketukan terakhir. */
  set(dhikrId: string, date: string, count: number) {
    this.pending[queueKey(dhikrId, date)] = count;
    this.opts.storage.save(this.pending);
    this.setStatus('pending');
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = this.setTimer(() => {
      this.timer = null;
      void this.flush();
    }, this.opts.debounceMs ?? 1000);
  }

  /** Mengirim semua hitungan tertunda. Panggilan bersamaan berbagi satu proses. */
  flush(): Promise<void> {
    this.flushing ??= this.doFlush().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async doFlush() {
    const entries = Object.entries(this.pending);
    if (!entries.length) return this.setStatus('idle');
    this.setStatus('saving');
    let offline = false;
    let rejected = false;
    for (const [key, count] of entries) {
      const { dhikrId, date } = parseKey(key);
      try {
        await this.opts.send(dhikrId, date, count);
        // Hanya hapus bila nilainya belum berubah selama pengiriman.
        if (this.pending[key] === count) delete this.pending[key];
      } catch (err) {
        if (this.opts.isPermanentError(err)) {
          if (this.pending[key] === count) delete this.pending[key];
          rejected = true;
        } else {
          offline = true;
          break;
        }
      }
    }
    this.opts.storage.save(this.pending);
    if (offline) this.setStatus('offline');
    else if (rejected) this.setStatus('error');
    else this.setStatus(this.size ? 'pending' : 'idle');
    if (!offline && this.size) await this.doFlush();
  }

  private setStatus(s: SyncStatus) {
    this.status = s;
    this.opts.onStatus?.(s);
  }

  get currentStatus(): SyncStatus {
    return this.status;
  }
}
