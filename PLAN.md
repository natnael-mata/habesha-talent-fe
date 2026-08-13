# ሀበሻ ታለንት (Habesha Talent) — Project Plan

**Type:** Value Added Service (VAS) web app in partnership with Ethio Telecom
**Language of UI:** Amharic (አማርኛ)
**Status:** Urgent — v1 build
**Owner:** Bereket (B AND M Software Development & Entertainment PLC)

> This file is the original brief, kept as written. Where the build has since
> settled a question the brief left open, [PRODUCT.md](PRODUCT.md) and
> [DESIGN.md](DESIGN.md) are authoritative and [TASK.md](TASK.md) records what
> was actually built.

---

## 1. Problem Statement

Ethio Telecom subscribers with talents (singing, dancing, comedy, etc.) have no
simple local platform to publish short talent videos and be seen by other
subscribers. Habesha Talent gives subscribers an Amharic-language web app where
they log in with their phone number, upload talent videos, and watch videos
posted by others.

## 2. Goals (v1)

1. Subscriber can register/log in with **phone number as username + password**.
2. Subscriber can **upload a talent video** with a title.
3. All logged-in subscribers can **browse a video list** showing title, posted
   date, view count, and creator.
4. Subscriber can **play a video** on a detail page (title + video content); each
   play increments the view count.
5. Entire UI rendered in **Amharic**.

## 3. Non-Goals (v1)

- Ethio Telecom SDP subscription/billing integration (shortcode, daily/weekly
  charging) — **v2**; design DB so a `subscription_status` can be added later.
- Likes/comments/sharing, follower system — v2.
- Mobile apps (Android/iOS) — web only for v1.
- Live streaming — uploaded videos only.
- Multi-language toggle (Amharic-only for v1; keep strings in a translation file
  so English can be added later).

## 4. Pages & UI (all text in Amharic)

### 4.1 Login Page (entry point)
- **Logo** of ሀበሻ ታለንት at the top.
- **Promotional content**: banner/slider describing the service (e.g.
  "ተሰጥኦዎን ለዓለም ያሳዩ! — Show your talent to the world!"), sample talent images,
  "powered by Ethio Telecom partnership" note.
- Form: ስልክ ቁጥር (phone number), የይለፍ ቃል (password), **ግባ** (Login) button.
- Link: **ተመዝገብ** (Register) for new subscribers.
- Validation errors in Amharic.

### 4.2 Registration Page
- ስልክ ቁጥር (Ethiopian format: 09XXXXXXXX / +2519XXXXXXXX, validated + unique),
  የይለፍ ቃል + confirm.
- On success, `created_on` is set to the insert date automatically.

### 4.3 Video List Page (home after login)
Card/grid list; each item shows:
- Thumbnail
- **ርዕስ** (Title)
- **የተለጠፈበት ቀን** (Posted date)
- **እይታዎች** (Number of views)
- **አቅራቢ** (Video creator — display name or masked phone e.g. 09****1234)
- Sorted newest first; pagination or infinite scroll.

### 4.4 Video Detail / Player Page
- Title + video player (HTML5) + creator + posted date + views.
- View count +1 per play (server-side increment).

### 4.5 Upload Page (ቪዲዮ ስቀል)
- Fields: ርዕስ (title), video file (mp4/webm, max size e.g. 100MB).
- Upload progress bar; success message in Amharic.

### 4.6 (P1) Admin Panel
- Approve/remove videos (moderation), view subscribers list.

## 5. Amharic UI String Table (starter)

| Key | Amharic |
|---|---|
| app_name | ሀበሻ ታለንት |
| login | ግባ |
| register | ተመዝገብ |
| phone_number | ስልክ ቁጥር |
| password | የይለፍ ቃል |
| confirm_password | የይለፍ ቃል ያረጋግጡ |
| logout | ውጣ |
| videos | ቪዲዮዎች |
| title | ርዕስ |
| posted_date | የተለጠፈበት ቀን |
| views | እይታዎች |
| creator | አቅራቢ |
| upload_video | ቪዲዮ ስቀል |
| welcome_promo | ተሰጥኦዎን ለዓለም ያሳዩ! |
| invalid_login | ስልክ ቁጥር ወይም የይለፍ ቃል ትክክል አይደለም |
| required_field | ይህ መስክ አስፈላጊ ነው |

Keep all strings in one file (`locales/am.json`) — no hard-coded text in
components.

## 6. Data Model (backend storage)

### subscribers
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| phone_number | varchar, **unique** | used as **username**; Ethiopian format validated |
| password_hash | varchar | bcrypt — never store plain text |
| display_name | varchar, nullable | optional; fallback to masked phone |
| status | enum(active, blocked) | default active |
| created_on | timestamp | **auto-set on insert** |

### videos
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| subscriber_id | FK → subscribers | the creator |
| title | varchar | |
| video_path | varchar | stored file / storage URL |
| thumbnail_path | varchar, nullable | auto-generated if possible |
| view_count | int, default 0 | |
| status | enum(pending, approved, removed) | v1 defaults to approved; moderation in P1 |
| posted_on | timestamp | auto-set on insert |

### (P1) video_views
`id, video_id FK, subscriber_id FK, viewed_at` — for accurate/unique view
analytics; v1 uses the simple counter only.

## 7. Suggested Tech Stack

- **Frontend:** React (or Next.js) — Amharic via i18n file, Ethiopic-friendly
  font (Noto Sans Ethiopic).
- **Backend:** Node.js (Express) or Laravel — REST API.
- **DB:** MySQL or PostgreSQL.
- **Auth:** session or JWT; bcrypt password hashing.
- **Video storage:** local disk/S3-compatible bucket for v1 (AletCloud VPS
  storage works); serve via streaming endpoint.

## 8. Requirements Priority

**P0 (must ship):** login page with logo + promo content, registration, Amharic
UI, video upload, video list (title/date/views/creator), video player with view
counting, subscribers table exactly as specced.
**P1:** admin moderation, thumbnails, masked-phone display names, video_views
table, rate limiting.
**P2:** Ethio Telecom SDP billing/subscription, SMS OTP (smsethiopia.com REST API
is already available from Lomi-Test work), likes/comments, mobile apps.

## 9. Acceptance Criteria (v1 checklist)

- [ ] Opening the site shows the **login page first** with logo and promotional content.
- [ ] New subscriber registers with phone + password; `created_on` equals insert date.
- [ ] Duplicate phone number registration is rejected with an Amharic error.
- [ ] Wrong password shows Amharic error; correct login lands on the video list.
- [ ] Video list shows title, posted date, view count, and creator for every video.
- [ ] Uploading a video (title + file) makes it appear in the list for other users.
- [ ] Playing a video increments its view count (visible on refresh).
- [ ] Every visible UI string is Amharic; no English leaks.
- [ ] Passwords are hashed in DB (verify no plaintext).

See [TEST.md](TEST.md) for how each of these is verified against the current
build.

## 10. Open Questions (answer before/during v2)

1. **Billing model** — daily/weekly VAS subscription via Ethio Telecom SDP, or
   free at launch? (Business — Bereket)
2. Does Ethio Telecom require **MSISDN header enrichment / auto-login** on their
   network? (Ethio Telecom integration team)
3. Video **moderation policy** — pre-approval or post-report removal? (Business)
4. Max video length/size and storage budget? (Infra)

## 11. Phasing

- **Phase 1 (urgent, this build):** P0 scope above — repo setup, DB, auth,
  upload, list, player, Amharic UI.
- **Phase 2:** admin panel + moderation + thumbnails + OTP.
- **Phase 3:** Ethio Telecom SDP billing + engagement features.
