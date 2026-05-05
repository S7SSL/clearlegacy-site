/**
 * Clear Legacy — Purchase conversion tracking for /thank-you.
 *
 * Self-contained: loads gtag.js, configures GA4 + Google Ads, fires the
 * GA4 `purchase` event AND `ads_conversion_purchase` event AND the direct
 * Google Ads `conversion` event with the right value/currency/transaction_id
 * derived from the Stripe redirect URL parameters (?session_id=...&product=single|mirror).
 *
 * Drop-in install: add ONE line to /thank-you (right before </body>):
 *   <script src="/cl-thankyou-tracking.js" async></script>
 *
 * Once the Google Ads "Purchase — Will Order" conversion action exists,
 * paste the conversion label (the part after the slash, e.g. "abc123XYZ"
 * from "AW-17990502106/abc123XYZ") into AW_PURCHASE_LABEL below and re-deploy.
 *
 * Until that label is set, GA4 still receives the purchase event (which
 * flows into Google Ads via the existing GA4 link to property 528577470),
 * so Google can still attribute conversions — the direct AW conversion is
 * just belt-and-braces against GA4 sampling/import latency.
 */
(function () {
  // ===== CONFIG ============================================================
  var AW_ID = 'AW-17990502106';
  var AW_PURCHASE_LABEL = ''; // <-- paste the label here once created in Google Ads
  var GA4_ID = 'G-J3GPRFYR2Q';
  var SINGLE_VALUE = 69;
  var MIRROR_VALUE = 99;
  // ========================================================================

  // 1. Inject gtag.js once (idempotent — safe even if /thank-you ever later
  //    gets gtag added directly).
  if (!window.dataLayer) window.dataLayer = [];
  function gtag() { window.dataLayer.push(arguments); }
  if (typeof window.gtag !== 'function') window.gtag = gtag;

  function injectScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  // Only inject the loader if it's not already present (homepage shares this
  // tag; if a customer arrives via /thank-you with the loader cached we don't
  // want to double-load).
  var hasLoader = !!document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
  if (!hasLoader) {
    injectScript('https://www.googletagmanager.com/gtag/js?id=' + AW_ID);
  }

  gtag('js', new Date());
  gtag('config', AW_ID);
  gtag('config', GA4_ID);

  // 2. Derive product/value/transaction_id from the Stripe redirect URL.
  function getParams() {
    try {
      var p = new URLSearchParams(window.location.search);
      var product = (p.get('product') || '').toLowerCase();
      // Defensive default: treat missing product as 'single' so we still
      // record SOMETHING; mis-tagged conversions are better than zero data.
      if (product !== 'mirror' && product !== 'single') product = 'single';
      return {
        product: product,
        sessionId: p.get('session_id') || '',
        ref: p.get('ref') || '',
        value: product === 'mirror' ? MIRROR_VALUE : SINGLE_VALUE,
        itemName: product === 'mirror' ? 'Mirror Wills' : 'Single Will'
      };
    } catch (e) {
      return { product: 'single', sessionId: '', ref: '', value: SINGLE_VALUE, itemName: 'Single Will' };
    }
  }

  // 3. Fire the events. Wrap in try/catch so a tracking failure never
  //    breaks the actual /thank-you page rendering for the customer.
  function fireConversions() {
    var p = getParams();

    // GUARD: only fire if we have a valid order context. Either a Stripe
    // session_id (from redirect) or a ref (legitimate customer page-load).
    // Bare /thank-you visits with no params (e.g. test loads, bookmarks)
    // should NOT fire a conversion — that pollutes Google Ads with junk.
    if (!p.sessionId && !p.ref) {
      console.info('CL: no session_id or ref — not firing conversion (likely a test/error load).');
      return;
    }

    // De-dupe guard: if the page is reloaded with the same session_id,
    // don't double-count. We key off sessionStorage so it survives soft
    // navigations within the same tab session.
    var dedupeKey = p.sessionId || p.ref;
    if (dedupeKey) {
      try {
        var key = 'cl_purchase_fired_' + dedupeKey;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
      } catch (e) { /* sessionStorage blocked — fire anyway, better dup than miss */ }
    }

    // GA4 ecommerce purchase. Imports automatically into Google Ads via
    // the GA4 → Google Ads link.
    try {
      gtag('event', 'purchase', {
        transaction_id: p.sessionId || p.ref,
        value: p.value,
        currency: 'GBP',
        items: [{
          item_id: p.product,
          item_name: p.itemName,
          price: p.value,
          quantity: 1
        }]
      });
    } catch (e) { console.warn('CL: GA4 purchase event failed', e); }

    // Meta Pixel Purchase (mirrors GA4 purchase, uses dynamic value from URL params)
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Purchase', {
          value: p.value,
          currency: 'GBP',
          content_ids: [p.product],
          content_type: 'product',
          content_name: p.itemName
        }, { eventID: 'purchase_' + (p.sessionId || p.ref || Date.now()) });
      }
    } catch (e) { console.warn('CL: Meta Pixel Purchase event failed', e); }

    // Microsoft UET Purchase (mirrors GA4 purchase — for Bing conversion goals)
    try {
      if (window.uetq && typeof window.uetq.push === 'function') {
        window.uetq.push('event', 'purchase', {
          revenue_value: p.value,
          currency: 'GBP',
          transaction_id: p.sessionId || p.ref
        });
      }
    } catch (e) { console.warn('CL: UET Purchase event failed', e); }

    // === NEW: Fire ads_conversion_purchase event with proper value ===
    // This is the named event that the Google Ads conversion action
    // ('Clearlegacy (web) ads_conversion_purchase') is configured to import.
    // Using value from this event means £69 or £99 flows through dynamically
    // (rather than the fallback fixed value set in Google Ads).
    try {
      gtag('event', 'ads_conversion_purchase', {
        transaction_id: p.sessionId || p.ref,
        value: p.value,
        currency: 'GBP',
        product: p.product,
        item_name: p.itemName
      });
    } catch (e) { console.warn('CL: ads_conversion_purchase event failed', e); }

    // Direct Google Ads conversion (only fires once the label is set).
    if (AW_PURCHASE_LABEL) {
      try {
        gtag('event', 'conversion', {
          send_to: AW_ID + '/' + AW_PURCHASE_LABEL,
          value: p.value,
          currency: 'GBP',
          transaction_id: p.sessionId || p.ref
        });
      } catch (e) { console.warn('CL: AW conversion event failed', e); }
    } else {
      console.info('CL: AW_PURCHASE_LABEL not set — relying on GA4 import only.');
    }
  }

  // Fire after gtag has had a tick to initialise. Setting a tiny delay
  // ensures both `config` calls have flushed before `event`.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(fireConversions, 50); });
  } else {
    setTimeout(fireConversions, 50);
  }
})();
