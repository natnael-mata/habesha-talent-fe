# ሀበሻ ታለንት — Habesha Talent (front end)

The Amharic talent-video web app for Ethio Telecom subscribers: log in with a
phone number, upload a talent video, watch what everyone else posted.

Operated by **B AND M Software Development & Entertainment PLC**, in partnership
with Ethio Telecom.

> **Companion repository:** the VAS provisioning endpoint lives in
> **`habesha-talent-be`**. It is the only thing that creates subscriber
> accounts — see below.

> **This app has no signup form, and must never grow one.** A subscriber
> subscribes by SMS on their own line; Ethio Telecom's VAS provisions them,
> issues a password, and `POST`s both to the back end, which inserts the row.
> An account this app minted itself would not exist on the operator's side, so
> the subscriber would not be subscribed, not be billed, and could not be
> reconciled. `/subscribe` is an instructions page, not a form.

> **Two data modes.** By default the app talks to the real API at `/api`
> (`habesha-talent-be`). `npm run dev:mock` switches to an in-memory mock with
> no server, no database and no network at all — that is what the Ethio Telecom
> pitch runs on, so a meeting room with a dead connection cannot break the demo.
> Either way the demo content is authored and marked as such in the interface;
> see [TASK.md](TASK.md) § Flagged for what still needs a real asset.

| Document | What it owns |
|---|---|
| [PLAN.md](PLAN.md) | The original v1 brief |
| [PRODUCT.md](PRODUCT.md) | Product truth — users, purpose, constraints |
| [DESIGN.md](DESIGN.md) | The visual system, tokens and prohibitions |
| [TASK.md](TASK.md) | Build tasks, what is flagged, what is out of scope |
| [TEST.md](TEST.md) | Test coverage across four layers |

These records cover the whole product, back end included, and live here because
this is where the product and design work happens.

## Run it

Against the real API — start `habesha-talent-be` first (see its README), then:

```bash
npm install && npm run dev
```

Open <http://localhost:5180>. Vite proxies `/api` and `/media` to the back end
on :8091, so the browser sees a single origin exactly as it will in production —
no CORS, no base URL, and cookies behave the same in both environments.

Or with no back end at all, for the pitch:

```bash
npm run dev:mock
```

The login page is the entry point either way.

**Demo sign-in** (also shown on the login screen behind a demo marker):

```
0911223344  ·  talent123
```

A second seeded account, `0922334455`, uses the same password.

## Other commands

```bash
npm run build
```

```bash
npm test
```

```bash
npm run verify
```

```bash
npm run demo:media
```

```bash
npm run build:mock
```

`verify` drives real Chrome over CDP against the running dev server and checks
every PLAN.md § 9 acceptance criterion a browser can prove — it needs the back
end running, because it exercises the real API. `demo:media`
regenerates the five demo clips in `public/demo/` — it renders each slate in
headless Chrome (which has the Ethiopic fonts) and encodes with `ffmpeg-static`
to baseline H.264, the profile that plays on the mid-range Androids this product
targets. The clips are committed, so you only need it if you change the slates.

## Stack

- **React 19 + TypeScript + Vite**, React Router for the five routes.
- **No runtime dependencies beyond React and the router.** No UI kit, no icon
  library, no CSS framework, no CDN.
- **Fonts are self-hosted** in `public/fonts` (Noto Sans Ethiopic, Anton,
  Archivo — ~250KB total). The pitch has to run on a meeting-room connection
  that may not exist, so nothing loads from a network at runtime.

## Layout

```
locales/am.json          every visible string — no hard-coded text in components
src/config.ts            SMS keyword + shortcode, behind a `confirmed` flag
src/i18n.ts              t(), Amharic number + date formatting
src/api/types.ts         the data model, matching PLAN.md § 6
src/api/index.ts         THE SEAM — picks http or mock; pages import from here
src/api/http.ts          the real client, same-origin /api
src/api/mock.ts          in-memory implementation for the offline pitch
src/api/demoData.ts      authored demo content
src/auth/AuthContext.tsx session + the route guard (no register — by design)
src/components/          Mark, Field, VideoCard, PerformerPrint, PressFoot…
src/pages/               Login, Subscribe, Feed, Watch, Upload
src/styles/tokens.css    colour, type and motion tokens (see DESIGN.md)
src/styles/press.css     the silkscreen device layer
src/styles/pages.css     page compositions
scripts/make-demo-media  demo clip generator
scripts/shoot.mjs        design capture rig (CDP, desktop + mobile)
scripts/verify.mjs       browser acceptance checks
```

## How the app reaches the API

`src/api/index.ts` is the seam. It exports one set of names and picks the
implementation behind them, so no page, component or hook knows which it got:

| | |
|---|---|
| `src/api/http.ts` | the real client — same-origin `/api`, session in an httpOnly cookie |
| `src/api/mock.ts` | in-memory, zero network, for the pitch (`VITE_USE_MOCK=true`) |

| Function | Endpoint |
|---|---|
| `login` | `POST /api/auth/login` |
| `currentSession` / `logout` | `GET /api/auth/me` · `POST /api/auth/logout` |
| `listVideos` | `GET /api/videos?page=&page_size=` |
| `getVideo` | `GET /api/videos/:id` |
| `recordView` | `POST /api/videos/:id/view` |
| `listBySubscriber` | `GET /api/subscribers/:id/videos` |
| `uploadVideo` | `POST /api/videos` (multipart) |

Subscriber creation is absent by design — `POST /api/vas/register` is the
operator's callback and is never reached from the browser.

Three properties both implementations hold, and any replacement must keep:

1. **The view increment is server-side.** The client asks; the server decides.
2. **Login failures are indistinguishable** between "no such number" and "wrong
   password", so the error cannot enumerate registered subscribers.
3. **Upload progress comes from XHR, not fetch** — fetch still cannot report it,
   and on a metered mobile connection that bar is not decoration.

## Deploying

A static bundle:

```bash
npm ci && npm run build
```

Serve `dist/`. Because routing is client-side, **unknown paths must fall back to
`index.html`** — otherwise a refresh on `/videos` is a 404. Most platforms call
this "SPA mode" or "rewrite all to index.html".

On AletCloud: build `npm run build`, output directory `dist`, SPA fallback on.
No environment variables, no database.

## Notes for whoever picks this up

- **Amharic is the design case, not a translation layer.** Never apply
  `letter-spacing` or `text-transform` to Ethiopic — `DESIGN.md § Type` explains
  why, and `.code` (tracked, Latin only) is deliberately separate from `.label`
  (untracked, safe for Amharic). A test enforces it.
- **Nothing autoplays and nothing preloads.** The audience buys data in small
  bundles; a tap costs them money.
- **Portraits are generated, not photographed.** `PerformerPrint` pulls a
  silkscreen bust from a seed, so no real person is depicted under a fabricated
  name. Real thumbnails replace it via `videos.thumbnail_path`.
