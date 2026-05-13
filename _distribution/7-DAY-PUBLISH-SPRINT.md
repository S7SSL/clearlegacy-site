# ClearLegacy — 7-Day Distribution Sprint Plan

**Goal:** Publish all 10 off-site drafts across Medium, LinkedIn, Reddit/forum, and Quora within 7 days, with each piece linking back to a specific money page using a specific anchor text. This is the distribution layer that turns indexed-but-not-ranking pages into ranking pages.

**Why distribution matters now:** Stages 4–6 built ~30 commercial/comparison pages. They're indexed. They're not ranking, because Google has nothing external pointing at them. Each off-site article = 1 backlink + 1 brand mention + 1 anchor-text signal. Ten of those, well placed, is the difference between page 3 and page 1 for long-tail queries.

## Asset inventory

All 10 drafts live in `_offsite-drafts/` in the repo. They are publishable as-is — minor tweaks for platform voice are fine but don't rewrite from scratch.

| # | Draft | Target money page | Anchor text |
|---|---|---|---|
| 01 | Online wills explained | /online-will-uk/ | online will UK |
| 02 | Cheap will UK guide | /cheap-will-uk/ | cheap will UK |
| 03 | Make a will online step-by-step | /make-a-will-online-uk/ | make a will online |
| 04 | What is a legally valid will | /legally-valid-will-uk/ | legally valid will |
| 05 | Mirror wills explained | /mirror-wills-uk/ | mirror wills UK |
| 06 | Real cost of dying without a will | /online-will-uk/ | online will UK |
| 07 | How to sign a will (Wills Act s.9) | /legally-valid-will-uk/ | legally valid will |
| 08 | Married couples still need wills | /mirror-wills-uk/ | mirror wills UK |
| 09 | What makes a will legally valid | /legally-valid-will-uk/ | legally valid will |
| 10 | Unmarried partners + no will | /online-will-uk/ | online will UK |

## Day-by-day plan

### Day 1 — Medium (3 posts)

Medium is the easiest fast win. Publish 3 articles, anchor links naturally inside the body.

- Draft 01 → Medium · headline: *"Online Wills in the UK: How They Actually Work in 2026"*
- Draft 06 → Medium · headline: *"The Real Cost of Dying Without a Will in the UK"*
- Draft 09 → Medium · headline: *"What Actually Makes a Will Legally Valid in the UK"*

Each Medium article should:
- Be 500–800 words (use the draft length as-is)
- Have one inline link to the target money page with the exact anchor text from the table above
- Include a short author bio at the end: *"Sat is the founder of ClearLegacy, a UK online will service."*

### Day 2 — LinkedIn articles (2 long-form posts)

LinkedIn Articles (not "posts") rank in Google. Publish 2:

- Draft 02 → LinkedIn Article · headline: *"Why Cheap Online Wills in the UK Aren't a Compromise — If You Pick the Right One"*
- Draft 04 → LinkedIn Article · headline: *"Is Your Will Actually Legally Valid? Five Tests Under the Wills Act 1837"*

Both with one inline anchor-text link to the target page.

### Day 3 — Reddit + MoneySavingExpert (use Reddit playbook)

See `REDDIT-FORUM-PLAYBOOK.md`. Aim for 2 thread responses today using drafts 1 and 2 from that playbook. Find live threads via the search queries on the bottom of that doc.

### Day 4 — Quora (2 answers)

Search Quora for questions matching:
- "Are online wills legal in the UK?"
- "How much should a will cost in the UK?"
- "What's the difference between Farewill and a solicitor?"

Answer 2 of them using drafts 1 and 3 from the Reddit playbook as a base — Quora prefers slightly more structured answers (numbered lists). Naked ClearLegacy mention by name is fine — Quora is more lenient than Reddit. One link is acceptable, target /online-will-uk/.

### Day 5 — Medium (3 more posts)

- Draft 03 → Medium · headline: *"How to Make a Will Online in the UK: A 15-Minute Walkthrough"*
- Draft 05 → Medium · headline: *"Mirror Wills for UK Couples — What They Are and Whether You Need Them"*
- Draft 07 → Medium · headline: *"How to Actually Sign a Will Correctly Under UK Law"*

### Day 6 — LinkedIn + business directories

- Draft 08 → LinkedIn Article · headline: *"Married Couples Still Need Wills — Here's Why"*
- Draft 10 → LinkedIn Article · headline: *"Unmarried Partners and the UK Intestacy Trap"*

Submit ClearLegacy to:
- FreeIndex (UK business directory) — free listing with link
- Yell.com — free profile
- ScootleUK — free listing
- TouchLocal — free listing

Each profile: one link to https://www.clearlegacy.co.uk (homepage, no anchor needed — these are nofollow but contribute to brand signals).

### Day 7 — Recap + secondary distribution

- Cross-post the 6 Medium articles to your LinkedIn personal feed as short summaries with "read more" linking to the Medium piece (Medium gets the SEO benefit, LinkedIn drives the second wave of social signals).
- Tweet/X one-line summaries of each Medium piece with the Medium URL (5–10 tweets, spread across the day, not all at once).
- Post one Facebook page status linking to the best-performing Medium piece by Day 7.

## What to track

After 7 days, check:

1. **GSC → Performance → +6 days of impressions on the money pages.** Specifically watch `/online-will-uk/`, `/cheap-will-uk/`, `/mirror-wills-uk/`, `/legally-valid-will-uk/` — these are the four pages every off-site piece links into.
2. **GA4 → Acquisition → Referral.** Medium and LinkedIn show up under "Referral" — count the sessions in.
3. **Brand search impressions in GSC.** Search "ClearLegacy" in the Queries tab — this should tick up from low single digits to double digits if distribution is working.

## What "ranking breakthrough" looks like in week 2–3

If the sprint works, you'll see one or both of:

- A long-tail query like *"is an online will legal uk"* or *"cheapest will writing service uk"* showing up in GSC with a position of 20–40 — not page 1 yet, but no longer invisible.
- The first sessions on a money page that came from organic search (not paid).

The first sale from organic search typically follows 7–14 days after the first long-tail impression breakthrough. That's the loop the brief is asking for.

## What to do if nothing has happened by day 14

Two diagnostic checks:

1. **Are the Medium and LinkedIn pieces themselves indexed?** Site-search `site:medium.com ClearLegacy` and `site:linkedin.com ClearLegacy`. If they're indexed but money pages still aren't moving, the issue is anchor text density (consider increasing variety) or page-level on-page (consider adding internal links from new content).
2. **Are the links being followed?** Medium and LinkedIn are nofollow by default — that's fine, they still pass brand and discovery signals. But if every link is nofollow, supplement with real dofollow links from guest posts on UK finance blogs (Tier 2 in the brief — this is week 3–4 work, not week 1).
