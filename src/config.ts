/* Subscription facts, confirmed with Bereket on 2026-08-17.
 *
 * The flow, end to end:
 *   1. The customer texts OK to 6431.
 *   2. Ethio Telecom's 900 system passes the number to OneVAS, the aggregator.
 *   3. OneVAS sends the customer an SMS carrying this site's link and a
 *      password, and POSTs the same `phone_number` and `password` to our
 *      provisioning endpoint, which inserts the subscriber row.
 *   4. The customer opens the link and signs in with those two values.
 *
 * So the app never creates an account and never issues a password — it only
 * ever verifies one that already exists. See PRODUCT.md § Operating Context.
 */
export const VAS = {
  /** The SMS keyword the customer sends. */
  keyword: 'OK',
  /** The shortcode they send it to. */
  shortcode: '6431',
  /** Both values confirmed — the page no longer shows an unconfirmed marker. */
  confirmed: true,
} as const
