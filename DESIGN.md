# Design

Visual system for ሀበሻ ታለንት. Product truth lives in [PRODUCT.md](PRODUCT.md); this file
owns durable visual decisions only.

The world is **the silkscreen loft** — a print shop where portraits are pulled by hand in
off-register spot inks and hung on a drying rack. It was dealt as a challenger against the
assigned direction (the azmari bet) and **chosen by the user**, so it wins the roll.

## The fusion, and where clarity overruled the source

The source's native topology is *one subject, thirty variations* — a rack of the same face
pulled thirty times. A talent feed is the inverse: thirty performers seen once each. That
conflict is resolved in the product's favour, and the resolution is the whole system:

- **The rack is the feed.** The constant is the frame, the registration marks and the
  margin; the variable is who is in it. A grid of unknown Ethiopians reads as an edition
  worth collecting rather than a wall of thumbnails.
- **The editions moved into state.** The source says states appear as *ink shifts,
  misregistration and colour swaps across otherwise identical frames*. So they do: a card's
  ink tells you its state, and the frame never changes.
- **A view is a pull.** Every play pulls another print, so `እይታዎች` is rendered as an edition
  size — a number that only ever grows, set in the margin the way an edition is annotated.
  This is the one place the source's obsession and the product's metric are the same thing.

## Scene, and what it forces

A subscriber opens this one-handed on a mid-range Android, outdoors in bright Addis
daylight, on a data bundle they paid for. That decides the ground: **light**. Silver foil
is a light ground, so the world and the scene agree without compromise. It also decides
that nothing autoplays and nothing preloads — the press bed sits black and still until
someone asks for it.

## Colour strategy: full palette

Four named roles, not an accent on neutral. The foil is the paper, black is the only ink
that carries text, and pink and marigold are the two screens pulled over it.

### Tokens

| Role | Token | Value |
|---|---|---|
| **Foil ground** (base) | `--foil` | `#E4E4E0` |
| Foil highlight (streak) | `--foil-hi` | `#F7F7F5` |
| Foil shadow (crease) | `--foil-lo` | `#B6B6B1` |
| Deeper foil, sunken panels | `--foil-deep` | `#CDCDC8` |
| **Body ink** — all text | `--ink` | `#141412` |
| Secondary ink | `--ink-2` | `#46443E` |
| Margin annotation ink | `--ink-3` | `#6A675E` |
| **Fluro pink** — first pull | `--pink` | `#FF2D7A` |
| Pink, pressed/deep | `--pink-deep` | `#E31063` |
| **Pink that may be text on foil** | `--pink-ink` | `#C4004E` |
| **Marigold** — second pull | `--marigold` | `#F7961D` |
| **Marigold that may be text on foil** | `--marigold-ink` | `#8A5000` |
| Press bed (video, dark panels) | `--bed` | `#0C0C0B` |
| Rule / frame | `--rule` | `#141412` |

### Measured contrast, and the rule it forces

| Pairing | Ratio | Verdict |
|---|---|---|
| `--ink` on `--foil` | 15.0:1 | The default. |
| `--ink` on `--pink` | **5.2:1** | Passes AA — this is why every pink button carries **black** text. |
| White on `--pink` | 3.6:1 | Fails at body size. **Never used.** |
| `--ink` on `--marigold` | **8.2:1** | Excellent. |
| `--pink` as text on `--foil` | **2.8:1** | Fails. Pink is a **field**, never ink. |
| `--marigold` as text on `--foil` | 1.8:1 | Fails badly. Field only. |
| `--pink-ink` on `--foil` | 4.7:1 | The only pink allowed to be a letter. |
| `--marigold-ink` on `--foil` | 5.0:1 | The only marigold allowed to be a letter. |

The spot inks own whole regions — card grounds, button fills, the active nav cell, the
ink-offset behind display type. The moment one is asked to be a *line or a letter* on foil
it becomes `--pink-ink` / `--marigold-ink`. Reaching for the bright pull there is the
mistake this table exists to prevent.

### Ink states

State is carried by which screen was pulled. Colour is never the only encoding — every
state also carries an Amharic word and a distinct frame mark.

