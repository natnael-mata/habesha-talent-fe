/* Generates the demo clips the player streams.
 *
 * PRODUCT.md § Evidence on Hand: there are no real talent videos and none
 * may be faked. So these are not pretend performances — they are printed
 * demo slates in the product's own visual world (foil ground, spot inks,
 * halftone screen, registration frame), each labelled የሙከራ ቪዲዮ so nobody in
 * the pitch room mistakes one for a real upload.
 *
 * The slate is rendered by headless Chrome — which has the Ethiopic fonts
 * and shapes Amharic correctly — then ffmpeg wipes a squeegee across it and
 * encodes to baseline H.264 for the mid-range Androids in the use scene.
 * (This ffmpeg-static build has no `drawtext`, hence Chrome.)
 *
 * Run: npm run demo:media
 */

import { execFile } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { promisify } from 'node:util'
import path from 'node:path'
import os from 'node:os'
import ffmpeg from 'ffmpeg-static'

const run = promisify(execFile)

const OUT = path.resolve('public/demo')
const TMP = path.join(os.tmpdir(), 'habesha-slates')
const W = 1280
const H = 720
const DUR = 10

const CLIPS = [
  { n: 1, ground: '#ff2d7a', blade: '#f7961d', label: 'የሙከራ ቪዲዮ', num: '፩' },
  { n: 2, ground: '#f7961d', blade: '#ff2d7a', label: 'የሙከራ ቪዲዮ', num: '፪' },
  { n: 3, ground: '#e4e4e0', blade: '#ff2d7a', label: 'የሙከራ ቪዲዮ', num: '፫' },
  { n: 4, ground: '#ff2d7a', blade: '#141412', label: 'የሙከራ ቪዲዮ', num: '፬' },
  { n: 5, ground: '#f7961d', blade: '#141412', label: 'የሙከራ ቪዲዮ', num: '፭' },
]

const slateHtml = (c) => `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
  body{
    background:${c.ground};
    font-family:"Noto Sans Ethiopic",sans-serif;
    display:grid;place-items:center;position:relative;
  }
  .dots{position:absolute;inset:0;
    background-image:radial-gradient(circle at 50% 50%, rgba(0,0,0,.4) 1.4px, transparent 1.8px);
    background-size:6px 6px;mix-blend-mode:multiply}
  .frame{position:absolute;inset:48px;border:6px solid #141412}
  .reg{position:absolute;width:34px;height:34px;
    background:linear-gradient(#141412 0 0) center/100% 4px no-repeat,
               linear-gradient(#141412 0 0) center/4px 100% no-repeat}
  .tl{top:31px;left:31px}.tr{top:31px;right:31px}
  .bl{bottom:31px;left:31px}.br{bottom:31px;right:31px}
  .mid{text-align:center;color:#141412;z-index:2}
  .num{font-size:190px;font-weight:900;line-height:1;
       text-shadow:10px 9px 0 ${c.blade}}
  .lab{font-size:58px;font-weight:900;margin-top:18px;
       text-shadow:5px 5px 0 ${c.blade}}
  .brand{font-size:26px;font-weight:700;margin-top:26px;letter-spacing:0}
  .stamp{position:absolute;left:70px;bottom:70px;z-index:2;
    background:#141412;color:#e4e4e0;padding:8px 16px;font-size:22px;font-weight:700}
</style>
<div class="frame"></div>
<span class="reg tl"></span><span class="reg tr"></span>
<span class="reg bl"></span><span class="reg br"></span>
<div class="mid">
  <div class="num">${c.num}</div>
  <div class="lab">${c.label}</div>
  <div class="brand">ሀበሻ ታለንት</div>
</div>
<div class="stamp">የሙከራ መረጃ</div>
<div class="dots"></div>`

mkdirSync(OUT, { recursive: true })
mkdirSync(TMP, { recursive: true })

const bladeW = 90
const travel = W + bladeW
/* The squeegee crosses the sheet twice in ten seconds. */
const x = `'mod(t*${travel / (DUR / 2)}, ${travel}) - ${bladeW}'`

for (const c of CLIPS) {
  const html = path.join(TMP, `slate-${c.n}.html`)
  const png = path.join(TMP, `slate-${c.n}.png`)
  writeFileSync(html, slateHtml(c))

  await run('google-chrome', [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--window-size=${W},${H}`,
    `--screenshot=${png}`,
    `file://${html}`,
  ])

  const out = path.join(OUT, `clip-${c.n}.mp4`)
  await run(
    ffmpeg,
    [
      '-y',
      '-loop', '1',
      '-t', String(DUR),
      '-i', png,
      '-vf',
      [
        `drawbox=x=0:y=0:w=${x}:h=${H}:color=${c.blade.replace('#', '0x')}@0.18:t=fill`,
        `drawbox=x=${x}:y=0:w=${bladeW}:h=${H}:color=${c.blade.replace('#', '0x')}:t=fill`,
        'noise=alls=10:allf=t+u',
        'format=yuv420p',
      ].join(','),
      '-r', '24',
      '-c:v', 'libx264',
      '-profile:v', 'baseline',
      '-movflags', '+faststart',
      '-crf', '30',
      out,
    ],
    { maxBuffer: 1 << 26 },
  )
  console.log(`pulled ${path.relative(process.cwd(), out)}`)
}

rmSync(TMP, { recursive: true, force: true })
