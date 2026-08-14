import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../api'
import type { VideoWithCreator } from '../api/types'
import { markSeen } from '../seen'
import PerformerPrint from '../components/PerformerPrint'
import VideoCard from '../components/VideoCard'
import DemoNote from '../components/DemoNote'
import PressFoot from '../components/PressFoot'
import RegMarks from '../components/RegMarks'
import { absoluteDate, num, t } from '../i18n'

export default function Watch() {
  const { id } = useParams()
  const videoId = Number(id)

  const [video, setVideo] = useState<VideoWithCreator | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [more, setMore] = useState<VideoWithCreator[]>([])
  const [started, setStarted] = useState(false)
  const [views, setViews] = useState(0)
  const counted = useRef(false)
  const el = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let live = true
    setStatus('loading')
    setStarted(false)
    counted.current = false
    api
      .getVideo(videoId)
      .then((v) => {
        if (!live) return
        setVideo(v)
        setViews(v.view_count)
        setStatus('ready')
        /* "ሌሎች ከመድረኩ" means others from the stage, not others by the same
           person — a creator with one upload would leave the column empty. */
        return api.listVideos(1, 5)
      })
      .then(
        (rest) =>
          live && setMore((rest?.items ?? []).filter((r) => r.id !== videoId).slice(0, 3)),
      )
      .catch(() => live && setStatus('missing'))
    return () => {
      live = false
    }
  }, [videoId])

  /* Start playing once the element actually exists. This runs after commit,
     so the ref is attached; `preload="none"` means this call is also what
     fetches the first byte — nothing is downloaded before the subscriber
     asks for it. */
  useEffect(() => {
    if (!started) return
    el.current?.play().catch(() => {
      /* A strict autoplay policy can reject this even though a tap opened
         the player. Load anyway so the first frame and the native controls
         are there to press, rather than a dead black rectangle. */
      el.current?.load()
    })
  }, [started])

  /* PLAN.md § 9: a play increments the count, server-side, once per visit —
     not once per scrub or replay. The client asks; the server decides. */
  const countPlay = useCallback(async () => {
    if (counted.current) return
    counted.current = true
    markSeen(videoId)
    try {
      setViews(await api.recordView(videoId))
    } catch {
      /* A failed count must never interrupt playback. */
    }
  }, [videoId])

  if (status === 'loading') {
    return (
      <main id="main" className="shell watch">
        <div className="bed" aria-busy="true" />
        <p className="label" style={{ marginTop: 16 }}>
          {t('loading')}
        </p>
      </main>
    )
  }

  if (status === 'missing' || !video) {
    return (
      <main id="main" className="shell watch">
        <div className="empty">
          <h1 className="display d-l">{t('not_found_title')}</h1>
          <p className="lead" style={{ textAlign: 'center' }}>
            {t('not_found_body')}
          </p>
          <Link className="btn" to="/videos">
            {t('back_to_videos')}
          </Link>
        </div>
      </main>
    )
  }

  const creator = video.creator.display_name ?? video.creator.phone_masked

  return (
    <main id="main" className="shell watch">
      <p className="watch__back">
        <Link to="/videos" className="link">
          {t('back_to_videos')}
        </Link>
      </p>

      <div className="watch__grid">
        <div>
          <div className="regframe">
            <RegMarks />
            <div className="bed">
              {/* Nothing preloads and nothing autoplays: the bed stays black
                  until a play is asked for, because the bundle is the
                  subscriber's money (PRODUCT.md § principle 3). */}
              {!started ? (
                <>
                  {/* The edition. One performer, ten pulls, each off the same
                      screen with its own registration and ink — the source
                      world's actual subject, used in the one place this
                      product has a single subject. The rack is many people
                      seen once; this is one person printed ten times. */}
                  <div className="bed__sheet" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div className="bed__pull" key={i}>
                        <PerformerPrint
                          seed={`v${video.id}`}
                          category={video.category}
                          variant={i + 1}
                          pull={i % 3 === 0 ? 'marigold' : i % 3 === 1 ? 'pink' : 'rest'}
                          dotScale={0.62}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="bed__play"
                    onClick={() => {
                      setStarted(true)
                      void countPlay()
                      /* Playback itself is started by the effect below, not
                         here: the <video> does not exist until React commits
                         this state change, so calling play() in a rAF races
                         the commit and silently does nothing. */
                    }}
                  >
                    <span className="bed__playmark" aria-hidden="true">
                      <svg width="34" height="38" viewBox="0 0 34 38">
                        <path d="M0 0 L34 19 L0 38 Z" fill="var(--ink)" />
                      </svg>
                    </span>
                    <span className="bed__playlabel">{t('play')}</span>
                  </button>
                </>
              ) : (
                <video
                  ref={el}
                  src={video.video_path ?? undefined}
                  controls
                  playsInline
                  preload="none"
                  onPlay={() => void countPlay()}
                  aria-label={video.title}
                />
              )}
            </div>
          </div>

          <h1 className="display d-l pull watch__title" data-text={video.title}>
            {video.title}
          </h1>

          <div className="watch__facts">
            <span className="fact">
              <span className="fact__k">{t('creator')}</span>
              <span className="fact__v">{creator}</span>
            </span>
            <span className="fact">
              <span className="fact__k">{t('posted_date')}</span>
              <span className="fact__v">{absoluteDate(video.posted_on)}</span>
            </span>
          </div>

          <div style={{ marginTop: 18 }}>
            <DemoNote />
          </div>
        </div>

        <aside className="watch__side">
          {/* The edition size, annotated in the margin of the sheet. */}
          <div className="edition">
            <span className="label label--bare">{t('views')}</span>
            <span className="figure edition__n">{num(views)}</span>
            <p className="note edition__note">{t('edition_note')}</p>
          </div>

          <h2 className="display d-m watch__side-title">{t('more_from_stage')}</h2>
          {more.length > 0 ? (
            <div className="rack">
              {more.map((v, i) => (
                <VideoCard key={v.id} video={v} index={i} />
              ))}
            </div>
          ) : (
            <p className="note">{t('empty_body')}</p>
          )}
        </aside>
      </div>

      <PressFoot />
    </main>
  )
}
