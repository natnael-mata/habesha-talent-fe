/* Acceptance check.
 *
 * Drives the real UI over CDP and asserts the PLAN.md § 9 criteria that only
 * a running browser can prove: the login page is the entry point, a wrong
 * password produces the Amharic error, a correct one lands on the feed, and
 * playing a video increments the count server-side and keeps it after reload.
 *
 * Usage: node scripts/verify.mjs   (dev server must be running on :5180)
 */

import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = 'http://localhost:5180'
const PORT = 9444

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
}

const chrome = spawn(
  'google-chrome',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,980',
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

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    return r?.result?.value
  }
  const goto = async (p, wait = 1600) => {
    await send('Page.navigate', { url: `${BASE}${p}` })
    await sleep(wait)
  }
  const fill = (selIndex, value) =>
    evaluate(`(() => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      const el = document.querySelectorAll('input:not([type=file])')[${selIndex}];
      set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`)
  const submit = () => evaluate(`document.querySelector('form').requestSubmit(), true`)

  // ── 1. The login page is the entry point ─────────────────────────────
  await goto('/')
  await evaluate('sessionStorage.clear()')
  await goto('/')
  check(
    'Opening the site shows the login page with logo and promo content',
    (await evaluate(`document.body.innerText.includes('ተሰጥኦዎን ለዓለም ያሳዩ!')`)) === true &&
      (await evaluate(`!!document.querySelector('form') && !!document.querySelector('svg')`)) === true,
  )

  // ── 2. An authed route bounces to login ──────────────────────────────
  await goto('/videos')
  check(
    'Visiting /videos unauthenticated redirects to the login page',
    (await evaluate('location.pathname')) === '/',
  )

  // ── 3. Wrong password → the Amharic error ────────────────────────────
  await goto('/')
  await fill(0, '0911223344')
  await fill(1, 'definitely-wrong')
  await submit()
  await sleep(1500)
  const err = await evaluate(`document.querySelector('[role=alert]')?.innerText ?? ''`)
  check(
    'Wrong password shows the Amharic invalid-login error',
    err.includes('ስልክ ቁጥር ወይም የይለፍ ቃል ትክክል አይደለም'),
    JSON.stringify(err),
  )
  check('…and stays on the login page', (await evaluate('location.pathname')) === '/')

  // ── 4. Correct password → the video list ─────────────────────────────
  await fill(1, 'talent123')
  await submit()
  await sleep(1900)
  check(
    'Correct login lands on the video list',
    (await evaluate('location.pathname')) === '/videos',
  )

  const cardCount = await evaluate(`document.querySelectorAll('.card').length`)
  check('The list renders a rack of cards', cardCount > 0, `${cardCount} cards`)

  check(
    'Every card shows title, posted date, views and creator',
    (await evaluate(`(() => {
      const cards = [...document.querySelectorAll('.card')];
      return cards.length > 0 && cards.every(c =>
        c.querySelector('.card__title')?.innerText.trim() &&
        c.querySelector('.stamp__n')?.innerText.trim() &&
        c.querySelectorAll('.metum__v').length === 2 &&
        [...c.querySelectorAll('.metum__v')].every(m => m.innerText.trim())
      );
    })()`)) === true,
  )

  // ── 5. The subscribe page is instructions, NOT a signup form ─────────
  await evaluate(`sessionStorage.removeItem('habesha-talent/session/v1'), true`)
  await goto('/subscribe')
  check(
    'The subscribe page carries no account-creating form',
    (await evaluate(`document.querySelectorAll('form').length === 0`)) === true,
  )
  check(
    'It shows the SMS keyword and shortcode to send',
    (await evaluate(`!!document.querySelector('.smsplate__msg') && !!document.querySelector('.smsplate__code')`)) === true,
  )
  check(
    'Unconfirmed shortcode is visibly marked as unconfirmed',
    (await evaluate(`!!document.querySelector('.smsplate__todo')`)) === true,
  )
  await goto('/register')
  check(
    'The old /register URL redirects to /subscribe',
    (await evaluate('location.pathname')) === '/subscribe',
  )

  // Sign back in — the duplicate-registration check above signed us out, and
  // every remaining assertion is about an authenticated page.
  await goto('/')
  await fill(0, '0911223344')
  await fill(1, 'talent123')
  await submit()
  await sleep(1900)
  check('Signed back in for the remaining checks', (await evaluate('location.pathname')) === '/videos')

  // ── 6. Playing a video increments the count, and it survives a reload ─
  await goto('/watch/3')
  const before = Number(
    (await evaluate(`document.querySelector('.edition__n').innerText.replace(/\\D/g,'')`)) || 0,
  )
  await evaluate(`document.querySelector('.bed__play').click(), true`)
  await sleep(1400)
  const after = Number(
    (await evaluate(`document.querySelector('.edition__n').innerText.replace(/\\D/g,'')`)) || 0,
  )
  check('Playing a video increments the view count', after === before + 1, `${before} → ${after}`)

  await goto('/watch/3')
  const reloaded = Number(
    (await evaluate(`document.querySelector('.edition__n').innerText.replace(/\\D/g,'')`)) || 0,
  )
  check(
    'The incremented count is still there after a reload',
    reloaded === after,
    `${reloaded}`,
  )

  // ── 7. The player really plays the demo file ─────────────────────────
  // A scripted .click() is not a trusted gesture, so Chrome's autoplay policy
  // would reject play() for a reason no real tap ever hits. Dispatch a real
  // input event at the button's coordinates instead.
  const box = await evaluate(`(() => {
    const r = document.querySelector('.bed__playmark').getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  })()`)
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', {
      type,
      x: box.x,
      y: box.y,
      button: 'left',
      clickCount: 1,
    })
  }
  await sleep(2600)
  const media = await evaluate(`(() => {
    const v = document.querySelector('video');
    return v ? { src: !!v.currentSrc, ready: v.readyState, err: v.error?.code ?? null } : null;
  })()`)
  check(
    'The HTML5 player loads the demo clip',
    !!media && media.src && media.err === null && media.ready > 0,
    JSON.stringify(media),
  )

  // ── 8. No English leaked into the rendered page ──────────────────────
  await goto('/videos')
  const leaked = await evaluate(`(() => {
    const skip = new Set(['SCRIPT','STYLE']);
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const bad = [];
    while (walk.nextNode()) {
      const n = walk.currentNode;
      if (skip.has(n.parentElement?.tagName)) continue;
      const txt = n.textContent.trim();
      // digits, punctuation and the masked-phone separator are fine
      if (/[A-Za-z]{2,}/.test(txt)) bad.push(txt);
    }
    return bad;
  })()`)
  check('No English text rendered on the video list', leaked.length === 0, JSON.stringify(leaked))

  // ── 9. Nothing preloads video on the list or before play ─────────────
  await goto('/watch/5')
  check(
    'The player does not preload — the bundle is the subscriber’s money',
    (await evaluate(`document.querySelectorAll('video').length === 0`)) === true,
  )
} finally {
  ws?.close()
  chrome.kill()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
