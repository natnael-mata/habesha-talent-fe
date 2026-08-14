/* Design capture rig.
 *
 * Drives headless Chrome over CDP so the signed-in pages can be inspected:
 * it seeds the session the app would have written, then navigates. Nothing
 * in src/ knows this exists — there is no auth bypass in the product.
 *
 * Usage: node scripts/shoot.mjs [--mobile] [--motion]
 */

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = 'http://localhost:5180'
const OUT = '.shots'
const PORT = 9333
const mobile = process.argv.includes('--mobile')
const motion = process.argv.includes('--motion')

const W = mobile ? 390 : 1440
const H = mobile ? 844 : 980
const tag = mobile ? 'm' : 'd'

mkdirSync(OUT, { recursive: true })

const chrome = spawn(
  'google-chrome',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    ...(motion ? [] : ['--force-prefers-reduced-motion']),
    `--remote-debugging-port=${PORT}`,
    `--window-size=${W},${H}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

let ws
try {
  let target
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(250)
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      target = list.find((t) => t.type === 'page')
    } catch {
      /* not up yet */
    }
  }
  if (!target) throw new Error('chrome did not expose a page target')

  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = rej
  })

  let id = 0
  const pending = new Map()
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result)
      pending.delete(m.id)
    }
  }
  const send = (method, params = {}) =>
    new Promise((res) => {
      const n = ++id
      pending.set(n, res)
      ws.send(JSON.stringify({ id: n, method, params }))
    })

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: W,
    height: H,
    deviceScaleFactor: 1,
    mobile,
  })

  const goto = async (path, { auth = false, wait = 1400 } = {}) => {
    await send('Page.navigate', { url: `${BASE}/` })
    await sleep(500)
    /* Always sign out first — a session left over from a previous shot would
       bounce the login capture straight to the feed. The session is an
       httpOnly cookie, so it is dropped through the API, not from storage. */
    await send('Runtime.evaluate', {
      expression: `fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).then(r=>r.status)`,
      awaitPromise: true,
    })
    await sleep(300)
    if (auth) {
      /* Sign in the way a subscriber does. Nothing in src/ knows this script
         exists, and there is no auth bypass in the product. */
      await send('Runtime.evaluate', {
        expression: `fetch('/api/auth/login',{method:'POST',credentials:'same-origin',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({phone_number:'0911223344',password:'talent123'})}).then(r=>r.status)`,
        awaitPromise: true,
      })
      await sleep(400)
    }
    await send('Page.navigate', { url: `${BASE}${path}` })
    await sleep(wait)
  }

  const shot = async (name, full = false) => {
    const r = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: full,
      ...(full ? { clip: undefined } : {}),
    })
    writeFileSync(`${OUT}/${tag}-${name}.png`, Buffer.from(r.data, 'base64'))
    console.log(`${OUT}/${tag}-${name}.png`)
  }

  await goto('/')
  await shot('login')

  await goto('/subscribe')
  await shot('subscribe')

  await goto('/videos', { auth: true, wait: 1900 })
  await shot('feed')

  await goto('/watch/3', { auth: true, wait: 1900 })
  await shot('watch')

  await goto('/upload', { auth: true })
  await shot('upload')

  /* Error states, driven through the real form rather than mocked up. */
  await goto('/')
  await send('Runtime.evaluate', {
    expression: `(() => {
      const set = (el, v) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const [phone, pw] = document.querySelectorAll('input');
      set(phone, '0911223344'); set(pw, 'wrongpassword');
      document.querySelector('form').requestSubmit();
    })()`,
  })
  await sleep(1600)
  await shot('login-error')
} finally {
  ws?.close()
  chrome.kill()
}
