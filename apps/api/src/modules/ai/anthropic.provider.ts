import Anthropic from '@anthropic-ai/sdk';
import {
  POLISH_SYSTEM_PROMPT,
  PermanentAiError,
  type AiProvider,
  type PolishResult,
} from './ai-provider';

/** Fallback sisi server saat model menolak (refusal); bisa dimatikan lewat opsi. */
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

export interface AnthropicProviderOptions {
  apiKey: string;
  model: string;
  /** Ganti klien (untuk test). */
  client?: Pick<Anthropic, 'beta'>;
  serverFallback?: boolean;
}

/** AI Polish memakai Claude lewat Anthropic API dengan kunci milik pengguna. */
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  private readonly client: Pick<Anthropic, 'beta'>;

  constructor(private readonly opts: AnthropicProviderOptions) {
    this.client =
      opts.client ?? new Anthropic({ apiKey: opts.apiKey, maxRetries: 2, timeout: 120_000 });
  }

  async polish(text: string): Promise<PolishResult> {
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await this.client.beta.messages.create({
        model: this.opts.model,
        max_tokens: 16000,
        ...(this.opts.serverFallback === false
          ? {}
          : { betas: [FALLBACK_BETA], fallbacks: 'default' as const }),
        system: POLISH_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `<jurnal>\n${text}\n</jurnal>` }],
      });
    } catch (err) {
      if (
        err instanceof Anthropic.AuthenticationError ||
        err instanceof Anthropic.PermissionDeniedError
      ) {
        throw new PermanentAiError('AI_CONFIG_ERROR', 'Kunci API AI ditolak');
      }
      if (err instanceof Anthropic.BadRequestError || err instanceof Anthropic.NotFoundError) {
        throw new PermanentAiError('AI_REJECTED', `Permintaan ditolak penyedia AI (${err.status})`);
      }
      // 429, 5xx, dan galat koneksi dilempar ulang agar antrean mencoba lagi.
      throw err;
    }

    if (response.stop_reason === 'refusal') return { ok: false, code: 'AI_REFUSED' };
    if (response.stop_reason === 'max_tokens') return { ok: false, code: 'AI_TRUNCATED' };
    const out = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .replace(/^\s*<jurnal>\s*/i, '')
      .replace(/\s*<\/jurnal>\s*$/i, '')
      .trim();
    return out ? { ok: true, text: out } : { ok: false, code: 'AI_EMPTY' };
  }
}