| State | Ink | Amharic label |
|---|---|---|
| New this week | pink pull | `አዲስ` |
| Playing / active / focused | marigold pull | `በመታየት ላይ` |
| At rest / already seen | no pull, black on foil | (no label; absence is the signal) |
| **Error / failure** | **marigold field, black ink, 4px black key plate** | the message itself |

**Error is marigold, not pink, and the reason is worth keeping.** Pink is the
primary button's field. An error plate in pink sits inside the same panel at the
same width with the same rule, and the two stop reading as different objects —
"this failed" becomes indistinguishable from "press this". Marigold carries
black at 8.2:1 and is the only other field in this system. Pink has exactly two
jobs: **new**, and **the primary action**. Giving it a third meaning is the
specific failure this row exists to prevent.

## Type

Ethiopic is the design case. Every rule below starts from the script, not from Latin.

| Role | Family | Notes |
|---|---|---|
| Display + all Amharic text | **Noto Sans Ethiopic** (variable, self-hosted) | 400 / 500 / 700 / 900 |
| Figures, edition numbers, margin codes | **Anton** (self-hosted) | Digits and registration marks only |
| Small technical labels, dates | **Archivo** (variable, self-hosted) | Digits and Latin only |

**As built:** the Latin faces are listed *first* in every stack
(`'Anton', 'Noto Sans Ethiopic', …`) and the Ethiopic face carries a
`unicode-range`. The fallback chain is therefore doing deliberate typographic
work rather than error handling: digits set in Anton or Archivo and Amharic
falls through to Noto in the same run of text, with no wrapper spans.
`font-synthesis-weight: none` is global, because Anton ships one weight and a
faux-bolded Anton at display size is a smear.

**Two label classes, and the distinction is load-bearing:**

| Class | Tracking | May contain |
|---|---|---|
| `.code` | `0.14em` | **Latin and digits only** — durations, file sizes, credentials |
| `.label` | `0` | Anything, including Amharic. Carries a small pink tick instead of tracking, so it still reads as a technical label |

Reaching for `.code` on an Amharic string is the specific mistake this split
exists to prevent, and `tests/amharic.test.ts` asserts `.label` never tracks.

Fonts are **self-hosted in `public/fonts`**, never a CDN — the pitch runs on a meeting-room
connection that may not exist. Total face payload is ~250KB.

**Ethiopic rules, non-negotiable:**

- **Never `letter-spacing` Ethiopic.** Tracking pulls apart glyphs whose meaning lives in
  their attached vowel marks. Tracking is permitted on Latin/digit labels only.
- **Never `text-transform`.** Ethiopic has no case; the source world's all-caps headline is
  achieved through weight, scale and the ink offset instead.
- **Body sets larger and looser than a Latin equivalent** — 17px minimum, `line-height`
  1.65. Ethiopic carries more internal detail per glyph than Latin at the same size.
- Display sets at 900 weight with `line-height` 1.06–1.15 and never below 28px, because the
  off-register offset needs mass behind it to read as ink rather than as a blur.

## Signature devices

1. **The pull.** Every display element carries its misregistration: a solid copy of itself
   displaced 3–6px in pink, and often a second in marigold on the opposite axis. On type
   this is layered `text-shadow` with **zero blur**; on frames it is a displaced solid box.
   A pull is never a soft shadow — a blurred offset is the failure mode of this world.
2. **Registration marks.** Crosshairs at frame corners and ticks breaking the mid-edge of
   every button. They are the world's own punctuation and they carry real meaning here:
   corner marks bound a *frame*, edge ticks mark a *pressable*.
3. **The halftone screen.** A real dot screen at ~3px pitch over every ink field and every
   image, visible at reading distance. Rendered as a repeating radial-gradient or an SVG
   pattern — never a noise texture, never a blur.
4. **The drying rack.** The feed grid: equal frames on a shared baseline, bounded by a 1px
   pink registration rule with corner crosshairs and hand-annotated margins.
5. **The squeegee.** The single orchestrated motion of the product: a hard-edged bar that
   wipes ink across a surface. Reveals, page entries and the login rack all use it. Nothing
   in this product fades. It is also *operable*: the blade on the login rack can be dragged,
   and every release pulls the rack again in the next ink.
