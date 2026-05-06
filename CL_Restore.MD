# ClearLegacy — clearlegacy.co.uk

## What This Is

ClearLegacy is a fully automated UK online will writing service. **Zero human input** — no phone calls, no Calendly, no advisor CTAs, no human review. Everything is self-service: questionnaire → Stripe payment → auto-generated PDF Will → email delivery.

- **Owner:** Sat (sat@kaizengold.com), also runs ByErim (Shopify) and KaizenGold (agency)
- **Legal entity:** Kaizen Finance Ltd (Company No. 12092327)
- **Jurisdiction:** England & Wales (Wills Act 1837)
- **Domain:** www.clearlegacy.co.uk (GitHub Pages) + api.clearlegacy.co.uk (Cloudflare Worker)
- **Repo:** S7SSL/clearlegacy-site (private, push via PAT)

## Products & Pricing

| Product | Price | Stripe Payment Link |
|---------|-------|-------------------|
| Single Will | £69 | `https://buy.stripe.com/7sYcMYaQ84rZbb9d5v5ZC03` |
| Mirror Wills (couples) | £99 | `https://buy.stripe.com/eVq3co2jC7Eb2EDaXn5ZC04` |
| LPA | from £149 | — (insurance not yet in place, do NOT promote) |
| Probate | from £299 | — |

**Mirror Wills is the proven conversion product** (first real conversion: Pete Rogers, £99 mirror wills, organic/direct).

## Architecture

### Static Site (GitHub Pages)
- Hosted on GitHub Pages at www.clearlegacy.co.uk
- Push to `main` branch deploys automatically
- No build step — all HTML/CSS/JS is static
- PAT for push: stored in conversation context (never commit it)

### Cloudflare Worker (`clearlegacy-api-v2`)
- **Location:** `worker/` directory
- **Domain:** api.clearlegacy.co.uk (custom domain)
- **Account ID:** f520d3a645627577b250957a7341a988
- **Deploy:** `cd worker && npx wrangler deploy --config wrangler.toml`
- **IMPORTANT:** Always use `--config wrangler.toml` flag — wrangler 4.x otherwise scans the parent directory and hits "Asset too large" errors because of node_modules

#### Worker Bindings
| Binding | Type | ID/Name |
|---------|------|---------|
| CLEARLEGACY_KV | KV Namespace | 164df086360a43798d421bb1f26d654c |
| CLEARLEGACY_PDFS | R2 Bucket | clearlegacy-pdfs |
| BROWSER | Browser Rendering | (for HTML→PDF) |
| AI | Workers AI | (powers Clara chatbot) |

#### Worker Secrets (set via `npx wrangler secret put`)
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
- DOWNLOAD_TOKEN_SECRET
- ADMIN_NOTIFICATION_EMAIL (sat@clearlegacy.co.uk)
- ADMIN_PASSWORD

#### Worker Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/lead | Questionnaire intake → Stripe URL |
| POST | /api/stripe-webhook | Stripe checkout.session.completed → kicks PDF pipeline |
| GET | /api/status?ref=... | Thank-you page polling |
| GET | /api/pdf/:token | Signed PDF download |
| POST | /api/chat | Clara AI chat assistant (Workers AI) |
| GET | /api/healthz | Liveness check |
| POST | /api/auth/request | Magic-link login email |
| GET | /api/auth/verify | Set cookie + redirect |
| POST | /api/auth/logout | Clear session |
| GET | /api/auth/me | Current customer |
| GET | /api/account | Customer dashboard payload |
| POST | /api/account/profile | Update name/phone/marketing |
| POST | /api/account/claim | Attach unclaimed leads |
| GET | /api/account/orders/:ref | Single order detail |
| POST | /api/account/orders/:ref/pdf | Fresh signed PDF URL |
| POST | /api/account/order | Start new will purchase |
| POST | /api/save-progress | Save form progress to KV |
| POST | /api/save-progress/send-email | Send resume-link email via Resend |
| GET | /api/resume?token=... | Retrieve saved form progress |
| GET/POST | /admin | Basic Auth admin dashboard |

