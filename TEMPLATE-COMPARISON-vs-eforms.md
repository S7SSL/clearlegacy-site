# Clear Legacy single will — cross-reference vs eforms.com template

**Reference template:** https://eforms.com/form/last-will-testament-form/
(Both `.docx` files uploaded are identical copies of this.)

**Clear Legacy template:** `worker/templates/will.html`

---

## Headline: the two templates are for different jurisdictions

The eforms.com template is a **US generic** will: "Personal Representative", State-of-___ governing law, SSN last-4 for beneficiaries, Internal Revenue Code references, Testamentary Affidavit + Notary Public (a US "self-proving affidavit" under the Uniform Probate Code), and GST exemption elections.

Clear Legacy is **England & Wales**: "Executors and Trustees", s.9 + s.15 Wills Act 1837 attestation, two witnesses in joint presence, no notarisation.

A like-for-like clause comparison is not meaningful — most eforms content is US-only. What IS useful is walking through each eforms clause and asking: is this concept present in Clear Legacy, does Clear Legacy handle it differently for E&W, or is it a real gap worth filling?

---

## Clause-by-clause cross-reference

| eforms clause | Clear Legacy equivalent | Verdict |
|---|---|---|
| Declaration (sound mind, no duress, revocation of prior wills) | Clause 1 "Declaration and Revocation" | **Covered** — but Clear Legacy does not include an express "sound mind, not acting under duress or undue influence, fully understanding nature and extent of my property" recital. That recital is cheap evidence in a capacity/undue-influence challenge. **Worth adding.** |
| Expenses & Taxes (direct payment of debts, funeral, IHT) | Implicit in clause 4 "subject to the payment of my debts, funeral and testamentary expenses" | **Partially covered.** Clear Legacy rolls this into the residuary clause. eforms breaks it out. For E&W, an explicit IHT direction ("any inheritance tax attributable to the residuary estate shall be paid as a testamentary expense out of the residue") is standard practice and removes ambiguity about which gifts bear tax. **Worth adding as a short dedicated clause.** |
| Personal Representative (US) | Clause 2 "Appointment of Executors" (two tiers: dies/unable → survivors) | **Covered and correctly localised.** Clear Legacy appoints both Executors AND Trustees in one breath, which is UK best practice. |
| Disposition of Property (3 named beneficiaries with SSNs) | Clauses 3 (specific gifts, optional) + 4 (residuary) | **Covered.** Clear Legacy's structure (specific gifts → residuary) is cleaner than eforms' flat beneficiary list. No SSNs (correct — UK wills don't use them). |
| Omission clause ("I have intentionally omitted...") | **Not present** | **Real gap.** In E&W, express disinheritance language is strongly recommended to pre-empt claims under the Inheritance (Provision for Family and Dependants) Act 1975. A clause like *"I have deliberately made no provision for [X / any person not named above] and this omission is intentional"* (ideally with a brief reason recorded in a side letter of wishes) is standard defensive drafting. **Worth adding.** |
| Bond waiver | **Not present** | **Not needed.** Executor bonds are a US concept; E&W doesn't require them. |
| Discretionary Powers (A–K, two pages) | Clause 5 "Powers of my Trustees" (a–d) | **Thinner in Clear Legacy.** Clear Legacy has: retain/sell/convert investments, appropriate assets, engage professionals, statutory maintenance/advancement. Missing vs eforms (adapted for E&W): power to **lease real estate**, power to **borrow / mortgage / pledge** estate assets, power to **compromise/settle claims**, power to **vote shares / exercise rights in respect of securities**, power to **make tax elections** (relevant for E&W IHT/CGT), power to **employ agents** (STEP standard). The four existing clauses plus "all powers conferred by law" is probably enough for a simple estate — but **incorporating STEP Standard Provisions (3rd Edition) by reference is the one-line fix that gives you the full professional toolkit.** Strongly recommended. |
| Contesting Beneficiary (no-contest / forfeiture clause) | **Not present** | **Worth considering.** No-contest clauses are enforceable in E&W subject to public policy. They don't stop an I(PFD)A 1975 claim but they do discourage spurious challenges to the will's validity. Lower priority than the omission clause. |
| Guardian ad litem not required | **Not applicable in E&W** — skip. |
| Gender / singular-plural construction clause | **Not present** | Minor — modern E&W precedents often omit this and rely on Interpretation Act 1978. Nice-to-have, not important. |
| Assignment (spendthrift restraint on beneficiaries) | **Not present** | Rarely used in simple E&W wills; mostly a US asset-protection concept. Skip. |
| Governing Law: State of ___ | Footer: "Jurisdiction: England & Wales" | **Covered in footer.** Consider promoting to a proper clause ("This Will shall be construed and take effect in accordance with the laws of England and Wales") — cleaner for probate. |
| Binding Arrangement (Executor's decisions final; trustee exoneration for non-wilful default) | **Not present** | **Worth adding** — a short trustee exoneration clause is standard in E&W wills, especially for lay executors. Again: STEP Standard Provisions 3rd Edition covers this. |
| Execution block (testator signature, date, witness signatures+addresses) | "Attestation" clause + sig block with witness name/occupation/address | **Covered and better than eforms** — Clear Legacy includes the correct s.9 Wills Act 1837 attestation language and the s.15 warning that beneficiaries/beneficiaries' spouses cannot witness. eforms' witness block is thinner. |
| Testamentary Affidavit + Notary Public | **Not applicable in E&W** — no such concept. A self-proved will is a US/UPC device. In E&W, witness attestation is sufficient; if needed later, witnesses can provide an affidavit of due execution under r.12 Non-Contentious Probate Rules 1987. Skip. |

---

## What Clear Legacy has that eforms does NOT (and correctly so)

- **28-day survivorship period** on residuary and specific gifts — reduces IHT double-charge risk if a beneficiary dies shortly after the testator. Good drafting.
- **Per stirpes substitution** for deceased residuary beneficiaries — essential for a simple E&W will.
- **Guardianship clause for minor children** (optional, data-driven) — well-structured.
- **Explicit s.15 Wills Act 1837 warning** to witnesses in the guidance footer — protects against gifts failing.
- **Proper A4 / en-GB / Georgia serif presentation** — looks like a real UK solicitor's document.

---

## Summary: recommended additions to `will.html`

In priority order:

1. **Express disinheritance / omission clause** (I(PFD)A 1975 defence) — HIGH priority.
2. **Capacity and no-duress recital** in clause 1 — cheap evidence against future challenge.
3. **Express IHT direction** — short clause stating IHT is paid out of residue as a testamentary expense.
4. **Incorporate STEP Standard Provisions (3rd Edition) by reference** — one-line fix that dramatically expands trustee powers and adds proper exoneration/professional-charging clauses. This is the single highest-leverage improvement.
5. **Promote "Jurisdiction: England & Wales" from footer to a proper governing-law clause.**
6. (Optional, lower priority) No-contest clause.
7. (Optional, minor) Trustee exoneration for non-wilful default, gender/singular-plural construction clause — both subsumed by STEP SP if you go route 4.

None of these are bugs in the current template. Clear Legacy's will.html is a competent simple-will draft that covers the minimum statutory requirements for E&W. The suggestions above are how to move it from "valid simple will" to "defensible against the common challenges".

---

## What NOT to import from eforms (US-only, would be incorrect for E&W)

- "Personal Representative" terminology (use Executor/Trustee)
- "State of ___" governing law
- SSN / Social Security Number references
- Internal Revenue Code citations
- GST tax exemption elections (US estate tax)
- Notary Public / Testamentary Affidavit (use the existing s.9 attestation instead)
- Bond waiver (not needed in E&W)
- Guardian ad litem clause (not the correct mechanism in E&W)

---

*This is a drafting review, not legal advice. Any clause change should be signed off by a qualified E&W solicitor or STEP practitioner before going into a customer-facing production template. The existing template's own header comment says the same: "This is a DRAFT template. It MUST be reviewed by Marge (estate planner) before any customer-facing use."*