6. **The edition sheet.** On the detail page, an unplayed video sits behind ten pulls of the
   *same* performer — one face, ten registrations, three inks. This is the source world's
   real subject, and it belongs here rather than in the feed: the rack is many people seen
   once, the sheet is one person printed ten times. `PerformerPrint` takes identity from
   `seed` and registration from `seed:variant`, so the ten cells are demonstrably one
   person rather than ten strangers.

## Components

- **Frames:** `border-radius: 0` everywhere. 2px `--rule` border. No blur shadow at rest.
- **Buttons:** rectangular, ≥48px tall, `--pink` fill with **`--ink`** text, 2px rule, tick
  marks breaking left and right mid-edge, and a 4px ink offset that **collapses to 0 on
  press** — the print landing.
- **Inputs:** 2px rule on `--foil-hi`, no radius. Focus swaps the rule to `--marigold` and
  adds the marigold offset; the focus state is a visible 3px mark, never a browser default.
- **Nav:** a row of black-ruled cells; the active cell takes a full `--pink` field with
  black text, not a coloured label.
- **Press bed:** the video surface and any dark panel is `--bed`, framed by a 2px rule with
  corner crosshairs. It stays black and empty until a play is requested.
- **Touch targets:** never below 44px.

**As built — no scrim on the press bed.** The obvious way to float a play button over
artwork is a dark wash. Here it turns fluro pink into maroon and marigold into brown, which
destroys the only thing the edition sheet is showing. The play control earns its contrast
from its own hard-edged plate instead: a 116px pink square, 3px black rule, offset in
marigold *and* black. Hover tints the sheet marigold rather than darkening it.

## Motion

One orchestrated gesture — the squeegee wipe (220ms, `cubic-bezier(.2,.7,.2,1)`, hard
edge) — plus the press collapse (90ms). Cards reveal by wipe on first paint, staggered
across the rack the way a rack fills. Under `prefers-reduced-motion: reduce` every wipe
resolves instantly and nothing moves; **content is visible by default in every case**, so a
failed animation can never hide a video.

**As built — the wipe is a `@starting-style` transition, never a delayed animation.**
The first implementation used `animation: wipe-in … both` with a staggered
`animation-delay`, and it was wrong in a way worth recording: a `backwards` fill holds the
hidden first frame *through the delay*, so anything that stops animations from running
leaves the content invisible. It was caught by a screenshot in which most of the rack was
an empty black grid. The resting state is now the visible one, and the clip is what the
browser transitions *from* (`--wipe-delay` carries the stagger):

```css
.wipe { clip-path: inset(0 0 0 0); transition: clip-path var(--wipe);
        transition-delay: var(--wipe-delay, 0ms); }
@starting-style { .wipe { clip-path: inset(0 100% 0 0); } }
```

**As built — the upload progress bar is one composited carriage.** A meter built the
obvious way (`transition: width` for the ink, `transition: left` for the blade) animates
two layout properties every frame. Both now ride a single full-width element translated by
percentage, with the blade as its `::after` at the leading edge — one `transform`, no
layout. The target device is the cheap Android in the use scene, not the laptop this was
built on.

## Imagery

No real photographs, and none may be faked. Every performer portrait is an **authored
procedural silkscreen print**: a bust built from primitives (head, hair mass, shoulders,
and a category prop — mic, krar, masinko, raised eskista arm), screened to halftone dots,
pulled in a seeded ink pair with a seeded misregistration offset and screen angle. Each is
a genuine variant, produced the way the world produces variants, and no real person is
depicted under a fabricated name. Demo videos are generated in the same grammar and are
labelled on screen.

## Prohibitions

- **No `border-radius` anywhere.** Not on cards, buttons, inputs, avatars or the player.
- **No blurred shadow.** The only offset in this system is a solid displaced copy.
- No gradient except the foil texture and the squeegee bar.
- `--pink` and `--marigold` are never text on foil; no white text on pink, ever.
- Never letter-space or uppercase Ethiopic.
- No autoplay, no `preload="auto"` on video, no decorative megabytes — the bundle is the
  user's money.
- No emoji, no icon library, no CDN asset.
- No unlabeled demo figure: anything mistakable for live data carries a demo marker.
