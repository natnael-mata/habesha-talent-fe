import { t } from '../i18n'

/** The foot band.
 *
 *  PRODUCT.md § Brand Commitments confirms a discreet "powered by Ethio
 *  Telecom partnership" endorsement, and the entire purpose of this build is
 *  a pitch to that partner — but it only ever appeared on the two logged-out
 *  pages. The three screens the demo actually spends its time on carried
 *  neither the endorsement nor B AND M's ownership line, and ended in bare
 *  foil. This closes both.
 */
export default function PressFoot() {
  return (
    <footer className="pressfoot">
      <hr className="hr" />
      <div className="pressfoot__in">
        <p className="note">
          <strong style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 14 }}>
            {t('partner_note')}
          </strong>
          <br />
          {t('app_owner')}
        </p>
        <p className="label pressfoot__edition">{t('edition_note')}</p>
      </div>
    </footer>
  )
}
