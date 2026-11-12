import request from 'supertest';
import { createTestApp, P, type TestContext } from './helpers';

describe('Health (integrasi)', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('melaporkan database dan Redis tanpa token', async () => {
    const res = await request(ctx.app.getHttpServer()).get(`${P}/health`).expect(200);
    expect(res.body).toEqual({ status: 'ok', checks: { database: 'up', redis: 'up' } });
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('meneruskan x-request-id dari klien', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`${P}/health`)
      .set('x-request-id', 'abc-123')
      .expect(200);
    expect(res.headers['x-request-id']).toBe('abc-123');
  });
});
