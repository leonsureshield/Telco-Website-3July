/* =====================================================================
   SureShield — Form Autofill (instant auto-population)
   ---------------------------------------------------------------------
   - As the visitor types in any lead form, their common details are
     mirrored LIVE into every other form's matching field, and (once
     cookies are accepted) saved to localStorage so the forms come back
     pre-filled on their next visit.
   - Consent-aware: because the site's cookie banner promises "nothing is
     stored until you accept," values are only PERSISTED to localStorage
     after CookieConsent.granted. Live in-session mirroring still works
     regardless, and any saved values are wiped if the visitor declines
     or revokes consent.
   - Never touches passwords, verification codes, or consent checkboxes.
   ===================================================================== */
(function () {
  var KEY = 'ssFormAutofillV1';

  // Field NAMES that are safe to remember and share across forms.
  var FIELDS = [
    'first_name', 'last_name', 'name', 'designation',
    'company', 'organization', 'work_email', 'mobile',
    'domain', 'segment'
  ];

  function consentGranted() {
    // If the consent layer isn't present for some reason, fail closed (don't persist).
    return !!(window.CookieConsent && window.CookieConsent.granted);
  }
  function isTracked(input) {
    return input && input.name && FIELDS.indexOf(input.name) !== -1 &&
           input.type !== 'checkbox' && input.type !== 'radio' &&
           input.type !== 'password' && input.type !== 'hidden';
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }
  function persist(data) {
    if (!consentGranted()) return;             // gated by cookie consent
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  function clearStore() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  // In-session snapshot so live mirroring works even before consent.
  var session = load();

  function remember(input) {
    if (!isTracked(input)) return;
    if (input.value) session[input.name] = input.value;
    else delete session[input.name];
    persist(session); // no-op until consent granted
    mirror(input.name, input.value, input);
  }

  // Copy a value into every OTHER form field of the same name that is empty.
  function mirror(name, value, source) {
    if (!value) return;
    document.querySelectorAll('.modal-form [name="' + name + '"]').forEach(function (el) {
      if (el === source) return;
      if (!isTracked(el)) return;
      if (el.value) return;                    // never clobber what the user already typed
      setValue(el, value);
    });
  }

  function setValue(el, value) {
    if (el.tagName === 'SELECT') {
      // only apply if the option actually exists
      var ok = Array.prototype.some.call(el.options, function (o) { return o.value === value || o.text === value; });
      if (!ok) return;
    }
    el.value = value;
  }

  // Fill empty fields in a scope from the current snapshot.
  function populate(scope) {
    var data = session;
    (scope || document).querySelectorAll('.modal-form [name]').forEach(function (el) {
      if (!isTracked(el)) return;
      if (el.value) return;
      var v = data[el.name];
      if (v != null && v !== '') setValue(el, v);
    });
  }

  // --- listeners ---
  document.addEventListener('input', function (e) {
    if (e.target && e.target.closest && e.target.closest('.modal-form')) remember(e.target);
  });
  document.addEventListener('change', function (e) {
    if (e.target && e.target.closest && e.target.closest('.modal-form')) remember(e.target);
  });

  // Re-fill whenever a modal opens (openModal() calls form.reset() first).
  function wrapOpenModal() {
    if (typeof window.openModal !== 'function' || window.openModal.__autofillWrapped) return false;
    var orig = window.openModal;
    window.openModal = function (id) {
      var r = orig.apply(this, arguments);
      var m = document.getElementById(id);
      if (m) populate(m);
      return r;
    };
    window.openModal.__autofillWrapped = true;
    return true;
  }

  // If the visitor declines/revokes, drop anything saved.
  document.addEventListener('cookieconsent:declined', clearStore);
  document.addEventListener('cookieconsent:changed', function () {
    if (window.CookieConsent && !window.CookieConsent.granted) clearStore();
    else persist(session); // just accepted → save what we have
  });

  function init() {
    populate(document);        // pre-fill all forms from storage on load
    if (!wrapOpenModal()) {    // openModal may be defined slightly later
      var tries = 0, t = setInterval(function () {
        if (wrapOpenModal() || ++tries > 40) clearInterval(t);
      }, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
