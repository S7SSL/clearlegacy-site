# Will Template — Clauses Reference

**Status:** Optional reference — **not a launch blocker**. The site goes live using
the template as-written; this doc exists so anyone (Marge or otherwise) reviewing
the template later can quickly see which clause does what and where to change it.

The full template lives in `worker/templates/will.html`. Every section below maps
to an exact block in the template file so swaps are trivial.

**Jurisdiction:** England & Wales.
**Format:** A4, serif, clause-numbered.
**Target customer:** adult testator with simple-to-moderate estates, executing
Single Wills (£69) or Mirror Wills (£99). No trusts, no business property relief
structuring, no non-UK assets — those are out of scope for this MVP.

---

## Clause 1 — Declaration and Revocation

> I, **[Name]** (born [DOB]), of [address], DECLARE this to be my last Will and
> Testament. I HEREBY REVOKE all former wills and testamentary dispositions made
> by me.

**Purpose:** Establishes identity of the testator and revokes any earlier Wills
so they don't partially survive and cause interpretation conflicts.

**Defaults:** Name is full legal name as typed; DOB is only shown if the form
captured it (optional field).

**Review question:** Do you want the address to include "previously of" for any
prior addresses on HMLR records? Current template takes the current address only.

---

## Clause 2 — Appointment of Executors

> I APPOINT the following person(s) to be the executor(s) and trustee(s) of this
> my Will... [table of names, relationships, addresses] ...
> If any of them shall die before me or be unwilling or unable to act, the
> survivor or survivors shall act as sole executor and trustee.

**Purpose:** Grant of probate and power to administer.

**Defaults:**
- Accepts 1–6 executors (form caps at 6).
- Survivorship clause: if some die/refuse, the rest serve. No cascading
  substitute executors written in (the form currently allows up to 6 primary
  executors; they stand or fall together).
- "Executor and trustee" — important for the residuary trust in Clause 4.

