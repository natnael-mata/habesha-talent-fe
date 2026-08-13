import { t } from '../i18n'

/** The app mark: two plates pulled out of register inside one screen frame.
 *  No letterform, so it survives being a favicon and a 20px nav glyph. */
export function Mark({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none' }}
    >
      <rect x="8" y="8" width="38" height="38" fill="var(--marigold)" />
      <rect x="18" y="18" width="38" height="38" fill="var(--pink)" />
      <rect
        x="13"
        y="13"
        width="38"
        height="38"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="6"
      />
    </svg>
  )
}

/** Mark plus wordmark. `scale` sizes the whole lockup from one number. */
export function Wordmark({
  scale = 1,
  pull = true,
}: {
  scale?: number
  pull?: boolean
}) {
  return (
    <span
      className="row gap-14"
      style={{ alignItems: 'center', paddingRight: pull ? 6 : 0 }}
    >
      <Mark size={40 * scale} />
      <span
        className={`display${pull ? ' pull' : ''}`}
        style={{ fontSize: `${28 * scale}px`, lineHeight: 1 }}
      >
        {t('app_name')}
      </span>
    </span>
  )
}
