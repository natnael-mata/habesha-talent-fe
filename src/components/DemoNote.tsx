import { t } from '../i18n'

/** PRODUCT.md § Product Principles 5: demo data is labelled, never implied
 *  as live. Anywhere a figure, name or video could be mistaken for real
 *  service data, this marker sits with it. */
export default function DemoNote({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span
        className="label label--bare"
        style={{
          display: 'inline-block',
          border: '2px solid var(--ink)',
          padding: '2px 8px',
          background: 'var(--marigold)',
          color: 'var(--ink)',
        }}
      >
        {t('demo_badge')}
      </span>
    )
  }

  return (
    <div
      className="row gap-14 wrap"
      style={{
        border: '2px solid var(--ink)',
        background: 'var(--foil-deep)',
        padding: '11px 14px',
      }}
    >
      <span
        className="label label--bare"
        style={{
          background: 'var(--marigold)',
          color: 'var(--ink)',
          padding: '2px 8px',
          border: '2px solid var(--ink)',
        }}
      >
        {t('demo_badge')}
      </span>
      <span style={{ fontSize: 'var(--t-micro)', fontWeight: 700, color: 'var(--ink-2)' }}>
        {t('demo_note')}
      </span>
    </div>
  )
}
