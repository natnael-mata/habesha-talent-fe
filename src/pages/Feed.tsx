import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'
import type { VideoWithCreator } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { seenIds } from '../seen'
import VideoCard from '../components/VideoCard'
import DemoNote from '../components/DemoNote'
import PressFoot from '../components/PressFoot'
import RegMarks from '../components/RegMarks'
import { absoluteDate, num, t } from '../i18n'

const PAGE_SIZE = 9

export default function Feed() {
  const { subscriber } = useAuth()
  const [items, setItems] = useState<VideoWithCreator[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const seen = seenIds()

  const load = useCallback(async (p: number) => {
    p === 1 ? setStatus('loading') : setLoadingMore(true)
    try {
      const res = await api.listVideos(p, PAGE_SIZE)
      setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]))
      setTotal(res.total)
      setHasMore(res.has_more)
      setPage(res.page)
      setStatus('ready')
    } catch {
      setStatus('error')
    } finally {
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    void load(1)
  }, [load])

  return (
    <main id="main" className="shell feed">
      <div className="feed__head">
        <div>
          <p className="label">{t('feed_kicker')}</p>
          <h1 className="display d-xl pull" style={{ marginTop: 8 }} data-text={t('videos')}>
            {t('videos')}
          </h1>
        </div>

        {status === 'ready' && total > 0 && (
          <p className="feed__count">
            <span className="figure">{num(total)}</span>
            <span className="label label--bare">{t('feed_count_label')}</span>
          </p>
        )}
      </div>

      <DemoNote />

      {subscriber && (
        <p className="note" style={{ marginTop: 12 }}>
          <span className="label label--bare">{t('account_since')}</span>{' '}
          {absoluteDate(subscriber.created_on)}
          {' · '}
          <span dir="ltr">{api.maskPhone(subscriber.phone_number)}</span>
        </p>
      )}

      {status === 'loading' && <GhostRack />}

      {status === 'error' && (
        <div className="empty" style={{ marginTop: 26 }}>
          <h2 className="display d-l">{t('err_generic')}</h2>
          <p className="lead">{t('err_network')}</p>
          <button className="btn" type="button" onClick={() => void load(1)}>
            {t('retry')}
          </button>
        </div>
      )}

      {status === 'ready' && items.length === 0 && (
        <div className="empty" style={{ marginTop: 26 }}>
          <h2 className="display d-l">{t('empty_title')}</h2>
          <p className="lead" style={{ textAlign: 'center' }}>
            {t('empty_body')}
          </p>
          <Link className="btn" to="/upload">
            {t('empty_cta')}
          </Link>
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <>
          <div className="feed__rackframe regframe">
            <RegMarks />
            <div className="rack">
              {items.map((v, i) => (
                <VideoCard key={v.id} video={v} index={i} seen={seen.has(v.id)} />
              ))}
            </div>
          </div>

          {hasMore ? (
            <div className="feed__more">
              <button
                className="btn btn--marigold"
                type="button"
                onClick={() => void load(page + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? t('loading') : t('load_more')}
              </button>
            </div>
          ) : (
            <p className="label feed__end">{t('all_loaded')}</p>
          )}
        </>
      )}
      <PressFoot />
    </main>
  )
}

/** Un-inked frames: the rack exists, the screens have not been pulled yet.
 *  A loading state in the world's own vocabulary rather than a grey pulse. */
function GhostRack() {
  return (
    <div className="feed__rackframe" aria-hidden="true">
      <div className="rack">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="ghost" key={i}>
            <div className="ghost__frame" />
            <div className="ghost__bar" />
            <div className="ghost__bar ghost__bar--short" />
          </div>
        ))}
      </div>
      <p className="sr">{t('loading')}</p>
    </div>
  )
}
