/*
 * ClearLegacy founder story — cl-founder-story.js  (patch 0038)
 * Injects a "Why ClearLegacy exists" section on the homepage between
 * How It Works and testimonials. Single source of truth for founder voice.
 * Drop-in: <script src="/cl-founder-story.js?v=2" defer></script>
 */
(function () {
  'use strict';
  if (window.__clFounderStoryLoaded) return;
  window.__clFounderStoryLoaded = true;

  var SITE = window.location.pathname;
  // Show on homepage only
  if (!(SITE === '/' || /^\/index\.html?$/i.test(SITE))) return;

  function inject() {
    if (document.getElementById('cl-founder-story')) return;

    var section = document.createElement('section');
    section.id = 'cl-founder-story';
    section.innerHTML = ''
      + '<style>'
      + '#cl-founder-story{background:#f8fafc;padding:64px 5%;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-family:Inter,system-ui,-apple-system,sans-serif}'
      + '#cl-founder-story .wrap{max-width:760px;margin:0 auto}'
      + '#cl-founder-story .eyebrow{display:block;text-align:center;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#2563eb;margin-bottom:12px;font-family:Inter,system-ui,sans-serif}'
      + '#cl-founder-story h2{font-family:Manrope,sans-serif;font-weight:700;font-size:clamp(26px,4vw,34px);line-height:1.2;color:#0f172a;text-align:center;margin-bottom:32px;letter-spacing:-0.01em}'
      + '#cl-founder-story .panel{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:36px 36px 28px;box-shadow:0 12px 30px -16px rgba(15,23,42,.12)}'
      + '#cl-founder-story p{font-size:16.5px;line-height:1.75;color:#334155;margin-bottom:16px}'
      + '#cl-founder-story p:last-of-type{margin-bottom:0}'
      + '#cl-founder-story strong{color:#0f172a;font-weight:600}'
      + '#cl-founder-story .signoff{margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;text-align:right;font-style:italic;color:#64748b;font-size:15px}'
      + '#cl-founder-story .signoff strong{font-style:normal;color:#0f172a;font-weight:600;letter-spacing:0.04em}'
      + '@media(max-width:600px){#cl-founder-story{padding:48px 5%}#cl-founder-story .panel{padding:28px 22px 22px}}'
      + '</style>'
      + '<div class="wrap">'
      +   '<span class="eyebrow">Founder note</span>'
      +   '<h2>Why ClearLegacy exists</h2>'
      +   '<div class="panel">'
      +     '<p>I built ClearLegacy because writing a will should be private, secure, and easy &mdash; not a &pound;400 appointment in someone else’s office talking through your family in front of a stranger.</p>'
      +     '<p>Modern technology has finally caught up. AI-powered automation handles the structured questionnaire end-to-end, draft preparation runs in minutes, and a <strong>qualified estate planner reviews every completed will</strong> before it lands in your inbox. You get the same legally valid will a solicitor would draft &mdash; under the same <strong>Wills Act 1837</strong> &mdash; without leaving your sofa, and at a fraction of the price.</p>'
      +     '<p>That gives you complete autonomy. Your details stay yours. Your decisions stay yours. The legal protection is identical. The price is what it always should have been.</p>'
      +     '<div class="signoff">&mdash; <strong>SL</strong>, Founder</div>'
      +   '</div>'
      + '</div>';

    // Insertion priority: before testimonials → before How It Works → before footer
    var testimonials = document.querySelector('section[id*="testimonial" i], section[class*="testimonial" i], #testimonials');
    if (testimonials && testimonials.parentNode) {
      testimonials.parentNode.insertBefore(section, testimonials);
      return;
    }
    var howItWorks = document.getElementById('cl-how-it-works');
    if (howItWorks && howItWorks.parentNode) {
      howItWorks.parentNode.insertBefore(section, howItWorks.nextSibling);
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
