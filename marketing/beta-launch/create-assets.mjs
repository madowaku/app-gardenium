import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const assetsDir = path.join(here, 'assets');
const framesDir = path.join(here, 'frames');
const exportsDir = path.join(here, 'exports');

const W = 1080;
const H = 1920;
const COLORS = {
  paper: '#fcf9f2',
  card: '#ffffff',
  ink: '#2a2221',
  muted: '#8a7a78',
  border: '#f4eceb',
  primary: '#ea5532',
  green: '#3dbb5d',
  pale: '#fef6f6',
};

const FONT = '"Yu Gothic", "Meiryo", "Noto Sans JP", Inter, Arial, sans-serif';
const SERIF = '"Yu Mincho", "Hiragino Mincho ProN", "Instrument Serif", Georgia, serif';

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function svg(width, height, body) {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .sans { font-family: ${FONT}; }
    .serif { font-family: ${SERIF}; }
    .tiny { font-size: 26px; font-weight: 700; letter-spacing: 0; }
    .label { font-size: 28px; font-weight: 800; letter-spacing: 0; }
    .body { font-size: 34px; font-weight: 500; letter-spacing: 0; }
    .title { font-size: 76px; font-weight: 500; letter-spacing: 0; }
    .hero { font-size: 86px; font-weight: 500; letter-spacing: 0; }
  </style>
  ${body}
</svg>`);
}

async function pngFromSvg(width, height, body) {
  return sharp(svg(width, height, body)).png().toBuffer();
}

function wrappedText(lines, x, y, klass, fill = COLORS.ink, lineHeight = 1.18) {
  return lines.map((line, i) => (
    `<text x="${x}" y="${y + i * parseInt(klass.includes('hero') ? 98 : klass.includes('title') ? 86 : klass.includes('body') ? 48 : 40, 10) * lineHeight}" class="${klass}" fill="${fill}">${esc(line)}</text>`
  )).join('');
}

async function screenshot(name, width, height = null) {
  const resizeOptions = height
    ? { width, height, fit: 'cover', position: 'top' }
    : { width };

  return sharp(path.join(assetsDir, name))
    .resize(resizeOptions)
    .png()
    .toBuffer();
}

async function logo(width) {
  return sharp(path.join(root, 'public', 'icon192.png'))
    .resize({ width })
    .png()
    .toBuffer();
}

async function makeFrame({ file, eyebrow, title, subtitle, screenshotFile, caption }) {
  const shot = await screenshot(screenshotFile, 850, 860);
  const icon = await logo(70);
  const bg = await pngFromSvg(W, H, `
    <rect width="100%" height="100%" fill="${COLORS.paper}"/>
    <path d="M0 1420 C260 1340 470 1460 720 1390 C880 1345 980 1280 1080 1330 L1080 1920 L0 1920 Z" fill="${COLORS.pale}"/>
    <rect x="72" y="72" width="936" height="1776" rx="54" fill="${COLORS.card}" stroke="${COLORS.border}" stroke-width="3"/>
    <text x="164" y="132" class="label sans" fill="${COLORS.primary}">App</text>
    <text x="228" y="132" class="label sans" fill="${COLORS.green}">Gardenium β</text>
    <rect x="72" y="177" width="936" height="1" fill="${COLORS.border}"/>
    <text x="98" y="250" class="tiny sans" fill="${COLORS.primary}">${esc(eyebrow)}</text>
    ${wrappedText(title, 96, 360, 'hero serif', COLORS.ink)}
    <text x="98" y="610" class="body sans" fill="${COLORS.muted}">${esc(subtitle)}</text>
    <rect x="98" y="720" width="884" height="1012" rx="36" fill="${COLORS.paper}" stroke="${COLORS.border}" stroke-width="3"/>
    <rect x="98" y="720" width="884" height="68" rx="36" fill="${COLORS.ink}" opacity="0.96"/>
    <circle cx="140" cy="754" r="8" fill="${COLORS.primary}"/>
    <circle cx="170" cy="754" r="8" fill="#f4c95d"/>
    <circle cx="200" cy="754" r="8" fill="${COLORS.green}"/>
    <text x="98" y="1794" class="body sans" fill="${COLORS.ink}">${esc(caption)}</text>
  `);

  await sharp(bg)
    .composite([
      { input: icon, left: 92, top: 91 },
      { input: shot, left: 115, top: 805 },
    ])
    .png()
    .toFile(path.join(framesDir, file));
}

async function makeStoryboard({ file, title, variants }) {
  const composites = [];
  const bg = await pngFromSvg(W, H, `
    <rect width="100%" height="100%" fill="${COLORS.paper}"/>
    <text x="66" y="100" class="label sans" fill="${COLORS.primary}">App Gardenium β launch video</text>
    ${wrappedText(title, 66, 205, 'title serif', COLORS.ink)}
    <text x="66" y="360" class="body sans" fill="${COLORS.muted}">X / Reddit向け短尺版。各カットは2.5〜5秒。</text>
  `);

  const panelW = 452;
  const panelH = 390;
  const positions = [
    [66, 430],
    [562, 430],
    [66, 865],
    [562, 865],
    [66, 1300],
    [562, 1300],
  ];

  for (let i = 0; i < variants.length; i += 1) {
    const [x, y] = positions[i];
    const v = variants[i];
    const panel = await pngFromSvg(panelW, panelH, `
      <rect x="0" y="0" width="${panelW}" height="${panelH}" rx="28" fill="${COLORS.card}" stroke="${COLORS.border}" stroke-width="3"/>
      <text x="28" y="58" class="tiny sans" fill="${COLORS.primary}">CUT ${i + 1} / ${esc(v.time)}</text>
      <text x="28" y="116" class="label sans" fill="${COLORS.ink}">${esc(v.head)}</text>
      <text x="28" y="164" class="tiny sans" fill="${COLORS.muted}">${esc(v.copy)}</text>
      <rect x="28" y="202" width="396" height="150" rx="18" fill="${COLORS.paper}" stroke="${COLORS.border}" stroke-width="2"/>
    `);
    composites.push({ input: panel, left: x, top: y });
    if (v.image) {
      const thumb = await screenshot(v.image, 396, 150);
      composites.push({ input: thumb, left: x + 28, top: y + 202 });
    }
  }

  await sharp(bg).composite(composites).png().toFile(path.join(exportsDir, file));
}

async function makeThumbnail() {
  const home = await screenshot('01-home.png', 560, 440);
  const ideas = await screenshot('02-ideas.png', 500, 370);
  const icon = await logo(92);
  const bg = await pngFromSvg(1200, 675, `
    <rect width="100%" height="100%" fill="${COLORS.paper}"/>
    <rect x="62" y="62" width="1076" height="551" rx="34" fill="${COLORS.card}" stroke="${COLORS.border}" stroke-width="3"/>
    <text x="178" y="132" class="label sans" fill="${COLORS.primary}">App</text>
    <text x="248" y="132" class="label sans" fill="${COLORS.green}">Gardenium β</text>
    <text x="86" y="248" class="hero serif" fill="${COLORS.ink}">アプリのアイデアを、</text>
    <text x="86" y="346" class="hero serif" fill="${COLORS.ink}">みんなで育てる。</text>
    <text x="90" y="438" class="body sans" fill="${COLORS.muted}">β版、公開準備中。X / Reddit告知用サムネイル。</text>
    <rect x="90" y="504" width="276" height="58" rx="29" fill="${COLORS.primary}"/>
    <text x="129" y="543" class="label sans" fill="white">Join the beta</text>
  `);

  await sharp(bg)
    .composite([
      { input: icon, left: 86, top: 83 },
      { input: home, left: 690, top: 88 },
      { input: ideas, left: 608, top: 238 },
    ])
    .png()
    .toFile(path.join(exportsDir, 'thumbnail-beta-open.png'));
}

await fs.mkdir(framesDir, { recursive: true });
await fs.mkdir(exportsDir, { recursive: true });

await makeFrame({
  file: 'pattern-a-01-home.png',
  eyebrow: 'BETA OPEN',
  title: ['アプリのアイデアを、', 'みんなで育てる。'],
  subtitle: '“あったらいいな”を置ける小さな庭。',
  screenshotFile: '01-home.png',
  caption: 'App Gardenium β',
});
await makeFrame({
  file: 'pattern-a-02-submit.png',
  eyebrow: 'PLANT',
  title: ['完璧じゃなくて', '大丈夫。'],
  subtitle: 'ひとことの願いから投稿できます。',
  screenshotFile: '03-submit.png',
  caption: 'Plant an idea',
});
await makeFrame({
  file: 'pattern-a-03-explore.png',
  eyebrow: 'GROW',
  title: ['応援とコメントで', '形にしていく。'],
  subtitle: 'アイデアを探し、反応し、次の一歩へ。',
  screenshotFile: '02-ideas.png',
  caption: 'Explore ideas',
});
await makeFrame({
  file: 'pattern-a-04-greenhouse.png',
  eyebrow: 'BETA',
  title: ['作りかけも、', '途中の迷いも。'],
  subtitle: 'Greenhouseで小さな進捗を共有。',
  screenshotFile: '04-greenhouse.png',
  caption: 'Join the Greenhouse',
});
await makeFrame({
  file: 'pattern-a-05-support.png',
  eyebrow: 'SUPPORT',
  title: ['応援とコメントで', '次の一歩へ。'],
  subtitle: '欲しい理由や使い方を足していく。',
  screenshotFile: '05-idea-detail.png',
  caption: 'Support an idea',
});
await makeFrame({
  file: 'pattern-a-06-cta.png',
  eyebrow: 'BETA OPEN',
  title: ['App Gardenium β', '触ってください。'],
  subtitle: '小さな感想が、この庭を育てます。',
  screenshotFile: '01-home.png',
  caption: 'app-gardenium beta',
});

await makeStoryboard({
  file: 'pattern-a-storyboard.png',
  title: ['王道ティザー：', 'アイデアが育つ場所'],
  variants: [
    { time: '0-3s', head: 'Hook', copy: '欲しいアプリ、眠ってない？', image: '01-home.png' },
    { time: '3-7s', head: 'Plant', copy: 'ひとことだけでも投稿', image: '03-submit.png' },
    { time: '7-12s', head: 'Explore', copy: '共感できるタネを探す', image: '02-ideas.png' },
    { time: '12-17s', head: 'Support', copy: '応援とコメントで育つ', image: '05-idea-detail.png' },
    { time: '17-22s', head: 'Greenhouse', copy: '作りかけも共有できる', image: '04-greenhouse.png' },
    { time: '22-24s', head: 'CTA', copy: 'β版、触ってください', image: '01-home.png' },
  ],
});

await makeStoryboard({
  file: 'pattern-b-storyboard.png',
  title: ['開発者向け：', '作る前に欲しい人に出会う'],
  variants: [
    { time: '0-3s', head: 'Pain', copy: '誰も使わない不安を減らす', image: '02-ideas.png' },
    { time: '3-7s', head: 'Find', copy: '実際の困りごとを探す', image: '02-ideas.png' },
    { time: '7-11s', head: 'Bring WIP', copy: '作りかけを持ち込む', image: '03-submit.png' },
    { time: '11-15s', head: 'Feedback', copy: '早めに反応をもらう', image: '04-greenhouse.png' },
    { time: '15-19s', head: 'Beta', copy: 'テスター募集へつなげる', image: '05-idea-detail.png' },
    { time: '19-21s', head: 'CTA', copy: 'βで一緒に育ててください', image: '01-home.png' },
  ],
});

await makeStoryboard({
  file: 'pattern-c-storyboard.png',
  title: ['ユーザー向け：', '欲しいアプリに声を足す'],
  variants: [
    { time: '0-2s', head: 'Question', copy: 'こんなアプリ欲しい？', image: '01-home.png' },
    { time: '2-6s', head: 'Browse', copy: '共感できるアイデアを探す', image: '02-ideas.png' },
    { time: '6-10s', head: 'Support', copy: '応援で見つかりやすく', image: '05-idea-detail.png' },
    { time: '10-14s', head: 'Comment', copy: '自分の状況をコメント', image: '05-idea-detail.png' },
    { time: '14-18s', head: 'Test', copy: 'βテストの候補に', image: '04-greenhouse.png' },
    { time: '18-20s', head: 'CTA', copy: 'β版公開中', image: '01-home.png' },
  ],
});

await makeThumbnail();

console.log(`Generated launch assets in ${exportsDir}`);
