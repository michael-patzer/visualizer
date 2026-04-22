(function () {
  'use strict';

  var DEFAULT_LANG = 'en';
  var LOCALES = [
    { code: 'en', path: '', label: 'EN', name: 'English', hreflang: 'en' },
    { code: 'es', path: 'es', label: 'ES', name: 'Espa\u00f1ol', hreflang: 'es' },
    { code: 'fr', path: 'fr', label: 'FR', name: 'Fran\u00e7ais', hreflang: 'fr' },
    { code: 'de', path: 'de', label: 'DE', name: 'Deutsch', hreflang: 'de' },
    { code: 'it', path: 'it', label: 'IT', name: 'Italiano', hreflang: 'it' },
    { code: 'nl', path: 'nl', label: 'NL', name: 'Nederlands', hreflang: 'nl' },
    { code: 'da', path: 'da', label: 'DA', name: 'Dansk', hreflang: 'da' },
    { code: 'sv', path: 'sv', label: 'SV', name: 'Svenska', hreflang: 'sv' },
    { code: 'nb', path: 'nb', label: 'NO', name: 'Norsk', hreflang: 'nb' },
    { code: 'pt-BR', path: 'pt-BR', label: 'PT', name: 'Portugu\u00eas (BR)', hreflang: 'pt-BR' },
    { code: 'ja', path: 'ja', label: 'JA', name: '\u65e5\u672c\u8a9e', hreflang: 'ja' },
    { code: 'zh-CN', path: 'zh-CN', label: 'ZH', name: '\u7b80\u4f53\u4e2d\u6587', hreflang: 'zh-Hans' },
    { code: 'zh-TW', path: 'zh-TW', label: 'ZH', name: '\u7e41\u9ad4\u4e2d\u6587', hreflang: 'zh-Hant' },
    { code: 'ru', path: 'ru', label: 'RU', name: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', hreflang: 'ru' },
    { code: 'tr', path: 'tr', label: 'TR', name: 'T\u00fcrk\u00e7e', hreflang: 'tr' },
    { code: 'cs', path: 'cs', label: 'CS', name: '\u010ce\u0161tina', hreflang: 'cs' },
    { code: 'sk', path: 'sk', label: 'SK', name: 'Sloven\u010dina', hreflang: 'sk' },
    { code: 'ro', path: 'ro', label: 'RO', name: 'Rom\u00e2n\u0103', hreflang: 'ro' },
    { code: 'hr', path: 'hr', label: 'HR', name: 'Hrvatski', hreflang: 'hr' },
    { code: 'uk', path: 'uk', label: 'UK', name: '\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430', hreflang: 'uk' },
    { code: 'th', path: 'th', label: 'TH', name: '\u0e44\u0e17\u0e22', hreflang: 'th' }
  ];
  var LOCALE_BY_CODE = {};
  var LOCALE_BY_PATH = {};

  for (var i = 0; i < LOCALES.length; i++) {
    LOCALE_BY_CODE[LOCALES[i].code] = LOCALES[i];
    if (LOCALES[i].path) LOCALE_BY_PATH[LOCALES[i].path] = LOCALES[i];
  }

  function normalizeLangTag(tag) {
    if (!tag) return '';

    var lower = String(tag).toLowerCase();
    if (lower === 'zh-hans') return 'zh-CN';
    if (lower === 'zh-hant') return 'zh-TW';
    if (lower === 'pt-br') return 'pt-BR';

    for (var i = 0; i < LOCALES.length; i++) {
      var locale = LOCALES[i];
      if (locale.code.toLowerCase() === lower) return locale.code;
    }

    var base = lower.split('-')[0];
    for (var j = 0; j < LOCALES.length; j++) {
      var candidate = LOCALES[j];
      if (candidate.code.toLowerCase() === base || candidate.code.toLowerCase().split('-')[0] === base) {
        return candidate.code;
      }
    }

    return '';
  }

  function getLanguageFromPath(pathname) {
    var path = pathname || '/';
    var segments = path.replace(/^\/+|\/+$/g, '').split('/');
    var first = segments[0];
    if (first && LOCALE_BY_PATH[first]) return LOCALE_BY_PATH[first].code;
    return DEFAULT_LANG;
  }

  function getActiveLanguage() {
    var pathLang = getLanguageFromPath(window.location.pathname);
    if (LOCALE_BY_CODE[pathLang]) return pathLang;

    var htmlLang = normalizeLangTag(document.documentElement.lang);
    if (LOCALE_BY_CODE[htmlLang]) return htmlLang;

    return DEFAULT_LANG;
  }

  function buildLocaleHref(code) {
    var locale = LOCALE_BY_CODE[code] || LOCALE_BY_CODE[DEFAULT_LANG];
    return locale.path ? '/' + locale.path + '/' : '/';
  }

  function applyTranslations(lang) {
    var locale = LOCALE_BY_CODE[lang] || LOCALE_BY_CODE[DEFAULT_LANG];
    var t = window.translations[locale.code] || window.translations[DEFAULT_LANG];

    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (t[key] !== undefined) els[i].textContent = t[key];
    }

    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    for (var p = 0; p < placeholders.length; p++) {
      var pkey = placeholders[p].getAttribute('data-i18n-placeholder');
      if (t[pkey] !== undefined) placeholders[p].placeholder = t[pkey];
    }

    var values = document.querySelectorAll('[data-i18n-value]');
    for (var v = 0; v < values.length; v++) {
      var vkey = values[v].getAttribute('data-i18n-value');
      if (t[vkey] !== undefined) values[v].value = t[vkey];
    }

    var altEls = document.querySelectorAll('[data-i18n-alt]');
    for (var al = 0; al < altEls.length; al++) {
      var alkey = altEls[al].getAttribute('data-i18n-alt');
      if (t[alkey] !== undefined) altEls[al].setAttribute('alt', t[alkey]);
    }

    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    for (var a = 0; a < ariaEls.length; a++) {
      var akey = ariaEls[a].getAttribute('data-i18n-aria');
      if (t[akey] !== undefined) ariaEls[a].setAttribute('aria-label', t[akey]);
    }

    document.documentElement.lang = locale.code;

    var pickerBtns = document.querySelectorAll('.lang-picker-btn');
    for (var pb = 0; pb < pickerBtns.length; pb++) {
      var label = pickerBtns[pb].querySelector('.lang-label');
      if (label) label.textContent = locale.label;
    }

    var items = document.querySelectorAll('.lang-dropdown a');
    for (var d = 0; d < items.length; d++) {
      if (items[d].getAttribute('data-lang') === locale.code) {
        items[d].classList.add('active');
        items[d].setAttribute('aria-current', 'page');
      } else {
        items[d].classList.remove('active');
        items[d].removeAttribute('aria-current');
      }
    }
  }

  function setLanguage(lang) {
    var target = LOCALE_BY_CODE[lang] ? lang : DEFAULT_LANG;
    var destination = buildLocaleHref(target);
    var hash = window.location.hash || '';
    var nextUrl = hash ? destination + hash : destination;
    window.location.assign(nextUrl);
  }

  function createPicker(activeLang) {
    var activeLocale = LOCALE_BY_CODE[activeLang] || LOCALE_BY_CODE[DEFAULT_LANG];
    var wrapper = document.createElement('div');
    wrapper.className = 'lang-picker';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-picker-btn';
    btn.setAttribute('aria-label', 'Select language');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<i class="fas fa-globe"></i> <span class="lang-label">' +
      activeLocale.label +
      '</span> <i class="fas fa-chevron-down lang-arrow"></i>';

    var dropdown = document.createElement('div');
    dropdown.className = 'lang-dropdown';

    for (var i = 0; i < LOCALES.length; i++) {
      var locale = LOCALES[i];
      var link = document.createElement('a');
      link.href = buildLocaleHref(locale.code);
      link.hreflang = locale.hreflang;
      link.lang = locale.code;
      link.setAttribute('data-lang', locale.code);
      link.textContent = locale.name;
      if (locale.code === activeLocale.code) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      dropdown.appendChild(link);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    dropdown.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    document.addEventListener('click', function () {
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
    return wrapper;
  }

  function buildPicker(activeLang) {
    var appCta = document.querySelector('.app-cta');
    if (appCta) {
      appCta.parentNode.insertBefore(createPicker(activeLang), appCta);
    }

    var navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      var mobileItem = document.createElement('li');
      mobileItem.className = 'lang-picker-mobile';
      mobileItem.appendChild(createPicker(activeLang));
      navLinks.appendChild(mobileItem);
    }
  }

  window.i18n = {
    t: function (key) {
      var lang = getActiveLanguage();
      var t = window.translations[lang] || window.translations[DEFAULT_LANG];
      return t[key] || key;
    },
    setLanguage: setLanguage
  };

  document.addEventListener('DOMContentLoaded', function () {
    var lang = getActiveLanguage();
    buildPicker(lang);
    applyTranslations(lang);
  });
})();
