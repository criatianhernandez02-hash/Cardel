/**
 * Cardel Designs Hair Salon — online booking backend.
 *
 * Runs as a Google Apps Script web app under the salon owner's Google account.
 * Her Google Calendar is the single source of truth:
 *   - Anything on the calendar (online bookings, appointments she types in by
 *     hand, "lunch", "vacation" all-day events, Booksy-synced events) blocks
 *     that time, so the website can never double-book.
 *   - Every online booking is written straight into the same calendar.
 *
 * Setup steps are in SETUP.md at the root of the repository.
 */

// ─── Settings the owner can edit ────────────────────────────────────────────
var CONFIG = {
  // 'primary' = the main calendar of the Google account that deploys this script.
  CALENDAR_ID: 'primary',

  // Extra calendars whose events should ALSO block time (e.g. a Booksy sync
  // calendar or a personal calendar). The account must be able to see them.
  EXTRA_BLOCKING_CALENDAR_IDS: [],

  TIMEZONE: 'America/Los_Angeles',

  // Opening hours used for booking, 24h clock. null = closed that day.
  // 0 = Sunday … 6 = Saturday. Keep these in sync with assets/js/config.js.
  HOURS: {
    0: null,
    1: null,
    2: null,
    3: ['11:00', '19:00'],
    4: ['10:00', '18:00'],
    5: ['10:00', '19:00'],
    6: ['09:00', '16:00']
  },

  SLOT_STEP_MINUTES: 30,   // offer start times every 30 minutes
  BUFFER_MINUTES: 10,      // cleanup time kept free after each appointment
  MIN_NOTICE_HOURS: 1,     // no bookings sooner than this from now (0.5 = 30 min)
  MAX_DAYS_AHEAD: 60,      // how far ahead clients can book

  // Service ids MUST match the ids in assets/js/config.js.
  // minutes = how long the calendar is blocked for that service.
  SERVICES: {
    'womens-cut':      { name: "Women's Haircut & Style",  minutes: 60 },
    'mens-cut':        { name: "Men's Haircut",            minutes: 30 },
    'kids-cut':        { name: 'Kids Haircut (12 & under)', minutes: 30 },
    'blowout':         { name: 'Wash & Blowout',            minutes: 45 },
    'root-touchup':    { name: 'Root Touch-Up',             minutes: 90 },
    'all-over-color':  { name: 'All-Over Color',            minutes: 120 },
    'highlights':      { name: 'Highlights',                minutes: 150 },
    'balayage':        { name: 'Balayage / Ombré',          minutes: 180 },
    'updo':            { name: 'Special Occasion Updo',     minutes: 75 },
    'quince-bridal':   { name: 'Quinceañera / Bridal Hair', minutes: 120 },
    'treatment':       { name: 'Deep Conditioning Treatment', minutes: 45 },
    'consultation':    { name: 'Free Consultation',         minutes: 15 }
  },

  // Colour of online-booking events in her calendar (CalendarApp.EventColor).
  EVENT_COLOR: '3', // purple / "Grape"

  // Send the client a Google Calendar invite when they give an email.
  INVITE_CLIENT: true,

  // Also email the owner a short "New online booking" message.
  NOTIFY_OWNER_EMAIL: true
};
// ────────────────────────────────────────────────────────────────────────────


/** GET ?action=availability&service=<id>&from=YYYY-MM-DD&days=N */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.action === 'availability') {
      return json_(getAvailability_(p.service, p.from, Number(p.days) || 14, new Date()));
    }
    if (p.action === 'ping') {
      return json_({ ok: true, timezone: CONFIG.TIMEZONE });
    }
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json_({ ok: false, error: 'server_error', detail: String(err) });
  }
}

/** POST body (JSON, sent as text/plain to avoid CORS preflight). */
function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return json_(book_(body, new Date()));
  } catch (err) {
    return json_({ ok: false, error: 'server_error', detail: String(err) });
  }
}


