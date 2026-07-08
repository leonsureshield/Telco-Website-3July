/* =====================================================================
   SureShield — Cookie Disclaimer Banner (the visible popup)
   ---------------------------------------------------------------------
   Requires assets/consent.js to be loaded first (it provides window.CookieConsent).

   Behaviour:
     - Shows once, only if the visitor has not yet accepted or declined.
     - "Accept"  -> CookieConsent.accept()   (unlocks queued cookies/analytics)
     - "Decline" -> CookieConsent.decline()  (nothing non-essential is stored)
     - Re-open later from anywhere with:  window.showCookieBanner()
       (handy for a "Cookie settings" link in the footer)

   Styling uses the site's own CSS variables, so it matches light & dark.
   ===================================================================== */
(function () {
  if (!window.CookieConsent) return; // consent.js must load first

  var STYLE_ID = 'ss-cookie-banner-style';
  var BANNER_ID = 'ss-cookie-banner';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '#' + BANNER_ID + '{position:fixed;left:1.25rem;bottom:1.25rem;z-index:2147483000;' +
        'width:min(400px,calc(100vw - 2.5rem));background:var(--ink,#f1ece0);color:var(--text,#0a0a0a);' +
        'border:1px solid color-mix(in srgb,var(--text,#0a0a0a) 16%,transparent);' +
        'border-top:3px solid var(--signal,#ff2d2e);' +
        'box-shadow:0 20px 60px -12px rgba(0,0,0,.45);padding:1.4rem 1.4rem 1.25rem;' +
        'font-family:var(--sans,system-ui,sans-serif);' +
        'transform:translateY(140%);opacity:0;transition:transform .45s cubic-bezier(.22,1,.36,1),opacity .45s ease;}' +
      '#' + BANNER_ID + '.is-visible{transform:translateY(0);opacity:1;}' +
      '#' + BANNER_ID + ' .ccb-eyebrow{font-family:var(--mono,ui-monospace,monospace);font-size:.7rem;font-weight:700;' +
        'letter-spacing:.16em;text-transform:uppercase;color:var(--signal,#ff2d2e);' +
        'display:flex;align-items:center;gap:.55rem;margin-bottom:.6rem;}' +
      '#' + BANNER_ID + ' .ccb-eyebrow::before{content:"";width:24px;height:2px;background:var(--signal,#ff2d2e);display:inline-block;}' +
      '#' + BANNER_ID + ' .ccb-body{font-size:.9rem;line-height:1.5;' +
        'color:color-mix(in srgb,var(--text,#0a0a0a) 78%,transparent);margin:0 0 1.1rem;}' +
      '#' + BANNER_ID + ' .ccb-body a{color:var(--signal,#ff2d2e);text-decoration:underline;text-underline-offset:2px;}' +
      '#' + BANNER_ID + ' .ccb-actions{display:flex;gap:.6rem;flex-wrap:wrap;}' +
      '#' + BANNER_ID + ' button{font-family:var(--mono,ui-monospace,monospace);font-size:.8rem;font-weight:700;' +
        'letter-spacing:.06em;text-transform:uppercase;padding:.7rem 1.3rem;cursor:pointer;transition:all .18s;border:none;}' +
      '#' + BANNER_ID + ' .ccb-accept{background:var(--signal,#ff2d2e);color:var(--on-accent,#fff);flex:1 1 auto;}' +
      '#' + BANNER_ID + ' .ccb-accept:hover{filter:brightness(1.08);}' +
      '#' + BANNER_ID + ' .ccb-decline{background:transparent;color:var(--text,#0a0a0a);' +
        'border:2px solid color-mix(in srgb,var(--text,#0a0a0a) 45%,transparent);}' +
      '#' + BANNER_ID + ' .ccb-decline:hover{border-color:var(--text,#0a0a0a);}' +
      '@media (prefers-reduced-motion: reduce){#' + BANNER_ID + '{transition:opacity .2s ease;transform:none;}}';
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function build() {
    var el = document.getElementById(BANNER_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = BANNER_ID;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie notice');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '<div class="ccb-eyebrow">Cookies</div>' +
      '<p class="ccb-body">We use cookies only to understand how this report is used and to improve it. ' +
        'Nothing is stored until you accept. See our ' +
        '<a href="privacy-and-disclaimers.html">Privacy &amp; Disclaimers</a>.</p>' +
      '<div class="ccb-actions">' +
        '<button type="button" class="ccb-accept">Accept</button>' +
        '<button type="button" class="ccb-decline">Decline</button>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('.ccb-accept').addEventListener('click', function () {
      window.CookieConsent.accept();
      hide(el);
    });
    el.querySelector('.ccb-decline').addEventListener('click', function () {
      window.CookieConsent.decline();
      hide(el);
    });
    return el;
  }

  function show() {
    injectStyle();
    var el = build();
    // next frame so the entrance transition runs
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('is-visible'); });
    });
  }

  function hide(el) {
    el = el || document.getElementById(BANNER_ID);
    if (!el) return;
    el.classList.remove('is-visible');
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 480);
  }

  // Manual re-open (e.g. a footer "Cookie settings" link): window.showCookieBanner()
  window.showCookieBanner = show;

  function init() {
    // Only auto-show if the visitor hasn't chosen yet.
    if (!window.CookieConsent.decided) show();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
