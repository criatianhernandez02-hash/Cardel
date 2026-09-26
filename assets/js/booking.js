(function () {
  var C = window.CARDEL, UI = window.CardelUI;
  var t = function (k, v) { return I18N.t(k, v); };
  var $ = function (s) { return document.querySelector(s); };

  var WINDOW = 14;          // days shown per page of the date strip
  var MAX_AHEAD = 60;       // keep equal to MAX_DAYS_AHEAD in Code.gs
  var DEMO = !C.bookingEndpoint;

  var state = { service: null, from: null, date: null, time: null, days: {} };
  var cache = {};

  var services = {};
  C.serviceGroups.forEach(function (g) { g.services.forEach(function (s) { services[s.id] = s; }); });

  // ── Date helpers (all dates are "YYYY-MM-DD" in the salon's timezone) ──
  function todayStr() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
  }
  function addDays(d, n) {
    var p = d.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)).toISOString().slice(0, 10);
  }
  function asUTC(d) { var p = d.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)); }
  function fmtDate(d, opts) {
    return new Intl.DateTimeFormat(I18N.lang === 'es' ? 'es-MX' : 'en-US', Object.assign({ timeZone: 'UTC' }, opts)).format(asUTC(d));
  }
  function longDate(d) {
    var s = fmtDate(d, { weekday: 'long', month: 'long', day: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ── Data ────────────────────────────────────────────────────────────────
  function fetchDays(serviceId, from) {
    var key = serviceId + '|' + from;
    if (cache[key]) return Promise.resolve(cache[key]);
    var p = DEMO ? demoDays(serviceId, from) :
      fetch(C.bookingEndpoint + '?action=availability&service=' + encodeURIComponent(serviceId) +
        '&from=' + from + '&days=' + WINDOW)
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok) throw new Error(j.error); return j.days; });
    return p.then(function (days) { cache[key] = days; return days; });
  }

  function postBooking(payload) {
    if (DEMO) {
      return new Promise(function (res) {
        setTimeout(function () {
          res({ ok: true, date: payload.date, time: payload.time, minutes: services[payload.service].minutes, invited: !!payload.email });
        }, 700);
      });
    }
    return fetch(C.bookingEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  // Preview-only availability: real hours, sample "busy" times.
  function demoDays(serviceId, from) {
    var minutes = services[serviceId].minutes, out = {};
    var now = new Date(), la = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now).split(':');
    var nowMin = +la[0] * 60 + +la[1], today = todayStr();
    for (var i = 0; i < WINDOW; i++) {
      var d = addDays(from, i), h = C.hours[asUTC(d).getUTCDay()], slots = [];
      if (h && d <= addDays(today, MAX_AHEAD)) {
        var open = toMin(h[0]), close = toMin(h[1]), seed = +d.replace(/-/g, '');
        for (var m = open; m + minutes <= close; m += 30) {
          if (d === today && m < nowMin + 180) continue;
          if (((seed * 31 + m * 7) % 11) < 4) continue; // pretend some times are taken
          slots.push(pad(m));
        }
      }
      out[d] = slots;
    }
    return new Promise(function (res) { setTimeout(function () { res(out); }, 350); });
  }
  function toMin(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function pad(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }

  // ── Steps ───────────────────────────────────────────────────────────────
  function go(step) {
    document.querySelectorAll('.booker .panel').forEach(function (p) {
      p.hidden = p.getAttribute('data-panel') !== String(step);
    });
    document.querySelectorAll('.steps li').forEach(function (li) {
      var n = +li.getAttribute('data-step');
      li.classList.toggle('is-active', n === step);
      li.classList.toggle('is-done', n < step || step === 4);
    });
    if (step === 2) loadWindow();
    if (step === 3) renderChosen();
  }

  function renderServiceSelect() {
    var L = I18N.lang, sel = $('#serviceSelect');
    sel.innerHTML = C.serviceGroups.map(function (g) {
      return '<optgroup label="' + UI.esc(g[L]) + '">' + g.services.map(function (s) {
        return '<option value="' + s.id + '">' + UI.esc(s[L][0]) + ' — ' + UI.fmtPrice(s.price) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    sel.value = state.service || C.serviceGroups[0].services[0].id;
    state.service = sel.value;
    renderSummary();
  }

  function renderSummary() {
    var s = services[state.service];
    $('#svcSummary').textContent = s[I18N.lang][1] + ' · ' + UI.fmtDuration(s.minutes) + ' · ' + UI.fmtPrice(s.price);
  }

  function chosenHTML(withTime) {
    var s = services[state.service];
    var line = '<strong>' + UI.esc(s[I18N.lang][0]) + '</strong> · ' + UI.fmtDuration(s.minutes);
    if (withTime && state.date && state.time) {
      line += '<br><span class="chosen-when">' + longDate(state.date) + ' · ' + UI.fmtTime(state.time) + '</span>';
    }
    return '<div>' + line + '</div><button type="button" class="btn btn-link btn-sm" data-back="' + (withTime ? 2 : 1) + '">' + t('change') + '</button>';
  }
  function renderChosen() {
    $('#chosen2').innerHTML = chosenHTML(false);
    $('#chosen3').innerHTML = chosenHTML(true);
  }

  function loadWindow() {
    renderChosen();
    var today = todayStr();
    if (!state.from) state.from = today;
    $('#prevDays').disabled = state.from <= today;
    $('#nextDays').disabled = addDays(state.from, WINDOW) > addDays(today, MAX_AHEAD);
    $('#dateStrip').innerHTML = '';
    $('#slots').innerHTML = '<p class="slots-msg">' + t('loading') + '</p>';

    var reqService = state.service, reqFrom = state.from;
    fetchDays(reqService, reqFrom).then(function (days) {
      if (reqService !== state.service || reqFrom !== state.from) return;
      state.days = days;
      if (!state.date || !(state.date in days)) {
        state.date = Object.keys(days).filter(function (d) { return days[d].length; })[0] || null;
      }
      renderDates();
      renderSlots();
    }).catch(function () {
      $('#slots').innerHTML = '<p class="slots-msg is-error">' + t('loadError') + '</p>';
    });
  }

  function renderDates() {
    var today = todayStr();
    $('#dateStrip').innerHTML = Object.keys(state.days).map(function (d) {
      var n = state.days[d].length;
      var top = d === today ? t('today') : d === addDays(today, 1) ? t('tomorrow') : fmtDate(d, { weekday: 'short' });
      return '<button type="button" role="option" class="date-chip' + (d === state.date ? ' is-selected' : '') +
        (n ? '' : ' is-full') + '" data-date="' + d + '" aria-selected="' + (d === state.date) + '"' + (n ? '' : ' disabled') + '>' +
        '<span class="dc-dow">' + top + '</span><span class="dc-day">' + fmtDate(d, { day: 'numeric' }) + '</span>' +
        '<span class="dc-mon">' + fmtDate(d, { month: 'short' }) + '</span></button>';
    }).join('');
    var sel = $('.date-chip.is-selected');
    if (sel) sel.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function renderSlots() {
    var box = $('#slots');
    if (!state.date) { box.innerHTML = '<p class="slots-msg">' + t('noSlots') + '</p>'; return; }
    var slots = state.days[state.date] || [];
    if (!slots.length) { box.innerHTML = '<p class="slots-msg">' + t('noSlots') + '</p>'; return; }
    var groups = { morning: [], afternoon: [], evening: [] };
    slots.forEach(function (s) {
      var h = +s.split(':')[0];
      groups[h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'].push(s);
    });
    box.innerHTML = '<h4 class="slots-date">' + longDate(state.date) + '</h4>' +
      ['morning', 'afternoon', 'evening'].filter(function (k) { return groups[k].length; }).map(function (k) {
        return '<div class="slot-group"><p class="slot-label">' + t(k) + '</p><div class="slot-grid">' +
          groups[k].map(function (s) {
            return '<button type="button" class="slot" data-time="' + s + '">' + UI.fmtTime(s) + '</button>';
          }).join('') + '</div></div>';
      }).join('');
  }

  // ── Events ──────────────────────────────────────────────────────────────
  $('#serviceSelect').addEventListener('change', function (e) {
    state.service = e.target.value; state.date = null; renderSummary();
  });
  $('#toStep2').addEventListener('click', function () { go(2); });
  $('#prevDays').addEventListener('click', function () {
    state.from = addDays(state.from, -WINDOW);
    if (state.from < todayStr()) state.from = todayStr();
    state.date = null; loadWindow();
  });
  $('#nextDays').addEventListener('click', function () {
    state.from = addDays(state.from, WINDOW); state.date = null; loadWindow();
  });
  $('#dateStrip').addEventListener('click', function (e) {
    var b = e.target.closest('.date-chip'); if (!b || b.disabled) return;
    state.date = b.getAttribute('data-date'); renderDates(); renderSlots();
  });
  $('#slots').addEventListener('click', function (e) {
    var b = e.target.closest('.slot'); if (!b) return;
    state.time = b.getAttribute('data-time');
    go(3);
    $('#fName').focus({ preventScroll: true });
  });
  $('#booker').addEventListener('click', function (e) {
    var b = e.target.closest('[data-back]'); if (!b) return;
    go(+b.getAttribute('data-back'));
  });

  // Tapping a service in the menu jumps straight to its times.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.menu-item[data-service]'); if (!a) return;
    e.preventDefault();
    $('#booker').scrollIntoView({ behavior: 'smooth', block: 'start' });
    state.service = a.getAttribute('data-service'); state.date = null; state.from = null;
    $('#serviceSelect').value = state.service; renderSummary();
    go(2);
  });

  // Format phone as the client types: (530) 555-0123
  $('#fPhone').addEventListener('input', function (e) {
    var d = e.target.value.replace(/\D/g, '').replace(/^1/, '').slice(0, 10);
    e.target.value = d.length > 6 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6)
      : d.length > 3 ? '(' + d.slice(0, 3) + ') ' + d.slice(3) : d;
  });

  $('#bookForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, err = $('#formError'), btn = $('#submitBtn');
    var payload = {
      service: state.service, date: state.date, time: state.time,
      name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(),
      notes: f.notes.value.trim(), website: f.website.value, lang: I18N.lang
    };
    var local = payload.name.length < 2 ? 'missing_name'
      : payload.phone.replace(/\D/g, '').length < 10 ? 'bad_phone'
      : payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) ? 'bad_email' : null;
    if (local) return showError(local);

    err.hidden = true;
    btn.disabled = true;
    var label = btn.innerHTML;
    btn.textContent = t('booking');
    postBooking(payload).then(function (r) {
      if (!r.ok) throw r;
      done(payload, r);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'booking_complete', service: payload.service });
      if (typeof window.gtag === 'function') window.gtag('event', 'booking_complete', { service: payload.service });
    }).catch(function (r) {
      var code = r && r.error;
      showError(code);
      if (code === 'slot_taken') {
        delete cache[state.service + '|' + state.from];
        state.time = null;
        setTimeout(function () { go(2); }, 1800);
      }
    }).then(function () { btn.disabled = false; btn.innerHTML = label; });

    function showError(code) {
      var key = 'err_' + code, msg = t(key);
      err.textContent = msg === key ? t('err_generic') : msg;
      err.hidden = false;
    }
  });

  function done(p, r) {
    var s = services[p.service];
    $('#doneWhen').innerHTML = '<strong>' + UI.esc(s[I18N.lang][0]) + '</strong><br>' +
      longDate(p.date) + ' · ' + UI.fmtTime(p.time);
    $('#doneInvite').textContent = r.invited ? t('invited', { e: p.email }) : t('notInvited');
    var start = p.date.replace(/-/g, '') + 'T' + p.time.replace(':', '') + '00';
    var endM = toMin(p.time) + s.minutes;
    var end = p.date.replace(/-/g, '') + 'T' + pad(endM).replace(':', '') + '00';
    var a = C.address;
    $('#addToCal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(s.en[0] + ' — Cardel Designs') +
      '&dates=' + start + '/' + end + '&ctz=America/Los_Angeles' +
      '&location=' + encodeURIComponent(C.name + ', ' + a.street + ', ' + a.city + ', ' + a.region + ' ' + a.zip) +
      '&details=' + encodeURIComponent('Questions or changes: ' + C.phone);
    $('#bookForm').reset();
    cache = {};
    go(4);
    $('#book').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  I18N.onChange(function () {
    renderServiceSelect();
    var panel = document.querySelector('.booker .panel:not([hidden])');
    var step = panel ? +panel.getAttribute('data-panel') : 1;
    if (step === 2 && Object.keys(state.days).length) { renderChosen(); renderDates(); renderSlots(); }
    if (step === 3) renderChosen();
  });

  $('#demoBanner').hidden = !DEMO;
  renderServiceSelect();
})();
