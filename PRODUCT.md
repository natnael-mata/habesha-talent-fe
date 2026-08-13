# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile-first web app, built to be opened in a phone browser on a mid-range Android in
Ethiopia. It is not a native build and there is no app-store distribution in v1 — reach
through the browser is part of the point.

## Users

**Primary — the performer.** An Ethio Telecom subscriber with a talent: a singer, a
dancer, a comedian, an azmari, a poet, a masinko or krar player. Roughly 15–35, in Addis
Ababa and regional towns, on a mid-range Android with a small prepaid data bundle. They
already film themselves on the phone. What they do not have is anywhere local to put it
where other Ethiopians will actually watch — and they have no bank card, no PayPal, and
often no appetite for a foreign-language app.

**Primary — the audience.** The same subscriber base, watching rather than posting. Most
users will never upload; they open the app to see who is good this week.

**Secondary (evaluation audience, not end users).** The Ethio Telecom VAS and
partnerships team, who will judge this build in a meeting to decide whether the service
is worth carrying on the network. They are not the people the interface is designed for,
but they are the first people to see it.

## Product Purpose

ሀበሻ ታለንት (Habesha Talent) lets any Ethio Telecom subscriber publish a short talent video
and be watched by other subscribers, entirely in Amharic. A subscriber registers with a
phone number and a password, uploads a video with a title, and it appears in a feed
everyone on the service can browse and play. Success is a performer who posts and gets
watched, and a viewer who comes back to see what is new — the two halves feed each other,
and neither works without the other.

## Positioning

The mechanism a neighbouring product cannot truthfully copy is **the identity rail and
the language, not the feature set.** Uploading a video and counting plays is ordinary.
What is not ordinary in this market: the account *is* a phone number on the operator's
network — no email, no card, no app store, no foreign sign-in — and every word of the
interface is Amharic. YouTube and TikTok are functionally vastly richer and are, for a
large part of this audience, in the wrong language, behind the wrong install, and
addressed to a global feed where an Amharic talent video reaches no one. Habesha Talent
is small on purpose: an Ethiopian stage, in Ethiopian script, one phone number away.

## Operating Context

- **Video on a metered bundle is the central tension of this product.** The audience buys
  data in small increments. Nothing may autoplay, nothing may preload video, and the size
  of what a tap is about to cost has to be honest.
- Usage is one-handed, on a phone, often outdoors in bright Addis daylight, and on an
  unreliable connection. Uploads will fail partway and must be recoverable.
- **Registration happens entirely outside the app, and this is the single most
  important fact about the product's shape.** Confirmed by the user on
  2026-08-13:
  1. The subscriber subscribes by **SMS to a shortcode**, on their own line.
  2. Ethio Telecom's **VAS/SDP provisions them** and issues a password.
  3. The VAS system **`POST`s the phone number and password to our endpoint**.
  4. We insert that into the `subscribers` table. That row *is* the account.
  5. The subscriber then simply **logs in** with credentials they already have.

  There is **no in-app signup form**, and there must never be one: an account
  the app created itself would not exist on the operator's side, so the
  subscriber would not be subscribed, would not be billed, and could not be
  reconciled. The app reads the account; it never creates one.
- The phone number is the username. Ethiopian mobile numbers are `09XXXXXXXX`
  or `+2519XXXXXXXX`, and the two spellings must normalise to one account.
- The evaluation ritual for this build is a live tap-through in a meeting room, on a
  laptop or phone that may have no reliable internet.
- The service is operated by B AND M Software Development & Entertainment PLC in
  partnership with Ethio Telecom. Ethio Telecom is the distribution and (later) billing
  partner, not the owner of the product.

## Capabilities and Constraints

**This build is a UI-only front end. All data is mocked and labelled as demo data.**

**Confirmed v1 product shape:**

- The **login page is the entry point** — an unauthenticated visitor sees it first. It
  carries the logo and promotional content about the service, not just a form.
- The second public page is **not a signup form** but **subscribe instructions**:
  what to SMS, where, and what arrives back. See Operating Context above.
- Accounts arrive through an **inbound provisioning endpoint** the VAS system
  calls. It must be authenticated (shared secret or signature plus an IP
  allowlist — anyone who can reach it can mint accounts), idempotent on
  `phone_number` so a retried delivery does not error or duplicate, and it must
  bcrypt the password on receipt. The plaintext password exists only in the VAS
  payload and in the subscriber's SMS; it is never stored.
