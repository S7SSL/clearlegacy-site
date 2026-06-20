/* ClearLegacy — Phase 3 commercial CTA injector.
 * Drop-in: add  <script src="/cl-cta.js" defer></script>  before </body> on guide
 * and researcher pages. Injects a mid-article CTA, an end-of-article CTA, and a
 * sticky mobile CTA bar — all pointing at the will form. Self-contained, safe,
 * idempotent. Does nothing on the form itself or pages that already have CTAs.
 *
 * Tweak the form URL / copy in CL_CTA_CFG below if needed.
 */
(function () {
  "use strict";
  var CFG = {
    formUrl: "/forms/will.html",
    midHeadline: "Need to make your wishes legally clear?",
    midText: "Start your ClearLegacy will online today — fixed £69, legally valid in England & Wales.",
    midBtn: "Start my will →",
    endHeadline: "Ready to protect your family?",
    endText: "Create your will online in minutes. Single Will £69 · Mirror Wills £99 · delivered in 24 hours.",
    endBtn: "Make my will →",
    stickyText: "Make your will online — £69",
    stickyBtn: "Start my will",
    midAfterParas: 4 /* insert mid CTA after the Nth top-level paragraph */
  };

  // ---- guards -------------------------------------------------------------
  var path = location.pathname.toLowerCase();
  // Skip the form, buyer pages (already CTA-heavy), checkout/thank-you.
  if (/\/forms\/|will-quick|thank-you|\/wills($|\.|\/)|first-will-online|simple-will-online|mirror-wills-for-couples|wills-for-/.test(path)) return;
  if (document.getElementById("cl-cta-end")) return; // already injected

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function track(label) {
    try { if (typeof window.gtag === "function") window.gtag("event", "cta_click", { cta: label, page: path }); } catch (e) {}
  }

  // ---- styles -------------------------------------------------------------
  var css =
    ".cl-cta{margin:28px 0;padding:24px 26px;border:1px solid #dbeafe;background:linear-gradient(180deg,#eff6ff,#fff);border-radius:14px;font-family:'Inter',system-ui,sans-serif}" +
    ".cl-cta h3{font-size:20px;font-weight:800;color:#0a0a0a;margin:0 0 8px;line-height:1.3}" +
    ".cl-cta p{font-size:15.5px;color:#374151;margin:0 0 16px;line-height:1.55}" +
    ".cl-cta a.b{display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:16px;padding:13px 26px;border-radius:10px;text-decoration:none;box-shadow:0 6px 18px rgba(37,99,235,.22)}" +
    ".cl-cta a.b:hover{background:#1d4ed8}" +
    ".cl-cta-mid{background:#f9fafb;border-color:#e5e7eb;background-image:none}" +
    "#cl-sticky{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#fff;border-top:1px solid #e5e7eb;box-shadow:0 -4px 16px rgba(0,0,0,.08);display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;font-family:'Inter',system-ui,sans-serif}" +
    "#cl-sticky p{margin:0;font-weight:700;font-size:14.5px;color:#0a0a0a}" +
    "#cl-sticky a{background:#2563eb;color:#fff;font-weight:700;font-size:15px;padding:11px 20px;border-radius:9px;text-decoration:none;white-space:nowrap}" +
    "#cl-sticky .x{background:none;color:#9ca3af;border:none;font-size:20px;line-height:1;cursor:pointer;padding:0 4px}" +
    "@media(min-width:760px){#cl-sticky{display:none}}" + /* sticky = mobile only */
    "@media(max-width:759px){body{padding-bottom:64px}}";
  document.head.appendChild(el("style", null, css));

  // ---- find the article container ----------------------------------------
  var container =
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector(".guide-content, .content, .article, .post, .prose") ||
    document.body;

  // ---- mid-article CTA: after the Nth top-level <p> -----------------------
  try {
    var paras = container.querySelectorAll(":scope > p, :scope > section > p, p");
    if (paras && paras.length > CFG.midAfterParas + 1) {
      var anchor = paras[CFG.midAfterParas];
      var mid = el("div", { "class": "cl-cta cl-cta-mid", "id": "cl-cta-mid" },
        "<h3>" + CFG.midHeadline + "</h3><p>" + CFG.midText + "</p>" +
        '<a class="b" href="' + CFG.formUrl + '">' + CFG.midBtn + "</a>");
      anchor.parentNode.insertBefore(mid, anchor.nextSibling);
      mid.querySelector("a").addEventListener("click", function () { track("guide_mid"); });
    }
  } catch (e) {}

  // ---- end-of-article CTA -------------------------------------------------
  var end = el("div", { "class": "cl-cta", "id": "cl-cta-end" },
    "<h3>" + CFG.endHeadline + "</h3><p>" + CFG.endText + "</p>" +
    '<a class="b" href="' + CFG.formUrl + '">' + CFG.endBtn + "</a>");
  container.appendChild(end);
  end.querySelector("a").addEventListener("click", function () { track("guide_end"); });

  // ---- sticky mobile CTA --------------------------------------------------
  var sticky = el("div", { "id": "cl-sticky" },
    "<p>" + CFG.stickyText + "</p>" +
    '<a href="' + CFG.formUrl + '">' + CFG.stickyBtn + "</a>" +
    '<button class="x" aria-label="Dismiss">&times;</button>');
  document.body.appendChild(sticky);
  sticky.querySelector("a").addEventListener("click", function () { track("guide_sticky"); });
  sticky.querySelector(".x").addEventListener("click", function () { sticky.remove(); });
})();