// ─── Availability ───────────────────────────────────────────────────────────

function getAvailability_(serviceId, fromStr, days, now) {
  var service = CONFIG.SERVICES[serviceId];
  if (!service) return { ok: false, error: 'unknown_service' };

  days = Math.max(1, Math.min(days, 31));
  var today = localDateStr_(now);
  var from = isDateStr_(fromStr) && fromStr > today ? fromStr : today;
  var last = addDays_(today, CONFIG.MAX_DAYS_AHEAD);

  var dates = [];
  for (var i = 0; i < days; i++) {
    var d = addDays_(from, i);
    if (d > last) break;
    dates.push(d);
  }
  if (!dates.length) return { ok: true, service: serviceId, days: {} };

  var rangeStart = localDateTime_(dates[0], 0);
  var rangeEnd = localDateTime_(addDays_(dates[dates.length - 1], 1), 0);
  var busy = getBusyIntervals_(rangeStart, rangeEnd);

  var result = {};
  dates.forEach(function (date) {
    result[date] = slotsForDate_(date, service.minutes, busy, now);
  });
  return { ok: true, service: serviceId, timezone: CONFIG.TIMEZONE, days: result };
}

/** Start times ("HH:mm") on `date` where `minutes` of work fits. */
function slotsForDate_(date, minutes, busy, now) {
  var hours = CONFIG.HOURS[weekday_(date)];
  if (!hours) return [];

  var open = toMinutes_(hours[0]);
  var close = toMinutes_(hours[1]);
  var earliest = now.getTime() + CONFIG.MIN_NOTICE_HOURS * 3600 * 1000;
  var slots = [];

  for (var m = open; m + minutes <= close; m += CONFIG.SLOT_STEP_MINUTES) {
    var start = localDateTime_(date, m).getTime();
    if (start < earliest) continue;
    // Keep BUFFER_MINUTES clear on both sides of every other appointment.
    var buffer = CONFIG.BUFFER_MINUTES * 60000;
    var end = start + minutes * 60000;
    if (!overlapsAny_(start - buffer, end + buffer, busy)) slots.push(fromMinutes_(m));
  }
  return slots;
}

function overlapsAny_(start, end, busy) {
  for (var i = 0; i < busy.length; i++) {
    if (start < busy[i][1] && end > busy[i][0]) return true;
  }
  return false;
}

/** [startMs, endMs] for every event that should block time. */
function getBusyIntervals_(start, end) {
  var ids = [CONFIG.CALENDAR_ID].concat(CONFIG.EXTRA_BLOCKING_CALENDAR_IDS || []);
  var busy = [];
  ids.forEach(function (id) {
    var cal = id === 'primary' ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(id);
    if (!cal) return;
    cal.getEvents(start, end).forEach(function (ev) {
      // Invitations she declined don't block time.
      try {
        if (ev.getMyStatus && ev.getMyStatus() === CalendarApp.GuestStatus.NO) return;
      } catch (ignore) {}
      if (ev.isAllDayEvent()) {
        busy.push([ev.getAllDayStartDate().getTime(), ev.getAllDayEndDate().getTime()]);
      } else {
        busy.push([ev.getStartTime().getTime(), ev.getEndTime().getTime()]);
      }
    });
  });
  return busy;
}


// ─── Booking ────────────────────────────────────────────────────────────────

