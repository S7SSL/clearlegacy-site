/* cl-trust.js — injects a compact, verifiable "trust & verify" bar on buyer/commercial pages.
   Only uses facts that are independently checkable. No ratings, no invented numbers.
   Self-guarding: runs only on an allowlist of slugs, and never twice on the same page. */
(function () {
  "use strict";
  try {
    var path = location.pathname.replace(/\/+$/, "").toLowerCase();
    var slug = path.split("/").pop();

    // Only the buyer / comparison / commercial landing pages.
    var ALLOW = [
      "wills-for-homeowners", "wills-for-parents", "wills-for-unmarried-couples",
      "mirror-wills-for-couples", "first-will-online", "simple-will-online",
      "clearlegacy-vs-solicitor", "clearlegacy-vs-farewill",
      "clearlegacy-vs-co-op-legal-services", "who-should-not-use-clearlegacy",
      "jointly-owned-property-and-wills", "mortgage-and-will-planning"
    ];
    if (ALLOW.indexOf(slug) === -1) return;

    // Idempotency: never inject twice, and skip if the page already links to the legit page.
    if (document.getElementById("cl-trust-bar")) return;
    if (document.querySelector('a[href*="is-clearlegacy-legit"]')) return;

    var POUND = "£";
    var bar = document.createElement("section");
    bar.id = "cl-trust-bar";
    bar.setAttribute("aria-label", "Why you can trust ClearLegacy");
    bar.style.cssText =
      "max-width:980px;margin:28px auto;padding:0 5%;font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;";

    var inner =
      '<div style="border:1px solid #e5e7eb;border-radius:14px;background:#f9fafb;padding:22px 24px">' +
        '<div style="font-size:13px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#2563eb;margin-bottom:12px">Trusted &amp; verifiable</div>' +
        '<ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,1fr);gap:10px 24px;font-size:14.5px;color:#374151;line-height:1.5">' +
          '<li>&#10003; Legally valid in England &amp; Wales &mdash; written to the <strong>Wills Act 1837</strong></li>' +
          '<li>&#10003; Fixed price: <strong>' + POUND + '69</strong> single &middot; <strong>' + POUND + '99</strong> mirror &mdash; no hidden fees</li>' +
          '<li>&#10003; Your will delivered by PDF <strong>within 24 hours</strong></li>' +
          '<li>&#10003; Secure card payment via <strong>Stripe</strong>; you keep the signed original</li>' +
        '</ul>' +
        '<div style="margin-top:14px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:14px;color:#6b7280">' +
          'Check us for yourself: ' +
          '<a href="/is-clearlegacy-legit" style="color:#2563eb;font-weight:600;text-decoration:none">Is ClearLegacy legit?</a> &middot; ' +
          '<a href="/clearlegacy-reviews" style="color:#2563eb;font-weight:600;text-decoration:none">Customer reviews</a> &middot; ' +
          'Companies House no. <a href="https://find-and-update.company-information.service.gov.uk/company/12092327" rel="nofollow noopener" target="_blank" style="color:#2563eb;font-weight:600;text-decoration:none">12092327</a> (Kaizen Finance Ltd)' +
        '</div>' +
      '</div>';
    bar.innerHTML = inner;

    // Place it just before the site footer if present, else before the last CTA, else at end of main/body.
    var footer = document.querySelector("footer");
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(bar, footer);
    } else {
      var main = document.querySelector("main") || document.body;
      main.appendChild(bar);
    }

    // Light analytics: fire a GA4 event if gtag is present when a verify link is clicked.
    bar.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a");
      if (!a) return;
      if (typeof window.gtag === "function") {
        window.gtag("event", "trust_link_click", {
          link_url: a.getAttribute("href"),
          page_slug: slug
        });
      }
    });
  } catch (err) {
    /* fail silently — a trust bar must never break the page */
  }
})();
