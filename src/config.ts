/* Values Ethio Telecom must confirm before this goes near a subscriber.
 *
 * These are the commercial facts the build is not allowed to invent
 * (PRODUCT.md § Evidence on Hand). They ship as visibly-marked placeholders:
 * while `confirmed` is false, every screen that shows them also shows that
 * they are unconfirmed. Flip the flag only once ET has signed them off — the
 * warning disappears on its own.
 */
export const VAS = {
  /** TODO(ET): the real SMS keyword a subscriber texts. */
  keyword: 'TALENT',
  /** TODO(ET): the real shortcode it is sent to. */
  shortcode: '8XXX',
  /** TODO(ET): set true once both values above are confirmed. */
  confirmed: false,
} as const
