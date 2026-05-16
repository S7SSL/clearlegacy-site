/*
 * ClearLegacy funnel tracking — cl-funnel-tracking.js
 * Fires the missing events from the conversion audit:
 *   - click_start_will       (any "Start My Will" CTA across the site)
 *   - email_captured         (form step 1 email field, debounced)
 *   - will_form_submit_attempt / will_form_submit_success
 *   - payment_failed         (on /thank-you.html, if no session_id within 60s)
 *
 * Drop-in: <script src="/cl-funnel-tracking.js" async></script>
 * Safe to load multiple times — guards against double-firing.
 */
(function () {
  'use strict';
  if (window.__clFunnelTrackingLoaded) return;
  window.__clFunnelTrackingLoaded = true;

  var SITE = window.location.pathname;
  var SOURCE_PAGE = SITE.replace(/^\/+/, '') || 'home';

  function fire(name, params) {
    params = params || {};
    params.source_page = params.source_page || SOURCE_PAGE;
    try { if (typeof gtag === 'function') gtag('event', name, params); } catch (e) {}
    try { if (typeof fbq === 'function') fbq('trackCustom', name, params); } catch (e) {}
    try { if (window.uetq) window.uetq.push('event', name, params); } catch (e) {}
  }

  // ---------- 1. click_start_will (all commercial pages + nav) ----------
  // Delegated listener — catches every Start CTA, including ones injected later.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a, button');
    if (!a) return;

    var href = a.getAttribute('href') || '';
    var dataCta = a.getAttribute('data-cta') || '';
    var label = (a.textContent || '').trim();

    // Match: links pointing to /forms/will.html, or any CTA labelled "Start"/"My Will"
    var hrefMatch = /\/forms\/will\.html/i.test(href);
    var labelMatch = /^(start (my |your )?will|get started|start now|my will|begin now)/i.test(label);
    var ctaMatch = dataCta && /will|start/i.test(dataCta);

    if (!(hrefMatch || labelMatch || ctaMatch)) return;

    var rect = a.getBoundingClientRect();
    var position = rect.top < window.innerHeight * 0.4 ? 'above_fold'
                 : rect.top < window.innerHeight * 1.5 ? 'mid' : 'below_fold';

    fire('click_start_will', {
      cta_text: label.slice(0, 80),
      cta_position: position,
      cta_data_attr: dataCta || null,
      destination: href || null
    });
  }, true);

  // ---------- 2. email_captured (form step 1) ----------
  if (/\/forms\/will/i.test(SITE)) {
    var emailFired = false;
    function attachEmail() {
      var em = document.getElementById('f-email');
      if (!em) return false;
      em.addEventListener('blur', function () {
        if (emailFired) return;
        var v = (em.value || '').trim();
        if (v.length >= 5 && v.indexOf('@') > 0) {
          emailFired = true;
          fire('email_captured', { step_number: 1 });
        }
      });
      return true;
    }
    if (!attachEmail()) {
      // Form may render after DOM ready — retry briefly
      var tries = 0;
      var iv = setInterval(function () {
        if (attachEmail() || ++tries > 20) clearInterval(iv);
      }, 250);
    }

    // ---------- 3. will_form_submit_attempt + submit_success ----------
    var attemptFired = false;
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('#btn-submit, .btn-submit, button[onclick*="submitForm"]');
      if (!b) return;
      if (attemptFired) return;
      attemptFired = true;
      fire('will_form_submit_attempt', {
        will_type: (new URLSearchParams(location.search)).get('product') || 'single',
        button_text: (b.textContent || '').trim().slice(0, 60)
      });
    }, true);

    // Patch submitForm so we get the success-side event without editing forms/will.html
    var hookInterval = setInterval(function () {
      if (typeof window.submitForm === 'function' && !window.submitForm.__clHooked) {
        var original = window.submitForm;
        window.submitForm = function () {
          var result = original.apply(this, arguments);
          // submitForm is sync but kicks off async work; success is when it returns without throwing
          fire('will_form_submit_success', {
            will_type: (new URLSearchParams(location.search)).get('product') || 'single'
          });
          return result;
        };
        window.submitForm.__clHooked = true;
        clearInterval(hookInterval);
      }
    }, 300);
    setTimeout(function () { clearInterval(hookInterval); }, 10000);
  }

  // ---------- 4. payment_failed (thank-you page diagnostic) ----------
  if (/\/thank-you/i.test(SITE)) {
    var sessionId = (new URLSearchParams(location.search)).get('session_id');
    var product = (new URLSearchParams(location.search)).get('product') || 'single';
    if (!sessionId) {
      // User reached thank-you without a Stripe session — likely cancelled or webhook lost
      setTimeout(function () {
        fire('payment_failed', {
          failure_reason: 'no_session_id_in_url',
          product: product
        });
      }, 60000);
    }
  }
})();
