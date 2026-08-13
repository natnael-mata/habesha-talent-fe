/* An authored silkscreen print, generated per performer.
 *
 * DESIGN.md § Imagery: no real photographs and none may be faked, so every
 * portrait is pulled the way this world pulls portraits — a flesh plate in
 * foil, a key plate in black, deliberately out of register, over a spot-ink
 * ground, screened to visible halftone dots. The seed decides the ink, the
 * misregistration, the screen angle, the hair mass and the head shape, so
 * twelve cards are twelve genuine variants rather than one asset tinted
 * twelve ways.
 *
 * The act lives in the print, not in a caption: a mic reaching the mouth, a
 * masinko across the chest, a second pull ghosting a dancer's head. Anything
 * that could not be read at thumbnail size was cut rather than shrunk — a
 * prop nobody recognises is worse than no prop.
 */

import { useMemo } from 'react'
import type { Category } from '../api/types'

type Pull = 'pink' | 'marigold' | 'rest'

interface Props {
  seed: string
  category: Category
  pull?: Pull
  /** Larger prints get a finer screen, the way a bigger sheet would. */
  dotScale?: number
  /** Another pull of the SAME face. Identity comes from `seed`; the variant
   *  only moves the registration and the screen angle, which is what
   *  actually differs between two prints off one screen. */
  variant?: number
  title?: string
}

/* mulberry32 over a cheap string hash — stable across reloads so a
   performer's print never changes between the rack and the player. */
function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const HAIR = ['afro', 'shash', 'shuruba', 'crop', 'locs'] as const
type Hair = (typeof HAIR)[number]

const INK: Record<Pull, string> = {
  pink: '#ff2d7a',
  marigold: '#f7961d',
  rest: '#cdcdc8',
}
const FOIL = '#f2f2ef'
const KEY = '#141412'

const CY = 138

export default function PerformerPrint({
  seed,
  category,
  pull = 'pink',
  dotScale = 1,
  variant = 0,
  title,
}: Props) {
  const p = useMemo(() => {
    const r = rng(seed)
    /* Identity is drawn from `seed` and registration from `seed:variant`, so
       ten pulls of one performer are ten prints of the same person rather
       than ten different people. */
    const v = rng(`${seed}:${variant}`)
    return {
      hair: HAIR[Math.floor(r() * HAIR.length)] as Hair,
      /* Misregistration: the flesh plate slips against the key plate. Kept
         under 7px — past that the face reads as a skull rather than a
         mis-pull, which is the failure this number is tuned against. */
      dx: (v() * 2 - 1) * 6,
      dy: (v() * 2 - 1) * 5,
      angle: 15 + Math.floor(v() * 4) * 15,
      rx: 51 + r() * 7,
      ry: 63 + r() * 8,
      cx: 198 + (r() * 2 - 1) * 9,
      tilt: (r() * 2 - 1) * 9,
      bandY: 168 + r() * 74,
      flip: r() > 0.5,
      /* How close the sheet was shot. Without this every cell in the rack
         is the same head at the same size and the grid reads as wallpaper. */
      zoom: 0.9 + r() * 0.28,
      eye: 10.5 + r() * 3.5,
      lip: 0.24 + r() * 0.09,
    }
  }, [seed, variant])

  /* Must include the variant: ten pulls on one page would otherwise declare
     ten patterns under one id, and every url(#id) would resolve to the first
     one — so every cell would share a single screen angle. */
  const uid = useMemo(() => `p${Math.abs(hashCode(`${seed}:${variant}`))}`, [seed, variant])
  const ground = INK[pull]
  const blade = pull === 'marigold' ? INK.pink : INK.marigold

  const H = 300

  return (
    <svg
      viewBox={`0 0 400 ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={title ?? ''}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <pattern
          id={`${uid}-dots`}
          width={4 * dotScale}
          height={4 * dotScale}
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${p.angle})`}
        >
          <circle cx={2 * dotScale} cy={2 * dotScale} r={1.15 * dotScale} fill="#000" opacity="0.5" />
        </pattern>
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="0" width="400" height={H} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        {/* 1 — the ground, one spot ink */}
        <rect x="0" y="0" width="400" height={H} fill={ground} />
        {/* where the squeegee ran short and the second screen stopped */}
        <rect
          x="0"
          y={p.bandY * (H / 300)}
          width="400"
          height={H - p.bandY * (H / 300)}
          fill={KEY}
          opacity="0.08"
        />

        <g
          transform={`${p.flip ? ' translate(400,0) scale(-1,1)' : ''} translate(200 190) scale(${p.zoom}) translate(-200 -190)`}
        >
          {/* 2 — a dancer gets an extra pull: the head ghosted in the blade
                 ink, the way a sheet moves under the screen mid-stroke. */}
          {category === 'dance' && (
            <g transform="translate(-34 8)">
              <ellipse cx={p.cx} cy={CY} rx={p.rx} ry={p.ry} fill={blade} />
              {hairMass(p.hair, p.cx, p.rx, p.ry, blade, true)}
            </g>
          )}

          {/* 3 — the flesh plate, out of register */}
          <g transform={`translate(${p.dx} ${p.dy})`} fill={FOIL}>
            <path d={shoulders(p.cx, p.tilt)} />
            <rect x={p.cx - 19} y={CY + 42} width="38" height="44" />
            <ellipse cx={p.cx} cy={CY} rx={p.rx} ry={p.ry} />
          </g>

          {/* 4 — the key plate, black, on register */}
          <g fill={KEY}>{prop(category, p.cx, p.rx, p.ry)}</g>
          {hairMass(p.hair, p.cx, p.rx, p.ry, KEY, false)}
          {face(p.cx, p.rx, p.ry, category, p.eye, p.lip, blade)}
        </g>

        {/* 5 — the halftone screen, over the whole sheet */}
        <rect
          x="-40"
          y="-40"
          width="480"
          height={H + 80}
          fill={`url(#${uid}-dots)`}
          style={{ mixBlendMode: 'multiply' }}
        />
      </g>
    </svg>
  )
}