function book_(body, now) {
  // Honeypot field: real visitors never fill it in.
  if (body.website) return { ok: false, error: 'rejected' };

  var service = CONFIG.SERVICES[body.service];
  if (!service) return { ok: false, error: 'unknown_service' };
  if (!isDateStr_(body.date) || !/^\d{2}:\d{2}$/.test(body.time || '')) {
    return { ok: false, error: 'bad_time' };
  }

  var name = clean_(body.name, 80);
  var phone = clean_(body.phone, 30);
  var email = clean_(body.email, 120);
  var notes = clean_(body.notes, 500);
  if (name.length < 2) return { ok: false, error: 'missing_name' };
  if (phone.replace(/\D/g, '').length < 10) return { ok: false, error: 'bad_phone' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'bad_email' };

  var throttleKey = 'book:' + phone.replace(/\D/g, '');
  var cache = CacheService.getScriptCache();
  var recent = Number(cache.get(throttleKey) || 0);
  if (recent >= 3) return { ok: false, error: 'too_many' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, error: 'busy_try_again' };
  try {
    // Re-check the slot inside the lock so two people can't take the same time.
    var dayStart = localDateTime_(body.date, 0);
    var dayEnd = localDateTime_(addDays_(body.date, 1), 0);
    var slots = slotsForDate_(body.date, service.minutes, getBusyIntervals_(dayStart, dayEnd), now);
    if (slots.indexOf(body.time) === -1) return { ok: false, error: 'slot_taken' };

    var start = localDateTime_(body.date, toMinutes_(body.time));
    var end = new Date(start.getTime() + service.minutes * 60000);
    var cal = CONFIG.CALENDAR_ID === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);

    var description = [
      'Booked online at the Cardel Designs website.',
      '',
      'Client: ' + name,
      'Phone: ' + phone,
      email ? 'Email: ' + email : null,
      'Service: ' + service.name + ' (' + service.minutes + ' min)',
      notes ? 'Notes: ' + notes : null,
      body.lang === 'es' ? 'Prefers Spanish / Prefiere español' : null
    ].filter(function (x) { return x !== null; }).join('\n');

    var options = { description: description, location: 'Cardel Designs Hair Salon' };
    if (email && CONFIG.INVITE_CLIENT) {
      options.guests = email;
      options.sendInvites = true;
    }
    var ev = cal.createEvent(service.name + ' — ' + name, start, end, options);
    try { ev.setColor(CONFIG.EVENT_COLOR); } catch (ignore) {}

    cache.put(throttleKey, String(recent + 1), 3600);

    if (CONFIG.NOTIFY_OWNER_EMAIL) {
      try {
        MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
          'New online booking: ' + service.name + ' — ' + name,
          description + '\n\nWhen: ' + Utilities.formatDate(start, CONFIG.TIMEZONE, "EEE MMM d, h:mm a"));
      } catch (ignore) {}
    }

    return {
      ok: true,
      service: body.service,
      date: body.date,
      time: body.time,
      minutes: service.minutes,
      invited: Boolean(email && CONFIG.INVITE_CLIENT)
    };
  } finally {
    lock.releaseLock();
  }
}


// ─── Helpers ────────────────────────────────────────────────────────────────

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

function isDateStr_(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toMinutes_(hhmm) {
  var p = hhmm.split(':');
  return Number(p[0]) * 60 + Number(p[1]);
}

function fromMinutes_(m) {
  var h = Math.floor(m / 60), mm = m % 60;
  return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
}

/** "YYYY-MM-DD" of `d` in the salon's timezone. */
function localDateStr_(d) {
  return Utilities.formatDate(d, CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

/** Date for `minutes` after local midnight on `dateStr` (DST-safe). */
function localDateTime_(dateStr, minutes) {
  var carry = Math.floor(minutes / 1440);
  var day = carry ? addDays_(dateStr, carry) : dateStr;
  return Utilities.parseDate(day + ' ' + fromMinutes_(minutes % 1440), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm');
}

/** Calendar arithmetic on "YYYY-MM-DD" strings, independent of timezone. */
function addDays_(dateStr, n) {
  var p = dateStr.split('-');
  var d = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + n));
  return d.toISOString().slice(0, 10);
}

function weekday_(dateStr) {
  var p = dateStr.split('-');
  return new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]))).getUTCDay();
}

/** Run once from the editor to grant calendar + email permissions. */
function authorize() {
  CalendarApp.getDefaultCalendar().getName();
  MailApp.getRemainingDailyQuota();
  Logger.log('Authorized. Next: Deploy → New deployment → Web app.');
}
