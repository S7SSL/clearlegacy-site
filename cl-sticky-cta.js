/* ClearLegacy — Sticky Bottom CTA Bar for guide pages */
(function(){
  // Don't show on form pages or thank-you page
  if(location.pathname.indexOf('/forms/')!==-1 || location.pathname.indexOf('thank-you')!==-1) return;

  var bar = document.createElement('div');
  bar.id = 'cl-sticky-cta';
  bar.innerHTML = '<div class="cl-sticky-inner">'
    + '<span class="cl-sticky-text">Wills from <strong>£69</strong> · Legally valid · Ready in 24 hours</span>'
    + '<a href="/forms/will.html" class="cl-sticky-btn">Start Your Will →</a>'
    + '</div>';
  document.body.appendChild(bar);

  var style = document.createElement('style');
  style.textContent = '#cl-sticky-cta{'
    + 'position:fixed;bottom:0;left:0;right:0;z-index:9990;'
    + 'background:#0f172a;border-top:1px solid #334155;'
    + 'padding:12px 5%;font-family:"Inter",sans-serif;'
    + 'transform:translateY(100%);transition:transform .35s ease;'
    + '}'
    + '#cl-sticky-cta.show{transform:translateY(0)}'
    + '.cl-sticky-inner{max-width:860px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px}'
    + '.cl-sticky-text{color:#e2e8f0;font-size:14px}'
    + '.cl-sticky-text strong{color:#fff}'
    + '.cl-sticky-btn{'
    + 'background:#2563eb;color:#fff;padding:10px 24px;border-radius:8px;'
    + 'font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;'
    + 'transition:background .2s;flex-shrink:0}'
    + '.cl-sticky-btn:hover{background:#1d4ed8}'
    + '@media(max-width:600px){.cl-sticky-text{font-size:12px}.cl-sticky-btn{padding:8px 16px;font-size:13px}}';
  document.head.appendChild(style);

  // Show after scrolling 300px
  var shown = false;
  function check(){
    if(window.scrollY > 300 && !shown){ bar.classList.add('show'); shown = true; }
  }
  window.addEventListener('scroll', check, {passive:true});
  // Also check on load in case already scrolled
  check();
})();
