/* =====================================================================
   SureShield — Cookie Consent Gate
   ---------------------------------------------------------------------
   Purpose: NOTHING that counts as a tracking/analytics cookie or storage
   item may be written until the visitor accepts the cookie disclaimer.

   This script sets up the plumbing now. The disclaimer popup will be
   added later — when it is, wire its buttons like this:

       Accept  button ->  CookieConsent.accept()
       Decline button ->  CookieConsent.decline()

   ...and only show the popup when CookieConsent.decided === false.

   HOW TO ADD A COOKIE / ANALYTICS LATER (so it stays gated):

     // A) a simple first-party cookie:
     CookieConsent.setCookie('pref_theme', 'dark', { days: 180 });
     //   -> if not yet accepted, this is QUEUED and only written on accept.

     // B) a third-party script (e.g. Google Analytics):
     CookieConsent.onAccept(function () {
       var s = document.createElement('script');
       s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXX';
       document.head.appendChild(s);
       // ...init gtag here...
     });
     //   -> the loader runs immediately if already accepted, otherwise
     //      the moment the visitor accepts.

   WHAT IS *NOT* GATED (allowed before consent, by design & by law):
     - This consent decision itself (localStorage 'ssCookieConsentV1').
     - The report-access token (sessionStorage 'ssTelcoReportAccessV1'),
       which is strictly necessary for the report gate to function.
   ===================================================================== */
(function () {
  var DECISION_KEY = 'ssCookieConsentV1';   // 'granted' | 'denied'

  function readDecision() {
    try { return localStorage.getItem(DECISION_KEY); } catch (e) { return null; }
  }
  function writeDecision(v) {
    try { localStorage.setItem(DECISION_KEY, v); } catch (e) {}
  }

  // Cookie writes requested before consent are held here, then flushed on accept.
  var pendingCookies = [];      // [{name, value, opts}]
  var pendingCallbacks = [];    // [fn]
  // Names of cookies we set through this helper, so revoke() can clean them up.
  var managedCookies = [];

  function buildCookie(name, value, opts) {
    opts = opts || {};
    var str = encodeURIComponent(name) + '=' + encodeURIComponent(value);
    if (opts.days) {
      var d = new Date();
      d.setTime(d.getTime() + opts.days * 864e5);
      str += '; expires=' + d.toUTCString();
    } else if (opts.maxAge != null) {
      str += '; max-age=' + opts.maxAge;
    }
    str += '; path=' + (opts.path || '/');
    if (opts.domain)   str += '; domain=' + opts.domain;
    if (opts.sameSite) str += '; samesite=' + opts.sameSite;
    if (opts.secure || location.protocol === 'https:') str += '; secure';
    return str;
  }

  function writeCookieNow(name, value, opts) {
    document.cookie = buildCookie(name, value, opts);
    if (managedCookies.indexOf(name) === -1) managedCookies.push(name);
  }

  function flush() {
    // write any cookies that were queued before consent
    while (pendingCookies.length) {
      var c = pendingCookies.shift();
      writeCookieNow(c.name, c.value, c.opts);
    }
    // run any deferred callbacks (analytics loaders, etc.)
    while (pendingCallbacks.length) {
      try { pendingCallbacks.shift()(); } catch (e) {}
    }
  }

  function fire(name) {
    try {
      document.dispatchEvent(new CustomEvent(name, {
        detail: { granted: api.granted }
      }));
    } catch (e) {}
  }

  var api = {
    /* --- state --- */
    get granted() { return readDecision() === 'granted'; },
    get denied()  { return readDecision() === 'denied'; },
    get decided() { var s = readDecision(); return s === 'granted' || s === 'denied'; },

    /* --- decisions (wire these to the popup buttons) --- */
    accept: function () {
      writeDecision('granted');
      flush();
      fire('cookieconsent:accepted');
      fire('cookieconsent:changed');
    },
    decline: function () {
      writeDecision('denied');
      // drop anything that was queued but never consented to
      pendingCookies.length = 0;
      pendingCallbacks.length = 0;
      fire('cookieconsent:declined');
      fire('cookieconsent:changed');
    },
    /* clear the decision AND delete cookies set through this helper */
    revoke: function () {
      try { localStorage.removeItem(DECISION_KEY); } catch (e) {}
      managedCookies.forEach(function (n) {
        document.cookie = encodeURIComponent(n) +
          '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      });
      managedCookies.length = 0;
      fire('cookieconsent:changed');
    },

    /* --- guarded helpers for future cookie/analytics code --- */
    // Sets a cookie only after consent; otherwise queues it until accept.
    setCookie: function (name, value, opts) {
      if (api.granted) writeCookieNow(name, value, opts);
      else pendingCookies.push({ name: name, value: value, opts: opts });
    },
    // Runs cb now if already accepted, otherwise the moment the user accepts.
    onAccept: function (cb) {
      if (typeof cb !== 'function') return;
      if (api.granted) { try { cb(); } catch (e) {} }
      else pendingCallbacks.push(cb);
    }
  };

  window.CookieConsent = api;
})();