- A **video feed** lists every approved video newest-first, each showing thumbnail,
  title (ርዕስ), posted date (የተለጠፈበት ቀን), view count (እይታዎች) and creator (አቅራቢ).
- A **detail page** plays the video (HTML5) with title, creator, date and views. Each
  play increments the view count server-side.
- **Upload** takes a title and a video file (mp4/webm, max 100MB) with visible progress.
- Every page except login and register requires authentication.

**Deliberately absent in v1, and not to be implied as working:** Ethio Telecom SDP
subscription and billing, SMS OTP, likes, comments, sharing, follows, an admin/moderation
panel, live streaming, mobile apps, and any language other than Amharic. The data model
must leave room for `subscription_status`, a `video_views` table and moderation states so
these fit later without a rewrite.

**Hard constraints on this run:**

- No hard-coded UI strings anywhere in components. Every visible word comes from
  `locales/am.json`, so English can be added later without touching a component.
- The interface must be laid out and read correctly in **Amharic (Ethiopic script)** as
  the only language. Ethiopic is not a Latin fallback case; it is the design case.
- Must lay out cleanly from 360px upward, and hold together on desktop for the pitch.
- Demo videos, creators and figures are illustrative and are marked as such on screen.

**Terminology:** ተሰጥኦ (talent), አቅራቢ (the person who posted — creator), እይታ (a view/play),
VAS (value-added service), ETB (Ethiopian Birr).

## Brand Commitments

- Product name **ሀበሻ ታለንት** (Habesha Talent), owned by **B AND M Software Development &
  Entertainment PLC**.
- **Confirmed by the user:** the interface wears **Habesha Talent's own identity** — its
  own logo, palette and personality — with a discreet *"powered by Ethio Telecom
  partnership"* endorsement. It is explicitly **not** the Ethio Telecom house brand. (The
  sibling project `../gize` does wear the ET house brand; this one deliberately does not.)
- **Confirmed by the user:** the user-facing interface is **Amharic only**.
- No logo asset exists. The wordmark and app mark are to be authored as part of this work
  and handed over as replaceable assets.
- An Ethiopic-capable typeface is a hard requirement, not a preference.

## Evidence on Hand

The project plan supplied in this session — problem statement, page list, Amharic string
table, data model, priorities and acceptance criteria — is the whole of the confirmed
evidence. There are **no** real users, no real talent videos, no metrics, no testimonials,
no logo files, no Ethio Telecom brand kit and no signed commercial terms.

Nothing in those categories may be fabricated. Every performer name, video title,
thumbnail, view count and date in this build is authored demo content, produced at full
fidelity because a pitch needs to look like the real thing, and marked on screen so no
one leaves the room believing the service is live. Commercial claims — pricing, subscriber
numbers, launch dates, ET endorsement wording — ship as visible placeholders on the
user's replacement list rather than as invented copy.

## Product Principles

1. **Amharic is the design case, not a translation layer.** Ethiopic script sets the type
   scale, line height, button widths and truncation rules. A layout that only works once
   the text is Latin has failed.
2. **The performer is the product.** Everything on screen exists to put a person's
   performance in front of someone else. Chrome that competes with the video loses.
3. **Respect the bundle.** No autoplay, no video preload, no decorative megabytes. The
   cost of a tap is the user's money, and the interface should never spend it without
   being asked.
4. **One phone number is the whole barrier to entry.** Registration, login and posting
   must stay short enough to finish standing up, one-handed, on a slow connection.
5. **Demo data is labelled, never implied as live.** Anywhere a real integration or a real
   commercial claim would sit, the build marks it as a stand-in.

## Accessibility & Inclusion

- Bright-daylight legibility on a cheap LCD is a product requirement: text contrast must
  clear WCAG AA at real sizes, with no hairline grey type.
- Ethiopic glyphs carry more internal detail than Latin at the same point size. Body text
  sets larger and looser than a Latin equivalent would, and small-caps, tight tracking and
  all-caps treatments do not exist in this script.
- Primary actions sit within one-handed thumb reach; touch targets are never below 44px.
- Video needs a real control surface, visible focus states, and keyboard operability for
  the desktop pitch.
- Literacy varies. Icons never carry meaning alone, and every action has an Amharic label.
