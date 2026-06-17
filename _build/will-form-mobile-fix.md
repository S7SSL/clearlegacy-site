# Will form — mobile completion fix (diagnosis + safe patch)

**Symptom (GA4, 30d):** mobile reaches step 1 like desktop (52 vs 57 starts) but completes at **1.9% vs 28%**. Users get stuck *on* step 1 (form_step_1 advance barely fires).

**Diagnosis:**
1. **Heavy step 1** — 8 required fields before you can advance (name, DOB, full address, strict-regex postcode, email, marital status). Punishing on mobile.
2. **Continue button obscured on mobile** — the bottom-of-step "Continue →" can be covered by the fixed `#cl-cookie` consent bar (only 72px reserved; it wraps taller on mobile) and/or the on-screen keyboard.

---

## SAFE PATCH A — stop the cookie bar ever covering the form (low risk, isolated)
The current script (near the bottom of `forms/will.html`):
```html
<script>if(!localStorage.getItem('cl_ok')){document.getElementById('cl-cookie').style.display='flex';document.body.classList.add('cl-cookie-visible');}</script>
```
**Replace it with:** (measures the bar's real height and reserves exactly that much, on every resize/keyboard change — so the Continue button is never hidden behind it)
```html
<script>
(function(){
  var bar=document.getElementById('cl-cookie');
  if(!bar) return;
  if(!localStorage.getItem('cl_ok')){ bar.style.display='flex'; document.body.classList.add('cl-cookie-visible'); }
  function reserve(){
    document.body.style.paddingBottom = (getComputedStyle(bar).display==='none') ? '' : (bar.offsetHeight + 16) + 'px';
  }
  reserve();
  window.addEventListener('load', reserve);
  window.addEventListener('resize', reserve);     // fires on mobile keyboard open/close + rotate
  setTimeout(reserve, 400);
})();
</script>
```
This only changes the consent bar's spacing — it does not touch the form logic or payment.

## SAFE PATCH B — make Continue reachable with the keyboard up (mobile only, low risk)
Add to the `@media(max-width:600px)` block (line ~120):
```css
@media(max-width:600px){
  .form-nav{position:sticky; bottom:0; background:#fff; padding:12px 0; z-index:40;
            box-shadow:0 -4px 12px rgba(0,0,0,.06); margin-top:24px}
}
```
A sticky bottom nav keeps "Continue" visible above the keyboard/cookie bar on phones — a standard mobile-form pattern. Test that it doesn't fight the cookie bar (Patch A handles the spacing).

---

## HIGHER-CONFIDENCE STRUCTURAL FIX (form owner) — split step 1
Step 1 asks for full identity **and** full address at once. The proven mobile CRO fix is to split it: ask name + email + DOB first (low-friction, gets commitment), then address/postcode on a later step. Fewer fields per mobile screen = far higher completion. This is a form-owner change, not a drop-in.

---

## DEFINITIVE CONFIRMATION (do this before/after) — Microsoft Clarity mobile recordings
This is Phase 3 of the diagnostic brief and the only way to be *sure*. Filter Clarity to **mobile + reached the form + did not purchase**, watch 10 sessions, and look for: dead-clicks on "Continue", rage-clicks, a field that keeps erroring (likely postcode), or the button hidden behind the keyboard/cookie bar. That tells us exactly which fix moves the needle — rather than guessing.

**Coordination:** `forms/will.html` is maintained by the parallel workstream (recent commits show active form fixes). Hand them Patches A/B + this diagnosis, or have me apply them after you confirm with a Clarity recording.
