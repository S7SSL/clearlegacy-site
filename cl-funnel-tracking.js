/*
 * ClearLegacy funnel tracking — cl-funnel-tracking.js  (v3 — Phase 3)
 * Fires every event the conversion audit requires plus the Phase 3 GA4 funnel:
 *   Legacy v2 events (kept for back-compat with existing GA4 audiences):
 *     - click_start_will, click_contact, email_captured,
 *       will_form_submit_attempt, will_form_submit_success, will_form_submit_error,
 *       checkout_redirect_success, payment_failed, form_abandon_recoverable, return_to_form
 *
 *   Phase 3 funnel events (the canonical names the audit/spec uses):
 *     - homepage_cta_click          (any CTA on the homepage)
 *     - pricing_page_visit          (page load of /pricing/)
 *     - begin_will                  (any click that lands the user on /forms/will.html)
 *     - form_step_1 … form_step_5   (per-step advance inside the will questionnaire)
 *     - payment_started             (just before Stripe redirect)
 *     - payment_completed           (thank-you page with a session_id)
 *     - form_abandoned              (beforeunload after begin, not completed)
 *     - email_capture_submit        (lead-magnet email capture forms)
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
  var IS_HOMEPAGE = SITE === '/' || SITE === '/index.html' || SITE === '';
  var IS_PRICING = /^\/pricing(\/|$)/i.test(SITE);
  var IS_FORM_PAGE = /\/forms\/will/i.test(SITE);
  var IS_THANK_YOU = /\/thank-you/i.test(SITE);

  function fire(name, params) {
    params = params || {};
    params.source_page = params.source_page || SOURCE_PAGE;
    try { if (typeof gtag === 'function') gtag('event', name, params); } catch (e) {}
    try { if (typeof fbq === 'function') fbq('trackCustom', name, params); } catch (e) {}
    try { if (window.uetq) window.uetq.push('event', name, params); } catch (e) {}
  }
  // Expose for other inline scripts (tools, email capture) so they can re-use
  // the multi-platform fan-out (GA4 + Meta + UET) with one call.
  window.clFire = fire;

  // ---------- pricing_page_visit ----------
  if (IS_PRICING) {
    fire('pricing_page_visit', { page_path: SITE });
  }

  // ---------- 1. click_start_will (every commercial-page CTA) + begin_will ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a, button');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var dataCta = a.getAttribute('data-cta') || '';
    var label = (a.textContent || '').trim();
    var hrefMatch = /\/forms\/will\.html/i.test(href);
    var labelMatch = /^(start (my |your )?will|get started|start now|my will|begin now)/i.test(label);
    var ctaMatch = dataCta && /will|start/i.test(dataCta);

    // homepage_cta_click — any button/link clicked from the homepage that
    // looks like a CTA (will form, pricing, get started, hero CTA, sticky CTA).
    if (IS_HOMEPAGE) {
      var isCtaShaped = hrefMatch || labelMatch || ctaMatch
        || /\/pricing(\/|$)/i.test(href)
        || a.classList.contains('btn-primary')
        || a.classList.contains('btn')
        || a.classList.contains('nav-cta')
        || a.classList.contains('cta');
      if (isCtaShaped) {
        var rect0 = a.getBoundingClientRect();
        fire('homepage_cta_click', {
          cta_text: label.slice(0, 80),
          cta_data_attr: dataCta || null,
          destination: href || null,
          cta_position: rect0.top < window.innerHeight * 0.6 ? 'above_fold' : 'below_fold'
        });
      }
    }

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
    // begin_will — only when this click is going to /forms/will (the start of
    // the will creation flow). Avoid firing for plain "Get Started" buttons
    // that scroll to a section.
    if (hrefMatch) {
      fire('begin_will', {
        cta_text: label.slice(0, 80),
        cta_position: position,
        source_page: SOURCE_PAGE,
        destination: href || null
      });
    }
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
  if (IS_FORM_PAGE) {
    var emailFired = false;
    var emailCaptured = false;
    var submitAttempted = false;
    var submitCompleted = false;
    var formStartedFired = false;
    var lastStepReached = 1;

    // return_to_form — check sessionStorage marker from any prior /forms/will visit
    try {
      var prior = sessionStorage.getItem(SESS_PRIOR);
      if (prior) {
        var daysSince = Math.round((Date.now() - Number(prior)) / 86400000);
        fire('return_to_form', { days_since_first_visit: daysSince });
      }
      sessionStorage.setItem(SESS_PRIOR, String(Date.now()));
    } catch (e) {}

    // form_step_1 fires as soon as the form is visibly engaged (focus on any
    // field) — this is the "they actually started" signal the spec wants.
    function fireFormStart() {
      if (formStartedFired) return;
      formStartedFired = true;
      fire('form_step_1', { step_number: 1, form_name: 'will_questionnaire' });
    }
    document.addEventListener('focusin', function (e) {
      if (e.target && e.target.closest && e.target.closest('.step, form, .form-wrap')) {
        fireFormStart();
      }
    }, true);

    // Listen for the per-step completion event the form already fires
    // (form_step_complete) and re-emit as form_step_N for the Phase 3 funnel.
    // The form fires after advancing — so completing step 1 means user reached
    // step 2 (and beyond). We also capture lastStepReached for abandonment.
    (function hookStepEvents(){
      var origGtag = window.gtag;
      window.gtag = function(){
        try {
          var args = arguments;
          if (args && args[0] === 'event' && args[1] === 'form_step_complete') {
            var params = args[2] || {};
            var n = Number(params.step_number) || 0;
            if (n >= 1 && n <= 6) {
              lastStepReached = Math.max(lastStepReached, n + 1);
              // form_step_1 already fires on first focus; for n>=1 the user
              // has advanced FROM step n TO step n+1. Fire the corresponding
              // Phase 3 milestone event.
              if (n + 1 >= 2 && n + 1 <= 5) {
                fire('form_step_' + (n + 1), {
                  step_number: n + 1,
                  form_name: 'will_questionnaire'
                });
              }
            }
          }
        } catch(_) {}
        if (typeof origGtag === 'function') return origGtag.apply(this, arguments);
      };
    })();

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

    // Hook redirectToStripe to fire checkout_redirect_success + payment_started
    var redirectHookIv = setInterval(function () {
      if (typeof window.redirectToStripe === 'function' && !window.redirectToStripe.__clHooked) {
        var orig = window.redirectToStripe;
        window.redirectToStripe = function (url) {
          var product = (new URLSearchParams(location.search)).get('product') || 'single';
          fire('checkout_redirect_success', {
            checkout_provider: 'stripe',
            destination: String(url || '').slice(0, 200) || null,
            will_type: product
          });
          fire('payment_started', {
            checkout_provider: 'stripe',
            will_type: product,
            value: product === 'mirror' ? 99 : 69,
            currency: 'GBP'
          });
          return orig.apply(this, arguments);
        };
        window.redirectToStripe.__clHooked = true;
        clearInterval(redirectHookIv);
      }
    }, 300);
    setTimeout(function () { clearInterval(redirectHookIv); }, 10000);

    // form_abandon_recoverable + form_abandoned — beforeunload if started/captured
    // but no submit completed
    var abandonFired = false;
    window.addEventListener('beforeunload', function () {
      if (abandonFired) return;
      if (submitCompleted) return;
      if (!formStartedFired && !emailCaptured) return;
      abandonFired = true;
      var lastStep = lastStepReached;
      var active = document.querySelector('.step.active, [data-step].active');
      if (active) {
        var m = (active.id || '').match(/step-(\d+)/);
        if (m) lastStep = Number(m[1]);
        else {
          var ds = active.getAttribute('data-step');
          if (ds) lastStep = Number(ds);
        }
      }
      var product = (new URLSearchParams(location.search)).get('product') || 'single';
      if (emailCaptured) {
        fire('form_abandon_recoverable', { last_step: lastStep, will_type: product });
      }
      fire('form_abandoned', {
        last_step: lastStep,
        email_captured: !!emailCaptured,
        will_type: product
      });
    });
  }

  // ---------- thank-you page: payment_completed + payment_failed diagnostic ----------
  if (IS_THANK_YOU) {
    var qs = new URLSearchParams(location.search);
    var sessionId = qs.get('session_id');
    var product = qs.get('product') || 'single';
    if (sessionId) {
      var dedupeKey = 'cl_payment_completed_fired_' + sessionId;
      var already = false;
      try { already = !!sessionStorage.getItem(dedupeKey); } catch (e) {}
      if (!already) {
        try { sessionStorage.setItem(dedupeKey, '1'); } catch (e) {}
        fire('payment_completed', {
          transaction_id: sessionId,
          will_type: product,
          value: product === 'mirror' ? 99 : 69,
          currency: 'GBP'
        });
      }
    } else {
      setTimeout(function () {
        fire('payment_failed', {
          failure_reason: 'no_session_id_in_url',
          product: product
        });
      }, 60000);
    }
  }
})();
