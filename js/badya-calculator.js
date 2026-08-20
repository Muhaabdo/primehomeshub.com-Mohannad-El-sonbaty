// Badya "Value by the Years" pricing calculator. Shared by the AR and EN
// pages -- driven by document.documentElement.lang so every dynamic string
// (badge, price lines, WhatsApp message) matches the page it's running on.
// Unit/plan names are read straight from each page's own markup (already
// localized there), so no separate translation table is needed for them.
(function () {
  var unitsWrap = document.getElementById('calc-units');
  if (!unitsWrap) return;

  var isAr = document.documentElement.lang === 'ar';
  var plansWrap = document.getElementById('calc-plans');
  var yearsWrap = document.getElementById('calc-years');
  var discountBadge = document.getElementById('calc-discount-badge');
  var basePriceEl = document.getElementById('calc-base-price');
  var finalPriceEl = document.getElementById('calc-final-price');
  var savingsEl = document.getElementById('calc-savings');
  var statInstallmentEl = document.getElementById('calc-stat-installment');
  var statCountEl = document.getElementById('calc-stat-count');
  var waBtn = document.getElementById('calc-wa-btn');

  var DOWN_PAYMENT_RATE = 0.015; // each installment in both plans is a flat 1.5%

  var DISCOUNTS = {
    1: { 12: 0, 10: 14, 8: 24, 6: 38 },
    2: { 12: 0, 10: 18, 8: 29, 6: 42 }
  };

  function formatPrice(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  function money(n) {
    return isAr ? (formatPrice(n) + ' جنيه') : (formatPrice(n) + ' EGP');
  }

  var unitActive = unitsWrap.querySelector('.calc-option.active');
  var planActive = plansWrap.querySelector('.calc-plan-option.active');
  var yearActive = yearsWrap.querySelector('.calc-option.active');

  var state = {
    price: Number(unitActive.dataset.price),
    unitName: unitActive.querySelector('.opt-title').textContent.trim(),
    plan: Number(planActive.dataset.plan),
    installments: Number(planActive.dataset.installments),
    years: Number(yearActive.dataset.years)
  };

  function selectButton(group, clicked) {
    group.querySelectorAll('.calc-option, .calc-plan-option').forEach(function (btn) {
      btn.classList.toggle('active', btn === clicked);
    });
  }

  function updateYearSubs() {
    yearsWrap.querySelectorAll('[data-years-sub]').forEach(function (el) {
      var years = Number(el.dataset.yearsSub);
      var discount = DISCOUNTS[state.plan][years];
      el.textContent = isAr ? ('خصم ' + discount + '%') : (discount + '% off');
    });
  }

  function recalc() {
    var discount = DISCOUNTS[state.plan][state.years];
    var hasDiscount = discount > 0;
    var final = state.price * (1 - discount / 100);
    var savings = state.price - final;
    var installmentValue = final * DOWN_PAYMENT_RATE;

    discountBadge.textContent = hasDiscount
      ? (isAr ? ('خصم ' + discount + '%') : (discount + '% Off'))
      : (isAr ? 'بدون خصم' : 'No Discount');

    basePriceEl.textContent = isAr
      ? (money(state.price) + ' (تقسيط 12 سنة)')
      : (money(state.price) + ' (12-year plan)');
    basePriceEl.classList.toggle('no-discount', !hasDiscount);

    finalPriceEl.innerHTML = isAr
      ? (formatPrice(final) + ' <small>جنيه</small>')
      : (formatPrice(final) + ' <small>EGP</small>');

    savingsEl.textContent = hasDiscount
      ? (isAr
        ? ('يوفر لك ده ' + money(savings) + ' عن سعر تقسيط الـ12 سنة')
        : ('You save ' + money(savings) + ' compared to the 12-year price'))
      : (isAr
        ? 'ده سعر أطول مدة تقسيط متاحة، من غير أي خصم إضافي'
        : 'This is the price for the longest available plan, with no extra discount');

    statInstallmentEl.textContent = money(installmentValue);
    statCountEl.textContent = isAr
      ? (state.installments + ' دفعات')
      : (state.installments + ' installments');

    var message = isAr
      ? ('مرحبًا، حابب أحجز ' + state.unitName + ' في مشروع Badya (أوبشن ' + state.plan +
        '، تقسيط ' + state.years + ' سنين' + (hasDiscount ? ('، خصم ' + discount + '%') : '') +
        ') بسعر تقريبي ' + money(final) + '. برجاء إرسال قيمة القسط الشهري وجدول السداد بالتفصيل.')
      : ('Hi, I would like to book a ' + state.unitName + ' in Badya - Palm Hills. Payment plan: Option ' +
        state.plan + ', ' + state.years + '-year installments' +
        (hasDiscount ? (' (' + discount + '% discount)') : '') + '. Estimated price: ' + money(final) +
        '. Please send me the monthly installment amount and the full payment schedule.');
    waBtn.href = 'https://wa.me/201001413177?text=' + encodeURIComponent(message);
  }

  unitsWrap.addEventListener('click', function (e) {
    var btn = e.target.closest('.calc-option');
    if (!btn) return;
    selectButton(unitsWrap, btn);
    state.price = Number(btn.dataset.price);
    state.unitName = btn.querySelector('.opt-title').textContent.trim();
    recalc();
  });

  plansWrap.addEventListener('click', function (e) {
    var btn = e.target.closest('.calc-plan-option');
    if (!btn) return;
    selectButton(plansWrap, btn);
    state.plan = Number(btn.dataset.plan);
    state.installments = Number(btn.dataset.installments);
    updateYearSubs();
    recalc();
  });

  yearsWrap.addEventListener('click', function (e) {
    var btn = e.target.closest('.calc-option');
    if (!btn) return;
    selectButton(yearsWrap, btn);
    state.years = Number(btn.dataset.years);
    recalc();
  });

  updateYearSubs();
  recalc();
})();
