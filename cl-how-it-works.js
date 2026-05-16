/*
 * ClearLegacy "How It Works" — cl-how-it-works.js
 * 5-step visual process. Injects into homepage + pricing page only.
 * Drop-in: <script src="/cl-how-it-works.js" defer></script>
 *
 * Insertion strategy: tries to find an element with id="how-it-works" first
 * (if Sat has placed a marker), otherwise appends before the testimonials
 * or footer. Silently exits on form/thank-you/admin pages.
 */
(function () {
  'use strict';
  if (window.__clHowItWorksLoaded) return;
  window.__clHowItWorksLoaded = true;

  var SITE = window.location.pathname;
  if (/\/forms\/|\/thank-you|\/admin|\/account|\/legal/i.test(SITE)) return;
  // Only run on root, /wills/, /pricing/ — pages where this section actually fits
  var isEligible = SITE === '/' || /\/pricing\/?$|\/wills\/?$|\/wills\/index/i.test(SITE);
  if (!isEligible) return;

  function inject() {
    if (document.getElementById('cl-how-it-works')) return;

    var section = document.createElement('section');
    section.id = 'cl-how-it-works';
    section.innerHTML = ''
      + '<style>'
      + '#cl-how-it-works{background:#fff;padding:64px 5%;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;font-family:Inter,system-ui,sans-serif}'
      + '#cl-how-it-works .wrap{max-width:1080px;margin:0 auto}'
      + '#cl-how-it-works .eyebrow{display:block;text-align:center;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#2563eb;margin-bottom:8px;font-family:Inter,system-ui,sans-serif}'
      + '#cl-how-it-works h2{font-family:Manrope,sans-serif;font-weight:700;font-size:clamp(26px,4vw,34px);line-height:1.2;color:#0f172a;text-align:center;margin-bottom:14px;letter-spacing:-0.01em}'
      + '#cl-how-it-works .sub{text-align:center;color:#475569;font-size:16px;max-width:620px;margin:0 auto 44px;line-height:1.6}'
      + '#cl-how-it-works .steps{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;position:relative}'
      + '#cl-how-it-works .step{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:24px 18px 20px;position:relative;transition:transform .15s,box-shadow .15s,border-color .15s}'
      + '#cl-how-it-works .step:hover{transform:translateY(-2px);box-shadow:0 14px 30px -12px rgba(15,23,42,.18);border-color:#bfdbfe}'
      + '#cl-how-it-works .num{position:absolute;top:-12px;left:18px;background:#2563eb;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Manrope,sans-serif;font-weight:700;font-size:13px}'
      + '#cl-how-it-works .icon{width:36px;height:36px;color:#2563eb;margin-bottom:10px;margin-top:4px}'
      + '#cl-how-it-works .step h3{font-family:Manrope,sans-serif;font-weight:700;font-size:15px;color:#0f172a;margin:0 0 6px;line-height:1.3}'
      + '#cl-how-it-works .step p{font-size:13.5px;color:#475569;line-height:1.55;margin:0}'
      + '#cl-how-it-works .cta{text-align:center;margin-top:36px}'
      + '#cl-how-it-works .cta a{display:inline-flex;align-items:center;gap:8px;background:#2563eb;color:#fff;font-family:Manrope,sans-serif;font-weight:700;font-size:15px;padding:14px 26px;border-radius:10px;text-decoration:none;transition:transform .15s,background .15s}'
      + '#cl-how-it-works .cta a:hover{background:#1d4ed8;transform:translateY(-1px)}'
      + '@media(max-width:880px){#cl-how-it-works .steps{grid-template-columns:repeat(2,1fr)}}'
      + '@media(max-width:520px){#cl-how-it-works .steps{grid-template-columns:1fr}#cl-how-it-works{padding:48px 5%}}'
      + '</style>'
      + '<div class="wrap">'
      +   '<span class="eyebrow">How it works</span>'
      +   '<h2>From questions to a legally valid will in 5 simple steps</h2>'
      +   '<p class="sub">15 minutes of your time. A qualified estate planner reviews every will before it lands in your inbox.</p>'
      +   '<div class="steps">'
      +     '<div class="step"><span class="num">1</span>'
      +       '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
      +       '<h3>Answer guided questions</h3>'
      +       '<p>Walk through a structured questionnaire online — ~15 minutes. We pre-fill what we can.</p>'
      +     '</div>'
      +     '<div class="step"><span class="num">2</span>'
      +       '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
      +       '<h3>Estate planner reviews</h3>'
      +       '<p>A qualified estate planner checks every will against the Wills Act 1837 before release.</p>'
      +     '</div>'
      +     '<div class="step"><span class="num">3</span>'
      +       '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,6 12,13 2,6"/><rect x="2" y="6" width="20" height="14" rx="2"/></svg>'
      +       '<h3>Delivered in 24 hours</h3>'
      +       '<p>You receive your completed will as a PDF by email. Print it on plain paper.</p>'
      +     '</div>'
      +     '<div class="step"><span class="num">4</span>'
      +       '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
      +       '<h3>Sign with two witnesses</h3>'
      +       '<p>Two adult witnesses present at the same time. Step-by-step instructions included.</p>'
      +     '</div>'
      +     '<div class="step"><span class="num">5</span>'
      +       '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
      +       '<h3>Legally binding</h3>'
      +       '<p>Your will is now a fully valid legal document. Store it somewhere safe.</p>'
      +     '</div>'
      +   '</div>'
      +   '<div class="cta"><a href="/forms/will.html?product=single" data-cta="how_it_works_section">Start My Will — £69 →</a></div>'
      + '</div>';

    // Insertion point — prefer a marker, then before testimonials, then before footer
    var marker = document.getElementById('how-it-works');
    if (marker) { marker.appendChild(section); return; }

    var testimonials = document.querySelector('section[id*="testimonial" i], section[class*="testimonial" i], #testimonials');
    if (testimonials && testimonials.parentNode) {
      testimonials.parentNode.insertBefore(section, testimonials);
      return;
    }

    var footer = document.querySelector('footer, .site-footer, footer.site-footer');
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(section, footer);
      return;
    }

    document.body.appendChild(section);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }
})();
