(function () {
  'use strict';

  var STORAGE_KEY = 'visualizer-preferred-language';
  var DEFAULT_LANG = 'en';

  var SUPPORTED = [
    'en', 'es', 'fr', 'de', 'it', 'nl', 'da', 'sv', 'nb',
    'pt-BR', 'ja', 'zh-CN', 'zh-TW', 'ru', 'tr',
    'cs', 'sk', 'ro', 'hr', 'uk', 'th'
  ];

  function detectLanguage() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    var langs = navigator.languages || [navigator.language || navigator.userLanguage || DEFAULT_LANG];
    for (var i = 0; i < langs.length; i++) {
      var tag = langs[i];
      if (SUPPORTED.indexOf(tag) !== -1) return tag;
      var base = tag.split('-')[0];
      for (var j = 0; j < SUPPORTED.length; j++) {
        if (SUPPORTED[j] === base || SUPPORTED[j].split('-')[0] === base) return SUPPORTED[j];
      }
    }
    return DEFAULT_LANG;
  }

  function applyTranslations(lang) {
    var t = window.translations[lang] || window.translations[DEFAULT_LANG];

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

    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    for (var a = 0; a < ariaEls.length; a++) {
      var akey = ariaEls[a].getAttribute('data-i18n-aria');
      if (t[akey] !== undefined) ariaEls[a].setAttribute('aria-label', t[akey]);
    }

    document.documentElement.lang = lang;

    var pickerBtns = document.querySelectorAll('.lang-picker-btn');
    for (var pb = 0; pb < pickerBtns.length; pb++) {
      var label = pickerBtns[pb].querySelector('.lang-label');
      if (label) label.textContent = getLangLabel(lang);
    }

    var items = document.querySelectorAll('.lang-dropdown a');
    for (var d = 0; d < items.length; d++) {
      if (items[d].getAttribute('data-lang') === lang) {
        items[d].classList.add('active');
      } else {
        items[d].classList.remove('active');
      }
    }
  }

  function getLangLabel(code) {
    var labels = {
      'en': 'EN', 'es': 'ES', 'fr': 'FR', 'de': 'DE', 'it': 'IT',
      'nl': 'NL', 'da': 'DA', 'sv': 'SV', 'nb': 'NO',
      'pt-BR': 'PT', 'ja': 'JA', 'zh-CN': 'ZH', 'zh-TW': 'ZH', 'ru': 'RU', 'tr': 'TR',
      'cs': 'CS', 'sk': 'SK', 'ro': 'RO', 'hr': 'HR', 'uk': 'UK', 'th': 'TH'
    };
    return labels[code] || code.toUpperCase();
  }

  function setLanguage(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations(lang);
  }

  function buildPicker() {
    var langNames = {
      'en': 'English', 'es': 'Espa\u00f1ol', 'fr': 'Fran\u00e7ais',
      'de': 'Deutsch', 'it': 'Italiano', 'nl': 'Nederlands',
      'da': 'Dansk', 'sv': 'Svenska', 'nb': 'Norsk',
      'pt-BR': 'Portugu\u00eas (BR)', 'ja': '\u65e5\u672c\u8a9e',
      'zh-CN': '\u7b80\u4f53\u4e2d\u6587', 'zh-TW': '\u7e41\u9ad4\u4e2d\u6587',
      'ru': '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', 'tr': 'T\u00fcrk\u00e7e',
      'cs': '\u010ce\u0161tina', 'sk': 'Sloven\u010dina', 'ro': 'Rom\u00e2n\u0103',
      'hr': 'Hrvatski', 'uk': '\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430',
      'th': '\u0e44\u0e17\u0e22'
    };

    var wrapper = document.createElement('div');
    wrapper.className = 'lang-picker';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'lang-picker-btn';
    btn.className = 'lang-picker-btn';
    btn.setAttribute('aria-label', 'Select language');
    btn.innerHTML = '<i class="fas fa-globe"></i> <span class="lang-label">EN</span> <i class="fas fa-chevron-down lang-arrow"></i>';

    var dropdown = document.createElement('div');
    dropdown.className = 'lang-dropdown';

    for (var i = 0; i < SUPPORTED.length; i++) {
      var code = SUPPORTED[i];
      var link = document.createElement('a');
      link.href = '#';
      link.setAttribute('data-lang', code);
      link.textContent = langNames[code];
      link.addEventListener('click', (function (c) {
        return function (e) {
          e.preventDefault();
          setLanguage(c);
          dropdown.classList.remove('open');
        };
      })(code));
      dropdown.appendChild(link);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    document.addEventListener('click', function () {
      dropdown.classList.remove('open');
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);

    var appCta = document.querySelector('.app-cta');
    if (appCta) appCta.parentNode.insertBefore(wrapper, appCta);

    var navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      var mobileItem = document.createElement('li');
      mobileItem.className = 'lang-picker-mobile';
      var mobileWrapper = wrapper.cloneNode(true);
      var mBtn = mobileWrapper.querySelector('.lang-picker-btn');
      var mDropdown = mobileWrapper.querySelector('.lang-dropdown');
      mBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        mDropdown.classList.toggle('open');
      });
      var mLinks = mDropdown.querySelectorAll('a');
      for (var m = 0; m < mLinks.length; m++) {
        mLinks[m].addEventListener('click', (function (c) {
          return function (e) {
            e.preventDefault();
            setLanguage(c);
            mDropdown.classList.remove('open');
          };
        })(mLinks[m].getAttribute('data-lang')));
      }
      mobileItem.appendChild(mobileWrapper);
      navLinks.appendChild(mobileItem);
    }
  }

  window.i18n = {
    t: function (key) {
      var lang = localStorage.getItem(STORAGE_KEY) || detectLanguage();
      var t = window.translations[lang] || window.translations[DEFAULT_LANG];
      return t[key] || key;
    },
    setLanguage: setLanguage
  };

  document.addEventListener('DOMContentLoaded', function () {
    buildPicker();
    var lang = detectLanguage();
    setLanguage(lang);
  });
})();
