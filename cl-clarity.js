/*
 * Microsoft Clarity heatmaps + session recordings — cl-clarity.js
 * Free tier covers unlimited sessions and is privacy-safe by default.
 *
 * SAT — TO ACTIVATE:
 *   1. Go to https://clarity.microsoft.com (sign in with the byerim Microsoft
 *      account or create one — free).
 *   2. Add a new project, hostname = clearlegacy.co.uk.
 *   3. Copy the project ID (looks like 'a1b2c3d4e5').
 *   4. Replace PASTE_CLARITY_ID_HERE below with that ID.
 *   5. Commit + push. Within 30 seconds Clarity starts recording.
 *
 * Stays silent (does nothing) until you swap the placeholder.
 */
(function () {
  'use strict';
  if (window.__clClarityLoaded) return;
  window.__clClarityLoaded = true;

  var CLARITY_ID = 'PASTE_CLARITY_ID_HERE';
  if (CLARITY_ID === 'PASTE_CLARITY_ID_HERE') return; // not yet configured — exit silently

  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", CLARITY_ID);
})();