**Review questions:**
- Should we add a professional executor fallback clause (e.g. "if none survive
  me, I appoint [firm name]")? Currently no — MVP only uses named individuals.
- Attestation power (power to charge for professional services) — I've added
  this at Clause 6(c). Please confirm wording acceptable.

---

## Clause 3 — Appointment of Guardian(s) *(optional, only if guardians provided)*

> If any of my children is a minor at the date of my death and no person with
> parental responsibility for that child survives me, I APPOINT the following as
> guardian(s) of my minor children...

**Purpose:** s.5 Children Act 1989 guardian appointment.

**Defaults:** Conditional on no surviving person with PR — avoids the common
error of a guardian displacing a surviving parent.

**Review questions:**
- Some estate planners prefer adding express authority for the guardian to
  receive maintenance/advancement payments. Currently we use the general
  Trustees' power in Clause 6. OK?

---

## Clause 4 — Specific Gifts *(optional)*

> I GIVE the following specific gifts free of inheritance tax and free of any
> costs of transfer or delivery...
> [list of gifts] ...
> provided that person survives me by 28 days; failing which the gift shall
> fall into my residuary estate.

**Purpose:** Pecuniary and chattel gifts.

**Defaults:**
- 28-day survivorship.
- Failed gifts fall into residue (not a substitute beneficiary). This is the
  simpler approach — if Marge wants per stirpes substitution on specific gifts
  too, flag it.
- Gifts are "free of IHT" — i.e. payable out of residue. If you want the
  default to be "subject to IHT" or "free of IHT from residue only if there
  is enough", let me know.

**Review questions:**
- Do you want charitable gifts worded differently (e.g. "to [charity name]
  (Registered charity no. ...)")? Currently we take whatever the form captured.

---

## Clause 5 — Residuary Estate

> I GIVE, DEVISE AND BEQUEATH the whole of my estate... to my Trustees upon
> trust to hold the same for the following beneficiaries, provided they survive
> me by 28 days...
> If any such beneficiary shall fail to survive me by 28 days, their share
> shall pass to their issue (if any) in equal shares per stirpes, and failing
> such issue, to the surviving residuary beneficiaries in proportion to their
> shares.

**Purpose:** Residuary gift and substitution.

**Defaults:**
- 28-day survivorship.
- Per stirpes substitution down the bloodline.
- If no issue, share falls to surviving residuary beneficiaries pro rata.
- Shares can be typed as "50%", "equal", or "residuary estate" — the form
  passes the literal text through.

**Review questions:**
- If the user picks "Mirror Wills" and says "leave everything to my partner and
  then to the children", the current form collects this as a single
  partner-primary beneficiary with the fallback described in the notes. Do you
  want a more structured two-step residuary clause (partner first, then
  children per stirpes)? That would require a small schema tweak; happy to do
  it if you think it matters for legal cleanliness.

---

## Clause 6 — Powers of Trustees

> In addition to all powers conferred by law, my Trustees shall have power:
> (a) to retain, sell, convert or vary any investments...
> (b) to appropriate any asset... without the consent of any beneficiary...
> (c) to engage and remunerate any professional adviser (including any of
>     themselves who is a professional)...
> (d) to exercise all statutory powers of maintenance and advancement...

**Purpose:** Administrative powers — most of this is already implied by the
Trustee Act 2000 / Administration of Estates Act 1925 but explicit recital is
safer for lay executors dealing with banks and HMRC.

**Review questions:**
- Do you want me to add:
  - Power to invest in assets of any kind, subject to Trustee Act 2000 s.4?
  - Self-dealing permission (trustee can purchase trust property at market
    value)? This is often controversial; I've left it out.
  - Indemnity clause for executors?

---

## Clause 7 — Funeral Wishes *(optional)*

Free-text field, rendered verbatim after an introductory sentence saying the
wishes are non-binding.

**Review questions:**
- OK to render funeral wishes verbatim from the form? (User typos are the
  main risk.)

---

## Clause 8 — Additional Wishes *(optional)*

Free-text for anything the user wants recorded. Rendered in a bordered box so
it's clearly testator's own words.

**Review questions:**
- Should this be inside the Will at all, or only in an accompanying "Letter
  of Wishes" (which we don't currently produce)? Some planners exclude this
  because it creates interpretation noise.

---

## Clause 9 — Attestation

> IN WITNESS WHEREOF I, the said **[Name]**, have signed my name to this my
> last Will and Testament, consisting of this and the preceding pages, on the
> date written below, in the joint presence of the two witnesses named below,
> who have then at my request and in my presence and in the presence of each
> other signed their names as witnesses.

**Purpose:** s.9 Wills Act 1837 compliance.

**Defaults:**
- Testator signs on last page.
- Two witnesses, signing in joint presence (in-person).
- Under the document, witnesses' name/address/occupation blanks.

**Review questions:**
- Do you want a separate page for signatures (to avoid page-breaks splitting
  the attestation)? The CSS uses `page-break-inside: avoid` so it should
  stay together but I haven't tested with a 10-page Will.
- Remote witnessing under the Wills Act 1837 (Electronic Communications)
  (Amendment) Order 2024 — we do **not** support this. Wording says
  "in person". Confirm that's the right call for a lay-focused product.

---

## Witness guidance block (after the signatures)

> Both witnesses must be present with you at the same time when you sign.
> Witnesses must be 18 or over, of sound mind, and must not be (nor married to)
> any beneficiary named in this Will, otherwise the gift to that beneficiary
> will fail under s.15 Wills Act 1837.

**Purpose:** Catches the #1 self-service Will failure — witness-beneficiary
conflict. It's plain English, not a clause of the Will itself.

**Review questions:**
- Is this strong enough? The customer email repeats this warning too.

---

## Things deliberately *not* included

These can be added in a later release; flagging so you can confirm they're
genuinely out of scope for MVP:

- Trusts for minors beyond the statutory s.31/s.32 powers (no bereaved minors
  trusts, no s.144 trusts, no discretionary trusts).
- Life interest trusts (no s.49A flexible life interests).
- Business property / agricultural property reliefs.
- Foreign assets (no separate foreign-law Wills).
- Digital assets clause (passwords, crypto, social media).
- Organ donation / body donation to science.
- Funeral payment earmarking (e.g. "up to £5,000 from residue").
- Pets and pet care provisions.
- Specific instructions for the executor re: tax return filing.

If any of these should be defaults rather than optional, flag and we add a
form step and clause in v2.

---

## Making changes later

To edit any clause: open `worker/templates/will.html`, find the clause, edit
the wording, redeploy the Worker (`cd worker && npx wrangler deploy`). Changes
apply to all Wills generated from that point onwards; already-generated PDFs in
R2 are unchanged.

If you want to add or remove a clause entirely, you may also need to tweak the
form schema (`forms/will.html`) and the Worker's validator (`worker/src/handlers/lead.ts`).
