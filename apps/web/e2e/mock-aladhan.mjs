// Server AlAdhan tiruan untuk E2E: jadwal tetap sehingga hasil tes deterministik.
import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 4010);

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  const m = url.pathname.match(/\/timings\/(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) {
    res.writeHead(url.pathname === '/health' ? 200 : 404).end();
    return;
  }
  const [, d, mo, y] = m;
  const at = (hhmm) => `${y}-${mo}-${d}T${hhmm}:00+07:00`;
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(
    JSON.stringify({
      code: 200,
      status: 'OK',
      data: {
        timings: {
          Fajr: at('04:04'),
          Sunrise: at('05:25'),
          Dhuhr: at('11:37'),
          Asr: at('14:58'),
          Maghrib: at('17:48'),
          Isha: at('19:01'),
        },
        meta: { method: { name: 'Kementerian Agama Republik Indonesia' } },
      },
    }),
  );
}).listen(port, () => console.log(`mock aladhan :${port}`));
