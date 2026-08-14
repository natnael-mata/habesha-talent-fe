import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../api'
import { ApiError, ERROR_KEY } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import Field, { validate } from '../components/Field'
import RegMarks from '../components/RegMarks'
import PerformerPrint from '../components/PerformerPrint'
import PressFoot from '../components/PressFoot'
import { t } from '../i18n'

type Phase = 'idle' | 'uploading' | 'done'

export default function Upload() {
  const { subscriber } = useAuth()
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [over, setOver] = useState(false)
  const [errs, setErrs] = useState<{ title?: string; file?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [pct, setPct] = useState(0)
  const [newId, setNewId] = useState<number | null>(null)

  function accept(f: File | undefined) {
    if (!f) return
    if (!api.ACCEPTED_TYPES.includes(f.type)) {
      setErrs((p) => ({ ...p, file: t('err_file_type') }))
      return
    }
    if (f.size > api.MAX_UPLOAD_BYTES) {
      setErrs((p) => ({ ...p, file: t('err_file_size') }))
      return
    }
    setErrs((p) => ({ ...p, file: undefined }))
    setFile(f)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next = {
      title: validate.title(title) ?? undefined,
      file: file ? undefined : t('err_file_required'),
    }
    setErrs(next)
    if (next.title || next.file || !file || !subscriber) return

    setPhase('uploading')
    setPct(0)
    try {
      const created = await api.uploadVideo({
        subscriberId: subscriber.id,
        title,
        file,
        onProgress: setPct,
      })
      setNewId(created.id)
      setPhase('done')
    } catch (err) {
      setPhase('idle')
      setFormError(err instanceof ApiError ? t(ERROR_KEY[err.code]) : t('err_network'))
    }
  }

  if (phase === 'done' && newId !== null) {
    return (
      <main id="main" className="shell upload">
        <div className="regframe">
          <RegMarks />
          <div className="panel upload__done">
            <span
              className="label label--bare"
              style={{
                background: 'var(--marigold)',
                color: 'var(--ink)',
                border: '2px solid var(--ink)',
                padding: '3px 10px',
              }}
            >
              {t('upload_kicker')}
            </span>
            <h1 className="display d-l pull" data-text={t('upload_success')}>
              {t('upload_success')}
            </h1>
            <p className="lead">{t('upload_success_body')}</p>
            <div className="row gap-20 wrap" style={{ marginTop: 6 }}>
              <Link className="btn" to={`/watch/${newId}`}>
                {t('upload_view_it')}
              </Link>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setTitle('')
                  setFile(null)
                  setNewId(null)
                  setPct(0)
                  setPhase('idle')
                }}
              >
                {t('upload_another')}
              </button>
            </div>
          </div>
        </div>
        <PressFoot />
    </main>
    )
  }

  return (
    <main id="main" className="shell upload">
      <div className="upload__head">
        <p className="label">{t('upload_kicker')}</p>
        <h1 className="display d-xl pull upload__title" data-text={t('upload_lead')}>
          {t('upload_lead')}
        </h1>
        <p className="lead">{t('promo_step_2_b')}</p>
      </div>

      <div className="upload__grid">
      <div className="regframe">
        <RegMarks />
        <form className="panel" onSubmit={onSubmit} noValidate>
          {formError && (
            <div className="notice" role="alert">
              <span aria-hidden="true">✕</span>
              <span>{formError}</span>
            </div>
          )}

          <Field
            label={t('upload_title_label')}
            placeholder={t('upload_title_placeholder')}
            maxLength={90}
            value={title}
            error={errs.title}
            disabled={phase === 'uploading'}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="field">
            <span className="field__label">{t('upload_file_label')}</span>

            <input
              ref={input}
              type="file"
              className="sr"
              accept="video/mp4,video/webm"
              disabled={phase === 'uploading'}
              onChange={(e) => accept(e.target.files?.[0])}
            />

            <div
              className={`drop${over ? ' drop--over' : ''}${file ? ' drop--filled' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={t('upload_pick')}
              onClick={() => phase !== 'uploading' && input.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  input.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(true)
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setOver(false)
                accept(e.dataTransfer.files?.[0])
              }}
            >
              {file ? (
                <div className="upload__file">
                  <span className="upload__filename">{file.name}</span>
                  <span className="code">{(file.size / 1_048_576).toFixed(1)} MB</span>
                  <span className="btn btn--ghost btn--sm">{t('upload_change')}</span>
                </div>
              ) : (
                <>
                  <span style={{ fontWeight: 800 }}>{t('upload_dropzone')}</span>
                  <span className="label label--bare">{t('upload_formats')}</span>
                </>
              )}
            </div>

            {errs.file ? (
              <span className="field__err" role="alert">
                {errs.file}
              </span>
            ) : (
              <span className="field__hint">{t('upload_data_note')}</span>
            )}
          </div>

          {phase === 'uploading' && (
            <div style={{ marginBottom: 22 }}>
              <div
                className="squeegee"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('uploading')}
              >
                <span
                  className="squeegee__carriage"
                  style={{ transform: `translateX(${pct}%)` }}
                />
                <span className="squeegee__pct">{pct}%</span>
              </div>
              <span className="field__hint">{t('uploading')}</span>
            </div>
          )}

          <button className="btn btn--block" type="submit" disabled={phase === 'uploading'}>
            {phase === 'uploading' ? t('uploading') : t('upload_submit')}
          </button>
        </form>
      </div>

        {/* What the upload becomes. A performer posting from a phone has no
            idea what a "card" is until they see their own title inside one,
            and the print is generated from the same seed the real card will
            use, so this is the artefact rather than a picture of it. */}
        <aside className="upload__preview">
          <p className="label">{t('upload_preview')}</p>
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card__frame screen">
              <PerformerPrint seed={`new-${subscriber?.id ?? 0}`} category="song" pull="pink" />
              <span className="flag">{t('state_new')}</span>
              <span className="stamp">
                <span className="stamp__n">0</span>
                <span className="stamp__l">{t('views')}</span>
              </span>
            </div>
            <div className="card__body">
              <h3 className="card__title">{title.trim() || t('upload_untitled')}</h3>
              <div className="card__meta">
                <span className="metum">
                  <span className="metum__k">{t('creator')}</span>
                  <span className="metum__v">
                    {subscriber ? api.maskPhone(subscriber.phone_number) : ''}
                  </span>
                </span>
                <span className="metum" style={{ marginInlineStart: 'auto', textAlign: 'end' }}>
                  <span className="metum__k">{t('posted_date')}</span>
                  <span className="metum__v">{t('today')}</span>
                </span>
              </div>
            </div>
          </div>
          <p className="note" style={{ marginTop: 12 }}>
            {t('upload_preview_note')}
          </p>
        </aside>
      </div>

      <p className="auth__back">
        <button
          type="button"
          className="link"
          style={{ background: 'none', border: 0, borderBottom: '3px solid var(--pink)', cursor: 'pointer', padding: 0 }}
          onClick={() => navigate('/videos')}
        >
          {t('back_to_videos')}
        </button>
      </p>
      <PressFoot />
    </main>
  )
}
