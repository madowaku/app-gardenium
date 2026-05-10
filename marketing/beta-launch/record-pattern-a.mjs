import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const exportsDir = path.join(here, 'exports');
const port = Number(process.env.PORT || 4177);

await fs.mkdir(exportsDir, { recursive: true });

const app = express();

app.use('/frames', express.static(path.join(here, 'frames')));
app.use(express.raw({ type: '*/*', limit: '150mb' }));

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>App Gardenium Pattern A Recorder</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #221d1c;
      color: #fcf9f2;
      font-family: Inter, "Yu Gothic", Meiryo, sans-serif;
    }
    main {
      display: grid;
      grid-template-columns: auto 300px;
      gap: 24px;
      align-items: start;
      padding: 24px;
    }
    canvas {
      width: min(42vw, 432px);
      height: min(74.6vw, 768px);
      background: #fcf9f2;
      border-radius: 18px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
    }
    aside {
      line-height: 1.6;
      font-size: 14px;
      color: #d8cfca;
    }
    strong { color: #ffffff; }
  </style>
</head>
<body>
  <main>
    <canvas id="stage" width="1080" height="1920"></canvas>
    <aside>
      <p><strong>Recording Pattern A...</strong></p>
      <p id="status">Preparing frames</p>
      <p>Output will be saved to <code>marketing/beta-launch/exports</code>.</p>
    </aside>
  </main>
  <script>
    const W = 1080;
    const H = 1920;
    const FPS = 30;
    const totalMs = 24000;
    const fadeMs = 450;
    const cuts = [
      { src: '/frames/pattern-a-01-home.png', duration: 3000 },
      { src: '/frames/pattern-a-02-submit.png', duration: 4000 },
      { src: '/frames/pattern-a-03-explore.png', duration: 5000 },
      { src: '/frames/pattern-a-05-support.png', duration: 5000 },
      { src: '/frames/pattern-a-04-greenhouse.png', duration: 5000 },
      { src: '/frames/pattern-a-06-cta.png', duration: 2000 },
    ];
    const status = document.querySelector('#status');
    const canvas = document.querySelector('#stage');
    const ctx = canvas.getContext('2d');

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });
    }

    function supportedType() {
      const candidates = [
        'video/mp4;codecs=avc1.42E01E',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
    }

    function drawImageCover(image, progress, alpha = 1) {
      const scale = 1 + progress * 0.035;
      const width = W * scale;
      const height = H * scale;
      const x = (W - width) / 2;
      const y = (H - height) / 2;
      ctx.globalAlpha = alpha;
      ctx.drawImage(image, x, y, width, height);
      ctx.globalAlpha = 1;
    }

    function drawAt(ms, images) {
      ctx.fillStyle = '#fcf9f2';
      ctx.fillRect(0, 0, W, H);

      let cursor = 0;
      let index = 0;
      for (; index < cuts.length; index += 1) {
        if (ms < cursor + cuts[index].duration) break;
        cursor += cuts[index].duration;
      }
      index = Math.min(index, cuts.length - 1);

      const cut = cuts[index];
      const local = ms - cursor;
      const progress = Math.max(0, Math.min(1, local / cut.duration));
      drawImageCover(images[index], progress, 1);

      const nextIndex = Math.min(index + 1, cuts.length - 1);
      const remaining = cut.duration - local;
      if (nextIndex !== index && remaining < fadeMs) {
        const alpha = 1 - remaining / fadeMs;
        drawImageCover(images[nextIndex], 0, alpha);
      }
    }

    async function render() {
      const images = await Promise.all(cuts.map((cut) => loadImage(cut.src)));
      status.textContent = 'Frames loaded. Starting recorder.';

      const mimeType = supportedType();
      const stream = canvas.captureStream(FPS);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      const stopped = new Promise((resolve) => {
        recorder.onstop = resolve;
      });

      recorder.start();
      const startedAt = performance.now();

      function tick(now) {
        const elapsed = Math.min(totalMs, now - startedAt);
        drawAt(elapsed, images);
        status.textContent = 'Recording ' + (elapsed / 1000).toFixed(1) + ' / 24.0s';
        if (elapsed < totalMs) {
          requestAnimationFrame(tick);
        } else {
          recorder.stop();
        }
      }

      requestAnimationFrame(tick);
      await stopped;

      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'video/webm' });
      status.textContent = 'Uploading ' + Math.round(blob.size / 1024 / 1024 * 10) / 10 + ' MB';
      const response = await fetch('/upload', {
        method: 'POST',
        headers: { 'content-type': blob.type || 'application/octet-stream' },
        body: blob,
      });
      const result = await response.json();
      status.textContent = 'Saved: ' + result.file;
      document.title = 'Saved ' + result.file;
    }

    render().catch((error) => {
      console.error(error);
      status.textContent = 'Recording failed: ' + error.message;
      document.title = 'Recording failed';
    });
  </script>
</body>
</html>`);
});

app.post('/upload', async (req, res) => {
  const mime = req.headers['content-type'] || '';
  const ext = String(mime).includes('mp4') ? 'mp4' : 'webm';
  const file = `pattern-a-teaser.${ext}`;
  await fs.writeFile(path.join(exportsDir, file), req.body);
  await fs.writeFile(
    path.join(exportsDir, 'pattern-a-teaser.json'),
    JSON.stringify({ file, mime, bytes: req.body.length, generatedAt: new Date().toISOString() }, null, 2),
  );
  res.json({ file, mime, bytes: req.body.length });
});

const server = app.listen(port, () => {
  console.log(`Pattern A recorder: http://localhost:${port}`);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
