/*
 * ClearLegacy funnel tracking — cl-funnel-tracking.js  (v2 — patch 0027)
 * Fires every event the conversion audit requires:
 *   - click_start_will          (any "Start My Will" CTA across the site)
 *   - click_contact             (mailto:, tel:, wa.me, /contact)
 *   - email_captured            (form step 1 email blur)
 *   - will_form_submit_attempt  (submit button clicked)
 *   - will_form_submit_success  (submitForm returned without throwing)
 *   - will_form_submit_error    (submitForm threw)
 *   - checkout_redirect_success (just before Stripe redirect)
 *   - payment_failed            (thank-you with no session_id within 60s)
 *   - form_abandon_recoverable  (beforeunload, email captured, submit not fired)
 *   - return_to_form            (user returns to /forms/will after a prior session)
 *
 * Drop-in: <script src="/cl-funnel-tracking.js" defer></script>
 * Safe to load multiple times — guards against double-firing.
 */
(function () {
  'use strict';
  if (window.__clFunnelTrackingLoaded) return;
  window.__clFunnelTrackingLoaded = true;

  var SITE = window.location.pathname;
  var SOURCE_PAGE = SITE.replace(/^\/+/, '') || 'home';
  var SESS_PRIOR = 'cl_form_visited_at';

  function fire(name, params) {
    params = params || {};
    params.source_page = params.source_page || SOURCE_PAGE;
    try { if (typeof gtag === 'function') gtag('event', name, params); } catch (e) {}
    try { if (typeof fbq === 'function') fbq('trackCustom', name, params); } catch (e) {}
    try { if (window.uetq) window.uetq.push('event', name, params); } catch (e) {}
  }

  // ---------- 1. click_start_will (every commercial-page CTA) ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a, button');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var dataCta = a.getAttribute('data-cta') || '';
    var label = (a.textContent || '').trim();
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

  // ---------- 2. click_contact (mailto, tel, wa.me, /contact) ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = (a.getAttribute('href') || '').trim();
    var contactType = null;
    if (/^mailto:/i.test(href)) contactType = 'email';
    else if (/^tel:/i.test(href)) contactType = 'phone';
    else if (/wa\.me|whatsapp\.com/i.test(href)) contactType = 'whatsapp';
    else if (/\/contact(\/|$|\.)/i.test(href)) contactType = 'contact_page';
    if (!contactType) return;
    fire('click_contact', {
      contact_type: contactType,
      destination: href.slice(0, 200),
      cta_text: (a.textContent || '').trim().slice(0, 80)
    });
  }, true);

  // ---------- Form-page-only instrumentation ----------
  var isFormPage = /\/forms\/will/i.test(SITE);
  if (isFormPage) {
    var emailFired = false;
    var emailCaptured = false;
    var submitAttempted = false;
    var submitCompleted = false;

    // return_to_form — check sessionStorage marker from any prior /forms/will visit
    try {
      var prior = sessionStorage.getItem(SESS_PRIOR);
      if (prior) {
        var daysSince = Math.round((Date.now() - Number(prior)) / 86400000);
        fire('return_to_form', { days_since_first_visit: daysSince });
      }
      sessionStorage.setItem(SESS_PRIOR, String(Date.now()));
    } catch (e) {}

    // email_captured — debounced on blur
    function attachEmail() {
      var em = document.getElementById('f-email');
      if (!em) return false;
      em.addEventListener('blur', function () {
        if (emailFired) return;
        var v = (em.value || '').trim();
        if (v.length >= 5 && v.indexOf('@') > 0) {
          emailFired = true;
          emailCaptured = true;
          fire('email_captured', { step_number: 1 });
        }
      });
      return true;
    }
    if (!attachEmail()) {
      var tries = 0;
      var iv = setInterval(function () {
        if (attachEmail() || ++tries > 20) clearInterval(iv);
      }, 250);
    }

    // will_form_submit_attempt — on submit click
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('#btn-submit, .btn-submit, button[onclick*="submitForm"]');
      if (!b) return;
      if (submitAttempted) return;
      submitAttempted = true;
      fire('will_form_submit_attempt', {
        will_type: (new URLSearchParams(location.search)).get('product') || 'single',
        button_text: (b.textContent || '').trim().slice(0, 60)
      });
    }, true);

    // Wrap submitForm to capture success AND error AND checkout_redirect_success
    var hookInterval = setInterval(function () {
      if (typeof window.submitForm === 'function' && !window.submitForm.__clHooked) {
        var original = window.submitForm;
        window.submitForm = function () {
          try {
            var result = original.apply(this, arguments);
            submitCompleted = true;
            fire('will_form_submit_success', {
              will_type: (new URLSearchParams(location.search)).get('product') || 'single'
            });
            return result;
          } catch (err) {
            fire('will_form_submit_error', {
              error_message: String((err && err.message) || err).slice(0, 200),
              will_type: (new URLSearchParams(location.search)).get('product') || 'single'
            });
            throw err;
          }
        };
        window.submitForm.__clHooked = true;
        clearInterval(hookInterval);
      }
    }, 300);
    setTimeout(function () { clearInterval(hookInterval); }, 10000);

    // Hook redirectToStripe to fire checkout_redirect_success
    var redirectHookIv = setInterval(function () {
      if (typeof window.redirectToStripe === 'function' && !window.redirectToStripe.__clHooked) {
        var orig = window.redirectToStripe;
        window.redirectToStripe = function (url) {
          fire('checkout_redirect_success', {
            checkout_provider: 'stripe',
            destination: String(url || '').slice(0, 200) || null,
            will_type: (new URLSearchParams(location.search)).get('product') || 'single'
          });
          return orig.apply(this, arguments);
        };
        window.redirectToStripe.__clHooked = true;
        clearInterval(redirectHookIv);
      }
    }, 300);
    setTimeout(function () { clearInterval(redirectHookIv); }, 10000);

    // form_abandon_recoverable — beforeunload if email captured but no submit completed
    var abandonFired = false;
    window.addEventListener('beforeunload', function () {
      if (abandonFired) return;
      if (!emailCaptured) return;
      if (submitCompleted) return;
      abandonFired = true;
      // Determine last step the user reached, best-effort
      var lastStep = 1;
      var active = document.querySelector('.step.active, [data-step].active');
      if (active) {
        var m = (active.id || '').match(/step-(\d+)/);
        if (m) lastStep = Number(m[1]);
        else {
          var ds = active.getAttribute('data-step');
          if (ds) lastStep = Number(ds);
        }
      }
      fire('form_abandon_recoverable', {
        last_step: lastStep,
        will_type: (new URLSearchParams(location.search)).get('product') || 'single'
      });
    });
  }

  // ---------- payment_failed (thank-you page diagnostic) ----------
  if (/\/thank-you/i.test(SITE)) {
    var sessionId = (new URLSearchParams(location.search)).get('session_id');
    var product = (new URLSearchParams(location.search)).get('product') || 'single';
    if (!sessionId) {
      setTimeout(function () {
        fire('payment_failed', {
          failure_reason: 'no_session_id_in_url',
          product: product
        });
      }, 60000);
    }
  }
})();
