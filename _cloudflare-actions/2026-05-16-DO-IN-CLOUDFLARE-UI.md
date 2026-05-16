# Cloudflare Security Insights — exact UI steps for the 4 fixes you must do by hand

Companion to: clearlegacy_opus_ga4_cloudflare_conversion_audit.md
Generated: 2026-05-16

Items 1–4 here cover the high-value rows from the Security Insights CSV
(rows 6, 7, 8, 11, 18–22, 36 of the export). Items 5–7 explain what to
SKIP and why.

## 1. Enable 2FA on your Cloudflare account (5 min, ZERO risk)

Step-by-step:
1. Open https://dash.cloudflare.com
2. Top-right profile icon → **My Profile**
3. Left menu → **Authentication**
4. Section "Two-Factor Authentication" → **Get Started**
5. Choose **Authenticator app** (NOT SMS — SMS is interceptable)
6. Scan the QR code with Google Authenticator / 1Password / Authy
7. Enter the 6-digit code from the app to confirm
8. **DOWNLOAD AND SAVE THE BACKUP CODES** to your password manager.
   If you lose the authenticator and don't have these, you're locked out.

Why this matters: your Cloudflare account controls DNS, the worker, the
Stripe webhook route, and the SSL config. A compromise here = total loss
of control of the site.

## 2. Fix DMARC for clearlegacy.co.uk (5 min, very low risk)

You're missing DMARC records, which means transactional emails from
Resend (PDFs to customers, the nurture drip, the resume-your-will email)
risk being marked as spam by Gmail / Outlook. With 11 prior sales but
zero customer-side replies, some of these may already be sitting in spam.

Step-by-step:
1. Cloudflare dashboard → **clearlegacy.co.uk** zone → **DNS** → **Records**
2. Click **Add record**
3. Set:
   - Type: **TXT**
   - Name: **_dmarc**
   - Content (paste EXACTLY, all on one line):
     ```
     v=DMARC1; p=none; rua=mailto:dmarc@clearlegacy.co.uk; ruf=mailto:dmarc@clearlegacy.co.uk; fo=1; aspf=r; adkim=r
     ```
   - TTL: Auto
   - Proxy status: DNS only (grey cloud) — must be unproxied
4. Save.

What `p=none` means: Cloudflare will tell you what passes/fails DMARC
checks via aggregate reports to dmarc@clearlegacy.co.uk, but won't
reject any mail yet. **Watch reports for 2 weeks**, then upgrade to
`p=quarantine` (send fails to spam) and eventually `p=reject`.

Repeat for `send.clearlegacy.co.uk` subdomain:
- Add a TXT record at `_dmarc.send` with the same content.

ALSO check your SPF record (this should already exist if Resend is sending):
- DNS → Records → find the TXT record at the root (`clearlegacy.co.uk`)
  starting with `v=spf1`. It should include `include:_spf.resend.com` or
  similar. If it doesn't, Resend emails are unauthenticated.

## 3. Enable Always Use HTTPS + HSTS (3 min, low risk)

Your site already serves HTTPS — this enforces it.

Step-by-step:
1. Cloudflare → **clearlegacy.co.uk** zone → **SSL/TLS** → **Edge Certificates**
2. Find **Always Use HTTPS** → toggle ON
3. Find **HTTP Strict Transport Security (HSTS)** → **Enable HSTS**
4. Set:
   - Max-Age: **6 months** (safe starting value)
   - **Apply HSTS policy to subdomains: NO** (until you've audited every subdomain — api., send., brand-shield. etc.)
   - Preload: NO (only enable after you're sure)
   - No-Sniff Header: YES
5. Save.

Repeat for the **www.clearlegacy.co.uk** zone if it's a separate zone
(it usually isn't — www is typically a CNAME inside clearlegacy.co.uk).

## 4. Configure Security.txt (already done via static file)

I just pushed `.well-known/security.txt` to the repo. It will be served
from https://www.clearlegacy.co.uk/.well-known/security.txt automatically
after the next GitHub Pages deploy. You can leave the Cloudflare
Security.txt feature off — the static file satisfies the same RFC 9116
requirement that Cloudflare's scanner is checking for.

You may want to also create `/legal/responsible-disclosure.html` later to
back up the `Policy:` reference. Not urgent.

## 5. SKIP: Bot Fight Mode (rows 5, 9, 23)

The conversion audit explicitly warned this over-challenges mobile users.
Adding it now risks re-introducing the "real UK customer blocked at form"
scenario. Leave OFF.

## 6. SKIP: AI Labyrinth + Block AI bots (rows 2, 3, 10)

ClearLegacy actively benefits from being crawled by GPTBot, Gemini,
Perplexity — that's how the AEO pages (`/are-online-wills-safe-uk/` etc)
get cited in AI-answer queries. Enabling AI Labyrinth would harm AEO.

If you ever want to selectively block one AI bot, do it as a single WAF
custom rule based on user-agent, not as a blanket toggle.

## 7. SKIP: Turnstile (row 37)

CAPTCHAs reduce conversion. The qualifier regression cost you 8 days of
sales; adding a CAPTCHA on top would do the same. Only add Turnstile if
spam submissions become a real problem (and even then, prefer honeypot
fields over visible challenges).

## 8. INVESTIGATE: api.clearlegacy.co.uk TLS warnings (rows 12-14)

The scanner says api.clearlegacy.co.uk accepts HTTP on port 80 without
redirecting to HTTPS. Likely a false positive (Cloudflare Workers don't
serve port 80 in the traditional sense), but worth a 30-second check:

In a terminal: `curl -I http://api.clearlegacy.co.uk`

- If you get a 301/308 redirect to https:// — false positive, ignore.
- If you get a 200 or 404 with no redirect — there's a real config gap
  in the worker's custom domain. Tell me and I'll patch.

## 9. INVESTIGATE: brand-shield.byerim.com.clearlegacy.co.uk (rows 15-17)

This is a weird auto-generated subdomain. Probably Cloudflare Brand
Protection. Not used by ClearLegacy directly. Safe to ignore — but if
you don't recognise the service, consider deleting the DNS record:
DNS → Records → find `brand-shield...` entries → delete.

## 10. erimkaur.com / byerim.com (rows 23-35)

Separate domains. Same fixes apply (DMARC, 2FA already covers them at
the account level). Not urgent for ClearLegacy revenue recovery.
