(function () {
  var C = window.CARDEL;
  var t = function (k, v) { return I18N.t(k, v); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var DAYS = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  };
  var telHref = 'tel:+1' + C.phone.replace(/\D/g, '').slice(-10);

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtTime(hhmm) {
    var p = hhmm.split(':'), h = +p[0], m = +p[1];
    if (I18N.lang === 'es') return h + ':' + (m < 10 ? '0' : '') + m;
    var ap = h >= 12 ? 'pm' : 'am', h12 = h % 12 || 12;
    return h12 + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + ap;
  }

  function fmtDuration(min) {
    if (min < 60) return t('minutes', { m: min });
    var h = Math.floor(min / 60), m = min % 60;
    return m ? t('hrsMin', { h: h, m: m }) : t('hrs', { h: h });
  }

  function fmtPrice(p) { return p ? t('from', { p: p }) : t('free'); }

  // Current time in the salon's timezone, as { day, minutes }.
  function salonNow() {
    var parts = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    return { day: day, minutes: +parts.hour * 60 + +parts.minute };
  }
  function toMin(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }

  function openStatus() {
    var now = salonNow(), today = C.hours[now.day];
    if (today && now.minutes >= toMin(today[0]) && now.minutes < toMin(today[1])) {
      return { open: true, text: t('openNow', { t: fmtTime(today[1]) }) };
    }
    for (var i = 0; i < 7; i++) {
      var d = (now.day + i) % 7, h = C.hours[d];
      if (!h || (i === 0 && now.minutes >= toMin(h[0]))) continue;
      var label = i === 0 ? t('today').toLowerCase() : i === 1 ? t('tomorrow').toLowerCase() : DAYS[I18N.lang][d];
      return { open: false, text: t('closedNow') + ' · ' + t('opensAt', { d: label, t: fmtTime(h[0]) }) };
    }
    return { open: false, text: t('closedNow') };
  }

  function renderStatic() {
    var a = C.address;
    $$('.call-link').forEach(function (el) { el.href = telHref; });
    $$('.phone-text').forEach(function (el) { el.textContent = C.phone; });
    $$('.addr-link').forEach(function (el) { el.href = C.links.directions; });
    $$('.addr-short').forEach(function (el) { el.textContent = a.street.split(',')[0] + ', ' + a.city; });
    $$('.addr-street').forEach(function (el) { el.textContent = a.street; });
    $$('.addr-city').forEach(function (el) { el.textContent = a.city + ', ' + a.region + ' ' + a.zip; });
    $$('.ig-link').forEach(function (el) { el.href = C.links.instagram; });
    $$('.fb-link').forEach(function (el) { el.href = C.links.facebook; });
    $$('.google-reviews').forEach(function (el) { el.href = C.links.googleReviews; });
    $$('.rating-value').forEach(function (el) { el.textContent = C.rating.value.toFixed(1); });
    $$('.rating-count').forEach(function (el) { el.textContent = '· ' + t('reviews', { n: C.rating.count }); });
    $$('.rating-count-num').forEach(function (el) { el.textContent = C.rating.count; });

    var st = openStatus(), os = $('#openStatus');
    os.textContent = st.text;
    os.classList.toggle('is-open', st.open);

    var lt = $('#langToggle');
    lt.textContent = t('langBtn');
    lt.setAttribute('aria-label', t('langLabel'));

    var map = $('#mapFrame');
    if (!map.src) map.src = C.links.mapEmbed;
    $('#year').textContent = new Date().getFullYear();

    if (C.heroImage) {
      var art = $('#heroArt');
      art.classList.add('has-photo');
      art.style.backgroundImage = 'url("' + C.heroImage + '")';
    }
  }

  function renderHours() {
    var today = salonNow().day, order = [1, 2, 3, 4, 5, 6, 0];
    $('#hoursTable').innerHTML = order.map(function (d) {
      var h = C.hours[d], name = DAYS[I18N.lang][d];
      return '<tr' + (d === today ? ' class="is-today"' : '') + '><th scope="row">' +
        name.charAt(0).toUpperCase() + name.slice(1) + '</th><td>' +
        (h ? fmtTime(h[0]) + ' – ' + fmtTime(h[1]) : t('closed')) + '</td></tr>';
    }).join('');
  }

  function renderMenu() {
    var L = I18N.lang;
    $('#serviceMenu').innerHTML = C.serviceGroups.map(function (g) {
      return '<div class="menu-group"><h3>' + esc(g[L]) + '</h3><ul>' + g.services.map(function (s) {
        return '<li><a class="menu-item" href="#book" data-service="' + s.id + '" data-track="book_menu">' +
          '<span class="mi-top"><span class="mi-name">' + esc(s[L][0]) + '</span>' +
          '<span class="mi-dots" aria-hidden="true"></span>' +
          '<span class="mi-price">' + fmtPrice(s.price) + '</span></span>' +
          '<span class="mi-desc">' + esc(s[L][1]) + '</span>' +
          '<span class="mi-meta">' + fmtDuration(s.minutes) + ' · <span class="mi-book">' + t('bookThis') + ' →</span></span>' +
          '</a></li>';
      }).join('') + '</ul></div>';
    }).join('');
  }

  function renderReviews() {
    var L = I18N.lang;
    $('#reviewsList').innerHTML = C.reviews.map(function (r) {
      return '<figure class="review"><p class="stars" aria-hidden="true">★★★★★</p><blockquote>“' +
        esc(r[L] || r.en) + '”</blockquote><figcaption>' + esc(r.name) +
        (r.source ? ' · <span>' + esc(r.source) + '</span>' : '') + '</figcaption></figure>';
    }).join('');
  }

  function renderGallery() {
    var L = I18N.lang, g = $('#gallery');
    if (!C.gallery.length) {
      g.classList.add('is-empty');
      g.innerHTML = '<div class="gallery-empty"><p>' + t('galleryEmpty') + '</p>' +
        '<a class="btn btn-primary" target="_blank" rel="noopener" data-track="instagram_gallery" href="' +
        esc(C.links.instagram) + '">' + t('galleryBtn') + ' · @cardel_designs_hairsalon</a></div>';
      return;
    }
    g.innerHTML = C.gallery.map(function (p) {
      var alt = esc(p[L] || p.en || '');
      return '<figure><img src="' + esc(p.src) + '" alt="' + alt + '" loading="lazy" decoding="async"><figcaption>' + alt + '</figcaption></figure>';
    }).join('');
  }

  function jsonLd() {
    var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var data = {
      '@context': 'https://schema.org',
      '@type': 'HairSalon',
      name: C.name,
      url: location.origin + location.pathname,
      telephone: '+1-' + C.phone.replace(/\D/g, '').slice(-10).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'),
      priceRange: '$$',
      knowsLanguage: ['en', 'es'],
      address: {
        '@type': 'PostalAddress', streetAddress: C.address.street, addressLocality: C.address.city,
        addressRegion: C.address.region, postalCode: C.address.zip, addressCountry: 'US'
      },
      geo: { '@type': 'GeoCoordinates', latitude: C.geo.lat, longitude: C.geo.lng },
      hasMap: C.links.directions,
      sameAs: [C.links.instagram, C.links.facebook],
      aggregateRating: { '@type': 'AggregateRating', ratingValue: C.rating.value, reviewCount: C.rating.count },
      openingHoursSpecification: Object.keys(C.hours).filter(function (d) { return C.hours[d]; }).map(function (d) {
        return { '@type': 'OpeningHoursSpecification', dayOfWeek: dayNames[d], opens: C.hours[d][0], closes: C.hours[d][1] };
      }),
      potentialAction: { '@type': 'ReserveAction', target: location.origin + location.pathname + '#book' }
    };
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  // Click tracking: works with Google Analytics / Tag Manager if added later.
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el) return;
    var name = el.getAttribute('data-track');
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'cta_click', cta: name });
    if (typeof window.gtag === 'function') window.gtag('event', name.split('_')[0] + '_click', { location: name });
  });

  document.getElementById('langToggle').addEventListener('click', function () {
    I18N.set(I18N.lang === 'es' ? 'en' : 'es');
  });

  var header = document.querySelector('.site-header');
  window.addEventListener('scroll', function () {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }, { passive: true });

  function renderAll() {
    renderStatic(); renderHours(); renderMenu(); renderReviews(); renderGallery();
  }

  window.CardelUI = { fmtTime: fmtTime, fmtDuration: fmtDuration, fmtPrice: fmtPrice, esc: esc, DAYS: DAYS };
  I18N.onChange(renderAll);
  I18N.start();
  jsonLd();
})();