#### PDF Pipeline
1. Customer submits questionnaire → stored in KV
2. Stripe webhook fires → flips status to `pending`
3. Worker renders HTML template via Browser Rendering API (Puppeteer)
4. `pdf-lib` stamps diagonal watermark: "CLEARLEGACY.CO.UK" (size 56, opacity 0.12, 30° angle, grey)
5. PDF stored in R2 bucket `clearlegacy-pdfs`
6. Email sent via Resend (from: Clear Legacy <no-reply@clearlegacy.co.uk>)
7. BCC to ADMIN_NOTIFICATION_EMAIL
8. Watchdog cron runs every 2 minutes — auto-fails stuck-generating leads after 5 minutes

## Site Structure

### Key Pages
- `/index.html` — Homepage (main conversion page)
- `/forms/will.html` — 7-step will questionnaire (THE conversion form)
- `/forms/lpa.html` — LPA form (NOT insured yet, don't promote)
- `/forms/probate.html` — Probate form
- `/thank-you.html` — Post-payment status page with polling
- `/pricing/` — Pricing comparison page
- `/wills/` — Will writing service info page
- `/mirror-wills/` — Mirror wills info page
- `/account/` — Customer portal (magic-link auth)
- `/contact/` — Contact page (email only: hello@clearlegacy.co.uk)

### Guide Pages (~55 pages in `/guides/`)
All guide pages follow a consistent template:
- FAQPage schema.org structured data
- Google Analytics (G-J3GPRFYR2Q)
- Microsoft UET tag (ti=187249506)
- Meta Pixel (4325056374374857)
- Cookie consent banner
- `cl-sticky-cta.js` — sticky bottom bar ("Single Will £69 · Mirror Wills £99")
- `cl-chat.js` — Clara AI chatbot widget
- Related Guides section at bottom with cross-links (mirror-wills.html linked from all high-intent pages)

### NHS Landing Pages
- `/nhs-will-writing.html` — Main NHS hub
- `/nhs-nurse-will-writing.html`
- `/nhs-doctor-will-writing.html`
- `/nhs-admin-will-writing.html`
- `/nhs-paramedic-will-writing.html`
- `/nhs-faqs.html`

### Blog
- `/blog/` — Blog index
- 5 blog posts in subdirectories

### Legal
- `/legal/terms.html`
- `/legal/privacy.html`
- `/legal/complaints.html`

### Tools
- `/tools/probate-calculator.html` — Interactive probate fee calculator

## Global Scripts

### cl-sticky-cta.js
Injects a fixed bottom bar on all pages except forms and thank-you. Shows "Single Will £69 · Mirror Wills £99 · Ready in 24 hours" with a "Start Your Will →" button. Appears after 300px scroll.

### cl-chat.js
Clara AI chatbot widget. Blue bubble bottom-right, opens chat window. Calls `POST https://api.clearlegacy.co.uk/api/chat`. After 2+ user messages, shows "Start Your Will — From £69" CTA button. **No Calendly, no phone, no human contact.**

### cl-thankyou-tracking.js
Thank-you page conversion tracking for GA4/UET/Meta Pixel.

## Tracking & Analytics
- **GA4:** G-J3GPRFYR2Q
- **Microsoft UET (Bing Ads):** ti=187249506
- **Meta Pixel:** 4325056374374857
- **Attribution:** Forms capture UTMs, gclid, msclkid, fbclid, ttclid, referrer, landing URL, user agent via sessionStorage

## CSS
- Guide pages: inline `<style>` blocks (self-contained)
- Homepage/pricing/wills/contact: `/css/site.css` (shared stylesheet)
- NHS pages: `/nhs.css`
- CSS variables: `--blue:#2563eb`, `--dark:#0a0a0a`, `--grey:#6b7280`, `--border:#e5e7eb`, `--bg-soft:#f9fafb`
- Responsive breakpoints: 960px, 720px, 600px
- Font: Inter (Google Fonts)

## CTA Routing Convention
All "Start My Will" / "Start Mirror Wills" CTAs should link **directly to the form** with product params:
- Single: `/forms/will.html?product=single`
- Mirror: `/forms/will.html?product=mirror`
- Generic: `/forms/will.html`

**Never** link CTAs to info pages (`/wills/`, `/mirror-wills/`) — those are SEO landing pages, not conversion endpoints.

## Critical Rules

1. **ZERO HUMAN INPUT** — Never add phone numbers, Calendly links, "speak to an advisor", "book a call", or any human-contact CTA. ClearLegacy is fully automated.
2. **LPA not insured** — Do not promote LPA products until insurance is confirmed.
3. **Wrangler deploy** — Always use `npx wrangler deploy --config wrangler.toml` from the `worker/` directory. Without `--config`, wrangler scans the parent directory and fails on large node_modules files.
4. **Mirror Wills is the hero product** — £99 for both, proven conversion. Promote prominently.
5. **GitHub Pages deploy** — Push to `main` branch. No build step. Changes go live in ~1 minute.
6. **Form exit-intent popup** — `forms/will.html` has a mouseout exit-intent modal on steps 2-7. Don't duplicate.
7. **Watermark** — All generated PDFs have "CLEARLEGACY.CO.UK" diagonal watermark via `worker/src/pdf.ts`.

## Save-and-Resume (Abandoned Form Recovery)

### How It Works
1. User fills in steps of `/forms/will.html` — after Step 2, a "Save & Continue Later" link appears
2. Clicking it (or triggered by exit-intent) saves progress to KV via `POST /api/save-progress`
3. User enters email → `POST /api/save-progress/send-email` sends a resume link via Resend
4. Resume link: `https://www.clearlegacy.co.uk/forms/will.html?resume=<token>`
5. `GET /api/resume?token=<token>` returns saved formData + step number
6. Form auto-populates and jumps to the saved step

### Worker Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/save-progress | Save form data to KV (returns token) |
| POST | /api/save-progress/send-email | Send resume-link email via Resend |
| GET | /api/resume?token=... | Retrieve saved progress |

### KV Schema
- Key: `progress:<token>` (token = random 32-char hex)
- TTL: 30 days
- Deduplicated by email (new save overwrites previous for same email)
- Value: `{ email, firstName, formData, step, savedAt, resumeEmailSent, nurture2SentAt, nurture3SentAt, converted }`

### Source Files
- Front-end: `forms/will.html` (inline script at bottom)
- Back-end: `worker/src/handlers/save-progress.ts`

## Nurture Drip Emails (Abandoned Leads)

3-email sequence sent via Resend to users who saved progress but didn't convert. Runs on the existing 2-minute cron (`processNurtureEmails` in `worker/src/handlers/save-progress.ts`).

| Email | Timing | Subject | Content |
|-------|--------|---------|---------|
| 1 — Resume | Immediate | Your Will progress is saved — continue when you're ready | Resume link + reassurance |
| 2 — Social proof | +24 hours | {firstName}, you're closer than you think — finish your Will | 60% stat, social proof, resume CTA |
| 3 — Price anchor | +72 hours | Last reminder: your {price} Will vs £300+ solicitor — {firstName} | Price comparison table vs solicitor |

- Skips records where `converted: true`
- Skips records where resume email hasn't been sent yet (user still on form)
- Processes up to 50 saved-progress keys per cron run
- Updates KV with `nurture2SentAt` / `nurture3SentAt` timestamps

## Form Step Funnel Tracking

### GA4 Custom Events (fired in `forms/will.html`)
| Event | Parameters | When |
|-------|-----------|------|
| form_start | product (single/mirror) | Page load |
| form_step_complete | step_number (1-7), step_name, product | Each step advance |

### Mirrored to Meta Pixel & Microsoft UET
- Meta: `fbq('trackCustom', 'FormStart')`, `fbq('trackCustom', 'FormStepComplete', { step_number, step_name })`
- UET: `window.uetq.push('event', 'FormStart')`, `window.uetq.push('event', 'FormStepComplete', { event_label: step_name })`

### GA4 Funnel Exploration
Pre-built 4-step funnel in GA4 (property G-J3GPRFYR2Q):
1. form_start → 2. form_step_complete → 3. begin_checkout → 4. purchase

Refine with per-step `step_number` parameter filters once event data starts flowing (24-48h after deploy).

### Mid-Form Reassurance Nudges
`stepNudges` object in `forms/will.html` shows contextual reassurance messages (e.g. "Your details are encrypted & never shared") below the step counter on steps 2-7.

## Schema Markup

### Pricing Page (`/pricing/index.html`)
- Product + Offer schema for Single Will (£69) and Mirror Wills (£99)
- Includes `priceCurrency: GBP`, `availability: InStock`, `url`, `seller` (Kaizen Finance Ltd)

### Guide Pages
- FAQPage schema on all ~55 guide pages

## Ads Status
- **Bing Ads:** Primary channel, relaunched 2026-05-03, awaiting domain verification
- **Google Ads:** Hold changes until first Google-attributed conversion
- **Meta Ads:** Pixel installed, no active campaigns yet
