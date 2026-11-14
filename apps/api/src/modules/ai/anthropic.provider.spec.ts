import Anthropic from '@anthropic-ai/sdk';
import { PermanentAiError, POLISH_SYSTEM_PROMPT } from './ai-provider';
import { AnthropicProvider } from './anthropic.provider';

function providerWith(create: jest.Mock, serverFallback?: boolean) {
  return new AnthropicProvider({
    apiKey: 'test',
    model: 'claude-opus-5-5',
    serverFallback,
    client: { beta: { messages: { create } } } as never,
  });
}

const message = (over: object) => ({
  content: [{ type: 'text', text: 'Hari ini aku bersyukur.' }],
  stop_reason: 'end_turn',
  ...over,
});

describe('AnthropicProvider', () => {
  it('mengirim teks dalam tag, instruksi sistem, model, dan fallback bawaan', async () => {
    const create = jest.fn().mockResolvedValue(message({}));
    await expect(providerWith(create).polish('hari ini aku bersukur')).resolves.toEqual({
      ok: true,
      text: 'Hari ini aku bersyukur.',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-opus-5-5',
        system: POLISH_SYSTEM_PROMPT,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        messages: [{ role: 'user', content: '<jurnal>\nhari ini aku bersukur\n</jurnal>' }],
      }),
    );
  });

  it('fallback bisa dimatikan', async () => {
    const create = jest.fn().mockResolvedValue(message({}));
    await providerWith(create, false).polish('x');
    expect(create.mock.calls[0][0]).not.toHaveProperty('fallbacks');
  });

  it('memetakan refusal, max_tokens, dan teks kosong', async () => {
    await expect(
      providerWith(jest.fn().mockResolvedValue(message({ stop_reason: 'refusal' }))).polish('x'),
    ).resolves.toEqual({ ok: false, code: 'AI_REFUSED' });
    await expect(
      providerWith(jest.fn().mockResolvedValue(message({ stop_reason: 'max_tokens' }))).polish('x'),
    ).resolves.toEqual({ ok: false, code: 'AI_TRUNCATED' });
    await expect(
      providerWith(jest.fn().mockResolvedValue(message({ content: [] }))).polish('x'),
    ).resolves.toEqual({ ok: false, code: 'AI_EMPTY' });
  });

  it('membuang tag pembungkus bila ikut dibalas', async () => {
    const create = jest
      .fn()
      .mockResolvedValue(
        message({ content: [{ type: 'text', text: '<jurnal>\nRapi.\n</jurnal>' }] }),
      );
    await expect(providerWith(create).polish('x')).resolves.toEqual({ ok: true, text: 'Rapi.' });
  });

  it('galat kunci API bersifat permanen, galat 429/koneksi dilempar ulang', async () => {
    const headers = new Headers();
    const auth = new Anthropic.AuthenticationError(401, { error: {} }, 'unauthorized', headers);
    await expect(
      providerWith(jest.fn().mockRejectedValue(auth)).polish('x'),
    ).rejects.toBeInstanceOf(PermanentAiError);
    const limited = new Anthropic.RateLimitError(429, { error: {} }, 'rate limited', headers);
    await expect(providerWith(jest.fn().mockRejectedValue(limited)).polish('x')).rejects.toBe(
      limited,
    );
  });
});
