import { AladhanError, fetchWithRetry, mapAladhanResponse } from './aladhan.client';

const sample = {
  code: 200,
  status: 'OK',
  data: {
    timings: {
      Fajr: '2026-11-11T04:10:00+07:00',
      Sunrise: '2026-11-11T05:25:00+07:00',
      Dhuhr: '2026-11-11T11:45:00+07:00',
      Asr: '2026-11-11T15:05:00+07:00',
      Sunset: '2026-11-11T17:53:00+07:00',
      Maghrib: '2026-11-11T17:55:00+07:00',
      Isha: '2026-11-11T19:05:00+07:00',
      Imsak: '2026-11-11T04:00:00+07:00',
    },
    meta: { method: { name: 'Kementerian Agama Republik Indonesia' } },
  },
};

describe('mapAladhanResponse', () => {
  it('memetakan ke ISO UTC', () => {
    const r = mapAladhanResponse(sample);
    expect(r.timings).toEqual({
      fajr: '2026-11-10T21:10:00.000Z',
      sunrise: '2026-11-10T22:25:00.000Z',
      dhuhr: '2026-11-11T04:45:00.000Z',
      asr: '2026-11-11T08:05:00.000Z',
      maghrib: '2026-11-11T10:55:00.000Z',
      isha: '2026-11-11T12:05:00.000Z',
    });
    expect(r.method).toBe('Kementerian Agama Republik Indonesia');
  });

  it('menolak respons rusak', () => {
    expect(() => mapAladhanResponse({ code: 400 })).toThrow(AladhanError);
    expect(() =>
      mapAladhanResponse({
        code: 200,
        data: { timings: { ...sample.data.timings, Asr: '15:05' } },
      }),
    ).toThrow(AladhanError);
  });
});

describe('fetchWithRetry', () => {
  const ok = () => new Response('{}', { status: 200 });
  it('mengulang sekali setelah galat jaringan atau 5xx', async () => {
    const net = jest
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue(ok());
    await expect(fetchWithRetry(net, 0)).resolves.toBeInstanceOf(Response);
    expect(net).toHaveBeenCalledTimes(2);
    const server = jest
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 502 }))
      .mockResolvedValue(ok());
    await expect(fetchWithRetry(server, 0)).resolves.toBeInstanceOf(Response);
  });
  it('tidak mengulang 4xx dan menyerah setelah dua kali gagal', async () => {
    const bad = jest.fn().mockResolvedValue(new Response('', { status: 400 }));
    await expect(fetchWithRetry(bad, 0)).rejects.toThrow('AlAdhan membalas 400');
    expect(bad).toHaveBeenCalledTimes(1);
    const down = jest.fn().mockRejectedValue(new TypeError('fetch failed'));
    await expect(fetchWithRetry(down, 0)).rejects.toBeInstanceOf(AladhanError);
    expect(down).toHaveBeenCalledTimes(2);
  });
});
