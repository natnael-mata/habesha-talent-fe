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

> **All data here is mocked.** Every video, creator name and view count on
> screen is authored demo content, marked as such in the interface. See
> [TASK.md](TASK.md) § Flagged for what still needs a real asset or a decision.

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

```bash
npm install && npm run dev
```

Then open <http://localhost:5180>. The login page is the entry point.

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

`verify` drives real Chrome over CDP against the running dev server and checks
every PLAN.md § 9 acceptance criterion a browser can prove. `demo:media`
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
src/api/mock.ts          THE SEAM — mock REST, swap for the real backend here
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

## Wiring it to the real API

`src/api/mock.ts` is the only file that knows where data comes from. Each
exported function documents the endpoint it stands in for:

| Function | Endpoint |
|---|---|
| `provisionSubscriber` | `POST /api/vas/register` — **built, in `habesha-talent-be`** |
| `login` | `POST /api/auth/login` |
| `currentSession` / `logout` | `GET /api/auth/me` · `POST /api/auth/logout` |
| `listVideos` | `GET /api/videos?page=&page_size=` |
| `getVideo` | `GET /api/videos/:id` |
| `recordView` | `POST /api/videos/:id/view` |
| `listBySubscriber` | `GET /api/subscribers/:id/videos` |
| `uploadVideo` | `POST /api/videos` (multipart) |

Replace the bodies with `fetch` calls and keep the signatures. Two things the
mock already enforces that the server must keep:

1. **The view increment is server-side.** The client asks; the server decides.
2. **Login failures are indistinguishable** between "no such number" and "wrong
   password", so the error cannot be used to enumerate registered subscribers.

`provisionSubscriber` is documented here for reference only — the front end
never calls it, and never should.

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