function hashCode(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

/** A thick line as a polygon — more predictable than a rotated rect when the
 *  endpoints are what actually matter. */
function bar(x1: number, y1: number, x2: number, y2: number, w: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * (w / 2)
  const ny = (dx / len) * (w / 2)
  return `M ${x1 + nx} ${y1 + ny} L ${x2 + nx} ${y2 + ny} L ${x2 - nx} ${y2 - ny} L ${x1 - nx} ${y1 - ny} Z`
}

function shoulders(cx: number, tilt: number) {
  const l = cx - 122
  const r = cx + 122
  return `M ${l} 300 C ${l + 14} ${238 + tilt}, ${cx - 64} ${210 + tilt}, ${cx} 210
          C ${cx + 64} ${210 - tilt}, ${r - 14} ${238 - tilt}, ${r} 300 Z`
}

/* Hair is the loudest shape on a two-plate portrait, so it carries most of
   the variation. One rule governs all five: strands fall BESIDE the face,
   never across it. Drawn over the eyes they read as bars, which is how the
   first pass of this rack ended up looking like a row of cages. */
function hairMass(
  hair: Hair,
  cx: number,
  rx: number,
  ry: number,
  fill: string,
  mono: boolean,
) {
  const top = CY - ry
  /* the parting lines cut back to the flesh plate; the ghost pull has no
     partings because it is a single ink */
  const part = mono ? fill : FOIL

  switch (hair) {
    case 'afro':
      /* The mass must clear CY - 0.30ry. Its first version was centred at
         CY - 0.46ry with ry * 0.94, which put its lower edge at CY + 0.48ry —
         below the eyes AND below the nostrils, both of which are painted in
         the same black. Every afro print was a faceless blob with a floating
         lip. The side puffs are free to hang lower because they sit at
         ±1.02rx, well outside the ±0.43rx where the eyes are. */
      return (
        <g fill={fill}>
          <ellipse cx={cx} cy={CY - ry * 0.8} rx={rx * 1.46} ry={ry * 0.6} />
          <ellipse cx={cx - rx * 1.02} cy={CY - ry * 0.34} rx={rx * 0.45} ry={ry * 0.5} />
          <ellipse cx={cx + rx * 1.02} cy={CY - ry * 0.34} rx={rx * 0.45} ry={ry * 0.5} />
        </g>
      )

    case 'shash':
      /* a netela wrapped over the crown, knotted and falling at one side */
      return (
        <g fill={fill}>
          <path
            d={`M ${cx - rx * 1.16} ${CY - ry * 0.2}
                C ${cx - rx * 1.24} ${top - 34}, ${cx + rx * 1.24} ${top - 34}, ${cx + rx * 1.16} ${CY - ry * 0.2}
                C ${cx + rx * 0.82} ${CY - ry * 0.56}, ${cx - rx * 0.82} ${CY - ry * 0.56}, ${cx - rx * 1.16} ${CY - ry * 0.2} Z`}
          />
          <ellipse cx={cx + rx * 1.14} cy={CY - ry * 0.44} rx={rx * 0.3} ry={ry * 0.26} />
          <path d={bar(cx + rx * 1.16, CY - ry * 0.28, cx + rx * 1.5, CY + ry * 0.66, 17)} />
          {!mono && (
            <path
              d={`M ${cx - rx * 1.1} ${CY - ry * 0.42}
                  C ${cx - rx * 0.9} ${top - 8}, ${cx + rx * 0.9} ${top - 8}, ${cx + rx * 1.1} ${CY - ry * 0.42}`}
              fill="none"
              stroke={part}
              strokeWidth="5"
            />
          )}
        </g>
      )

    case 'shuruba':
      /* cornrows: the partings run front to back OVER the crown, and the
         braids fall free only outside the face */
      return (
        <g fill={fill}>
          <path
            d={`M ${cx - rx * 1.06} ${CY - ry * 0.14}
                C ${cx - rx * 1.06} ${top - 20}, ${cx + rx * 1.06} ${top - 20}, ${cx + rx * 1.06} ${CY - ry * 0.14}
                C ${cx + rx * 0.72} ${CY - ry * 0.52}, ${cx - rx * 0.72} ${CY - ry * 0.52}, ${cx - rx * 1.06} ${CY - ry * 0.14} Z`}
          />
          {[-0.62, -0.21, 0.21, 0.62].map((tt, i) => (
            <path
              key={i}
              d={`M ${cx + rx * tt} ${CY - ry * 0.5}
                  C ${cx + rx * tt * 1.1} ${top - 4}, ${cx + rx * tt * 1.1} ${top - 4}, ${cx + rx * tt * 1.16} ${CY - ry * 0.16}`}
              fill="none"
              stroke={part}
              strokeWidth="4"
            />
          ))}
          {[-1.02, 1.02].map((tt, i) => (
            <path
              key={`s${i}`}
              d={bar(cx + rx * tt, CY - ry * 0.34, cx + rx * tt * 1.24, CY + ry * 0.9, 13)}
            />
          ))}
        </g>
      )

    case 'locs':
      /* Same clamp as the afro: the cap sat at CY - 0.54ry with ry * 0.64 and
         reached CY + 0.10ry, straight across the eye line. */
      return (
        <g fill={fill}>
          <ellipse cx={cx} cy={CY - ry * 0.84} rx={rx * 1.16} ry={ry * 0.46} />
          {[-1.12, -0.86, 0.86, 1.12].map((tt, i) => (
            <rect
              key={i}
              x={cx + rx * tt - 7}
              y={CY - ry * 0.9}
              width="14"
              height={ry * (1.18 + (i % 2) * 0.24)}
            />
          ))}
        </g>
      )

    case 'crop':
    default:
      return (
        <g fill={fill}>
          <path
            d={`M ${cx - rx * 1.05} ${CY - ry * 0.1}
                C ${cx - rx * 1.05} ${top - 14}, ${cx + rx * 1.05} ${top - 14}, ${cx + rx * 1.05} ${CY - ry * 0.1}
                C ${cx + rx * 0.7} ${CY - ry * 0.52}, ${cx - rx * 0.7} ${CY - ry * 0.52}, ${cx - rx * 1.05} ${CY - ry * 0.1} Z`}
          />
        </g>
      )
  }
}

/* Two plates cannot carry modelling, so the face is a handful of marks: a
   lidded eye, a nostril, and lips pulled in the second ink. The rectangular
   brows and wedge nose of the first pass made every head the same cartoon —
   what varies now is the eye, the lip and the expression the act implies. */
function face(
  cx: number,
  rx: number,
  ry: number,
  category: Category,
  eye: number,
  lip: number,
  blade: string,
) {
  const ex = rx * 0.43
  const ey = CY - ry * 0.04
  const open = category === 'song' || category === 'comedy'
  const closed = category === 'poetry'

  return (
    <>
      <g fill={KEY}>
        {closed ? (
          [-1, 1].map((s) => (
            <path
              key={s}
              d={`M ${cx + s * ex - eye} ${ey} C ${cx + s * ex - eye * 0.4} ${ey + 7}, ${cx + s * ex + eye * 0.4} ${ey + 7}, ${cx + s * ex + eye} ${ey}`}
              fill="none"
              stroke={KEY}
              strokeWidth="5"
              strokeLinecap="round"
            />
          ))
        ) : (
          [-1, 1].map((s) => (
            <g key={s}>
              {/* the lid carries the weight, the way a key plate renders it */}
              <path
                d={`M ${cx + s * ex - eye - 3} ${ey - 3}
                    C ${cx + s * ex - eye * 0.5} ${ey - eye * 0.95}, ${cx + s * ex + eye * 0.5} ${ey - eye * 0.95}, ${cx + s * ex + eye + 3} ${ey - 3}
                    L ${cx + s * ex + eye + 3} ${ey - 9} L ${cx + s * ex - eye - 3} ${ey - 9} Z`}
              />
              <ellipse cx={cx + s * ex} cy={ey} rx={eye} ry={eye * 0.62} />
            </g>
          ))
        )}

        {/* a nostril, not a nose */}
        <ellipse cx={cx - 6} cy={CY + ry * 0.26} rx="4" ry="3" />
        <ellipse cx={cx + 6} cy={CY + ry * 0.26} rx="4" ry="3" />
      </g>

      {/* the lips are the one place the second screen lands on the face */}
      {open ? (
        <>
          <ellipse cx={cx} cy={CY + ry * 0.58} rx={rx * lip} ry={ry * lip * 0.72} fill={KEY} />
          <ellipse
            cx={cx - 2}
            cy={CY + ry * 0.55}
            rx={rx * lip * 0.66}
            ry={ry * lip * 0.42}
            fill={blade}
          />
        </>
      ) : (
        <path
          d={`M ${cx - rx * lip * 1.2} ${CY + ry * 0.54}
              C ${cx - rx * lip * 0.5} ${CY + ry * 0.72}, ${cx + rx * lip * 0.5} ${CY + ry * 0.72}, ${cx + rx * lip * 1.2} ${CY + ry * 0.54}
              C ${cx + rx * lip * 0.5} ${CY + ry * 0.61}, ${cx - rx * lip * 0.5} ${CY + ry * 0.61}, ${cx - rx * lip * 1.2} ${CY + ry * 0.54} Z`}
          fill={blade}
        />
      )}
    </>
  )
}

function prop(category: Category, cx: number, rx: number, ry: number) {
  switch (category) {
    case 'song':
    case 'comedy': {
      /* A microphone reaching the mouth. Big ball, thick stem running off
         the bottom edge — the only prop shape that survives a 230px card. */
      const bx = cx + rx * 0.92
      const by = CY + ry * 0.52
      return (
        <>
          <path d={bar(bx, by, bx + 46, 300, 23)} />
          <circle cx={bx} cy={by} r="28" />
        </>
      )
    }
    case 'instrument': {
      /* A masinko: one long neck across the chest, a filled diamond box,
         and the bow crossing it. Held high enough that the sound box stays
         inside the frame at every zoom the seed can pick. */
      const nx1 = cx - 112
      const ny1 = 256
      const nx2 = cx + 24
      const ny2 = 152
      return (
        <>
          <path d={bar(nx1, ny1, nx2, ny2, 15)} />
          <path
            d={`M ${nx1} ${ny1 - 40} L ${nx1 + 38} ${ny1} L ${nx1} ${ny1 + 40} L ${nx1 - 38} ${ny1} Z`}
          />
          <path d={bar(cx - 156, 196, cx - 26, 250, 7)} />
          <circle cx={nx2 + 5} cy={ny2 - 5} r="9" />
        </>
      )
    }
    /* dance and poetry carry no prop: the extra pull and the shut eyes do
       the work, and a shrunken arm or hand read as debris. */
    default:
      return null
  }
}
