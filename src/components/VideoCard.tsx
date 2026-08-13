import { Link } from 'react-router-dom'
import { duration, num, relativeDate, t } from '../i18n'
import type { VideoWithCreator } from '../api/types'
import PerformerPrint from './PerformerPrint'

const WEEK = 7 * 86_400_000

/** One pull on the rack.
 *  DESIGN.md § Ink states: the frame never changes, the ink does. A card
 *  posted this week sits on a pink plate under the flag አዲስ; one already
 *  watched drops its colour entirely. Colour never carries the state alone. */
export default function VideoCard({
  video,
  index = 0,
  seen = false,
}: {
  video: VideoWithCreator
  index?: number
  seen?: boolean
}) {
  const isNew = Date.now() - +new Date(video.posted_on) < WEEK
  const creator = video.creator.display_name ?? video.creator.phone_masked

  return (
    <Link
      to={`/watch/${video.id}`}
      className={`card wipe${isNew && !seen ? ' card--new' : ''}${seen ? ' card--seen' : ''}`}
      style={{ '--wipe-delay': `${Math.min(index, 11) * 45}ms` } as React.CSSProperties}
    >
      <div className="card__frame screen">
        <PerformerPrint
          seed={`v${video.id}`}
          category={video.category}
          pull={seen ? 'rest' : isNew ? 'pink' : 'marigold'}
        />

        {isNew && !seen && <span className="flag">{t('state_new')}</span>}

        {/* The view count set as an edition size — a view is a pull. */}
        <span className="stamp">
          <span className="stamp__n">{num(video.view_count)}</span>
          <span className="stamp__l">{t('views')}</span>
        </span>

        {video.duration_s > 0 && (
          <span
            className="code"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'var(--foil-hi)',
              border: '2px solid var(--ink)',
              padding: '2px 7px',
              color: 'var(--ink)',
            }}
          >
            {duration(video.duration_s)}
          </span>
        )}
      </div>

      <div className="card__body">
        <h3 className="card__title">{video.title}</h3>

        <div className="card__meta">
          <span className="metum">
            <span className="metum__k">{t('creator')}</span>
            <span className="metum__v">{creator}</span>
          </span>
          <span className="metum" style={{ marginInlineStart: 'auto', textAlign: 'end' }}>
            <span className="metum__k">{t('posted_date')}</span>
            <span className="metum__v">{relativeDate(video.posted_on)}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
