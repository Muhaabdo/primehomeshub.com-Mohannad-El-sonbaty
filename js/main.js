// Navbar behaviour: hide on scroll down, reveal on scroll up, and auto-close the
// mobile menu (on scroll, on link click, or on tapping the backdrop outside it).
(function () {
  var navbar = document.querySelector('.navbar');
  if (!navbar) return;

  var navToggle = document.getElementById('nav-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
  var backdrop = document.querySelector('.nav-backdrop');
  var lastY = window.scrollY;
  var ticking = false;
  var hideThreshold = navbar.offsetHeight;

  function closeMobileMenu() {
    if (navToggle) navToggle.checked = false;
    if (backdrop) backdrop.classList.remove('is-open');
  }

  if (navToggle) {
    navToggle.addEventListener('change', function () {
      if (backdrop) backdrop.classList.toggle('is-open', navToggle.checked);
    });
  }

  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeMobileMenu);
  }

  function onScroll() {
    var currentY = window.scrollY;

    closeMobileMenu();

    if (currentY > lastY && currentY > hideThreshold) {
      navbar.classList.add('nav-hidden');
    } else {
      navbar.classList.remove('nav-hidden');
    }

    lastY = currentY;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
})();

// Gallery carousel: arrow + dot navigation over a translateX track.
// Track is forced to direction:ltr in CSS so slide order/index math stays
// simple regardless of the page's overall RTL layout.
(function () {
  var viewport = document.querySelector('.gallery-viewport');
  if (!viewport) return;

  var track = viewport.querySelector('.gallery-track');
  var slides = Array.prototype.slice.call(track.children);
  var dotsWrap = document.querySelector('.gallery-dots');
  var prevBtn = document.querySelector('.gallery-prev');
  var nextBtn = document.querySelector('.gallery-next');
  var index = 0;

  slides.forEach(function (_, i) {
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gallery-dot';
    dot.setAttribute('aria-label', 'الانتقال للصورة ' + (i + 1));
    dot.addEventListener('click', function () { goTo(i); });
    dotsWrap.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);

  function update() {
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    update();
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); });

  update();
})();

// Capture the Google Ads click id (gclid) from the URL as soon as the page
// loads, and remember it for the rest of this session. The visitor may click
// an in-page anchor (e.g. #offer) before submitting, but never navigates to
// a different URL first, so sessionStorage isn't strictly required here --
// it's just cheap insurance against losing attribution.
(function () {
  var gclid = new URLSearchParams(window.location.search).get('gclid');
  if (gclid) sessionStorage.setItem('phh_gclid', gclid);
})();

// Lead form: submits to a Google Apps Script Web App (google-apps-script/
// lead-sheet-webapp.gs) that appends the entry to a Google Sheet. Sent with
// mode:'no-cors' since Apps Script doesn't return CORS headers for a plain
// static site to read the response -- so "success" here means the request
// went out, not a confirmed row write. If the request itself fails (offline,
// endpoint unreachable), the visitor still gets a way to reach the team via
// WhatsApp instead of hitting a dead end.
(function () {
  var form = document.getElementById('lead-form');
  if (!form) return;

  var SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwWkmCrOEKTpUIvNofOPXNxowECGESmMFAEoArMIHUANfLsMEaLw4NHiBudYj6swAKq/exec';

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var unit = form.unit.value;

    var submitBtn = form.querySelector('.lead-submit');
    if (submitBtn) submitBtn.disabled = true;

    var data = new FormData();
    data.append('name', name);
    data.append('phone', phone);
    data.append('unit', unit);
    data.append('page', document.title);
    data.append('lang', document.documentElement.lang);
    data.append('gclid', sessionStorage.getItem('phh_gclid') || '');

    fetch(SHEET_ENDPOINT, { method: 'POST', mode: 'no-cors', body: data })
      .then(function () {
        window.location.href = 'thank-you.html';
      })
      .catch(function () {
        var message = 'مرحبًا، اسمي ' + name + ' ورقمي ' + phone +
          '، حابب أعرف تفاصيل أكتر عن مشروع Hacienda Ras Al Hekma';
        if (unit) message += ' - وحدة ' + unit;
        window.location.href = 'https://wa.me/201001413177?text=' + encodeURIComponent(message);
      });
  });
})();

// Cookie consent banner: built here and injected into every page (AR + EN,
// all 8 HTML files) rather than duplicated as markup in each file. Shown once
// per browser session (sessionStorage, not localStorage, so it comes back on
// the next visit/session) after a short delay -- not tied to scroll position.
// Auto-hides itself after AUTO_HIDE_MS if the visitor doesn't tap Agree/close
// first (per explicit request); note this only records that the banner was
// shown, not that the visitor actively agreed to anything.
(function () {
  var STORAGE_KEY = 'phh-cookie-consent';
  var SHOW_DELAY_MS = 900;
  var AUTO_HIDE_MS = 8000;
  if (sessionStorage.getItem(STORAGE_KEY)) return;

  var isAr = document.documentElement.lang === 'ar';
  var copy = isAr ? {
    text: '🍪 بنستخدم الكوكيز عشان نحسّن تجربتك على الموقع. ' +
      '<a href="privacy-policy.html" target="_blank" rel="noopener">سياسة الخصوصية</a>',
    agree: 'موافق',
    close: 'إغلاق'
  } : {
    text: '🍪 We use cookies to improve your experience on this site. ' +
      '<a href="privacy-policy.html" target="_blank" rel="noopener">Privacy Policy</a>',
    agree: 'Agree',
    close: 'Close'
  };

  var banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', isAr ? 'إشعار الكوكيز' : 'Cookie notice');
  banner.innerHTML =
    '<div class="container">' +
      '<p class="cookie-banner-text">' + copy.text + '</p>' +
      '<div class="cookie-banner-actions">' +
        '<button type="button" class="cookie-banner-agree">' + copy.agree + '</button>' +
        '<button type="button" class="cookie-banner-close" aria-label="' + copy.close + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(banner);

  var ctaBar = document.querySelector('.mobile-cta-bar');
  var autoHideTimer = null;

  function dismiss() {
    if (autoHideTimer) window.clearTimeout(autoHideTimer);
    banner.classList.remove('is-visible');
    document.documentElement.style.setProperty('--cta-bar-offset', '0px');
    sessionStorage.setItem(STORAGE_KEY, '1');
    window.setTimeout(function () { banner.remove(); }, 400);
  }

  banner.querySelector('.cookie-banner-agree').addEventListener('click', dismiss);
  banner.querySelector('.cookie-banner-close').addEventListener('click', dismiss);

  window.setTimeout(function () {
    banner.classList.add('is-visible');
    if (ctaBar) {
      document.documentElement.style.setProperty('--cta-bar-offset', banner.offsetHeight + 'px');
    }
    autoHideTimer = window.setTimeout(dismiss, AUTO_HIDE_MS);
  }, SHOW_DELAY_MS);
})();
