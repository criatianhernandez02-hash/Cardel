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

  // Default length of each service. The website also sends the length (with add-ons),
  // so new services added on the website work without redeploying this script.
  SERVICES: {
    'double-process':     { name: "Double Process / Fashion Color", minutes: 180 },
    'color-correction':   { name: "Color Correction", minutes: 240 },
    'color-touchup':      { name: "Color Touch-Up", minutes: 60 },
    'toner':              { name: "Toner", minutes: 30 },
    'balayage':           { name: "Balayage", minutes: 180 },
    'babylights':         { name: "Babylights", minutes: 180 },
    'full-highlights':    { name: "Full Highlights", minutes: 150 },
    'partial-highlights': { name: "Partial Highlights", minutes: 120 },
    'perm-short':         { name: "Perm, Short to Medium Hair", minutes: 120 },
    'perm-long':          { name: "Perm, Long Hair", minutes: 150 },
    'curly-cut':          { name: "Curly Specialist Haircut", minutes: 75 },
    'teen-cut':           { name: "Teen Haircut (13–17)", minutes: 45 },
    'kids-cut':           { name: "Kids Haircut (12 & under)", minutes: 30 },
    'bang-trim':          { name: "Bang Trim", minutes: 15 },
    'keratin':            { name: "Keratin Treatment", minutes: 180 },
    'brazilian-express':  { name: "Brazilian Blowout Express", minutes: 90 },
    'olaplex-repair':     { name: "Olaplex Repair Treatment", minutes: 30 },
    'deep-conditioning':  { name: "Deep Conditioning Treatment", minutes: 45 }
  },

  // Colour of online-booking events in her calendar (CalendarApp.EventColor).
  EVENT_COLOR: '3', // purple / "Grape"

  // Send the client a Google Calendar invite when they give an email.
  INVITE_CLIENT: true,

  // Also email the owner a short "New online booking" message.
  NOTIFY_OWNER_EMAIL: true,

  // Save every online booking to a Google Sheet in the owner's Drive
  // ("Cardel Designs — Clients", created automatically on the first booking).
  // Run openClientSheet() from the editor to get its link.
  SAVE_TO_SHEET: true
};
// ────────────────────────────────────────────────────────────────────────────


/** GET ?action=availability&service=<id>&from=YYYY-MM-DD&days=N */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.action === 'availability') {
      return json_(getAvailability_(p.service, p.from, Number(p.days) || 14, new Date(), p.minutes, p.label));
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

/**
 * The service being booked: its name and how long it blocks the calendar.
 * The website sends the total length (service + add-ons) and a label, so a
 * service added on the website works even if it isn't in SERVICES yet.
 */
function resolveService_(serviceId, minutes, label) {
  var known = CONFIG.SERVICES[serviceId];
  var m = Math.round(Number(minutes) / 15) * 15;
  if (!(m >= 15 && m <= 360)) m = known ? known.minutes : 0;
  if (!m) return null;
  var name = clean_(label, 120) || (known && known.name) || clean_(serviceId, 60);
  if (!name) return null;
  return { name: name, minutes: m };
}

function getAvailability_(serviceId, fromStr, days, now, minutes, label) {
  var service = resolveService_(serviceId, minutes, label);
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

  var service = resolveService_(body.service, body.minutes, body.label);
  if (!service) return { ok: false, error: 'unknown_service' };
  if (!isDateStr_(body.date) || !/^\d{2}:\d{2}$/.test(body.time || '')) {
    return { ok: false, error: 'bad_time' };
  }

  var name = clean_(body.name, 80);
  var phone = clean_(body.phone, 30);
  var email = clean_(body.email, 120);
  var notes = clean_(body.notes, 500);
  var referredBy = clean_(body.referredBy, 80);
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
      referredBy ? 'Referred by: ' + referredBy + ' (give $10 off; $10 credit to ' + referredBy + ')' : null,
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

    if (CONFIG.SAVE_TO_SHEET) {
      // Never let a spreadsheet problem stop a booking.
      try {
        saveClient_({
          when: start, service: service.name, minutes: service.minutes,
          name: name, phone: phone, email: email, notes: notes, referredBy: referredBy,
          lang: body.lang === 'es' ? 'Spanish' : 'English'
        }, now);
      } catch (err) { Logger.log('Client sheet error: ' + err); }
    }

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

// ─── Client list (Google Sheet) ─────────────────────────────────────────────

var BOOKING_HEADERS = ['Booked at', 'Appointment', 'Service', 'Minutes', 'Name', 'Phone', 'Email', 'Language', 'Notes', 'Referred by'];
var REFERRAL_HEADERS = ['Booked at', 'New client', 'New client phone', 'Appointment', 'Referred by', "Friend's $10 off used", "Referrer's $10 credit given", 'Notes'];
var CLIENT_HEADERS = ['Name', 'Phone', 'Email', 'Language', 'First booking', 'Last appointment', 'Online bookings', 'Last service', 'Notes'];

/** The client spreadsheet, created on first use; its id is remembered in Script Properties. */
function clientSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('CLIENT_SHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (gone) {}
  }
  var ss = SpreadsheetApp.create('Cardel Designs — Clients');
  var bookings = ss.getSheets()[0];
  bookings.setName('Bookings');
  bookings.appendRow(BOOKING_HEADERS);
  bookings.setFrozenRows(1);
  var clients = ss.insertSheet('Clients');
  clients.appendRow(CLIENT_HEADERS);
  clients.setFrozenRows(1);
  props.setProperty('CLIENT_SHEET_ID', ss.getId());
  return ss;
}

/** Text typed on the website, made safe for a cell (no formulas). */
function cell_(v) {
  v = String(v == null ? '' : v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

/** Add the booking to "Bookings" and add or update the client in "Clients" (matched by phone). */
function saveClient_(b, now) {
  var ss = clientSheet_();
  var fmt = function (d) { return Utilities.formatDate(d, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm'); };
  ss.getSheetByName('Bookings').appendRow([
    fmt(now), fmt(b.when), cell_(b.service), b.minutes, cell_(b.name), cell_(b.phone), cell_(b.email), b.lang, cell_(b.notes), cell_(b.referredBy)
  ]);

  if (b.referredBy) {
    var refs = referralsSheet_(ss);
    refs.appendRow([fmt(now), cell_(b.name), cell_(b.phone), fmt(b.when), cell_(b.referredBy), false, false, '']);
    try { refs.getRange(refs.getLastRow(), 6, 1, 2).insertCheckboxes(); } catch (ignore) {}
  }

  var clients = ss.getSheetByName('Clients');
  var key = b.phone.replace(/\D/g, '').slice(-10);
  var rows = clients.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).replace(/\D/g, '').slice(-10) === key) {
      var r = rows[i];
      clients.getRange(i + 1, 1, 1, CLIENT_HEADERS.length).setValues([[
        cell_(b.name) || r[0], r[1], cell_(b.email) || r[2], b.lang, r[4], fmt(b.when),
        (Number(r[6]) || 0) + 1, cell_(b.service), cell_(b.notes) || r[8]
      ]]);
      return;
    }
  }
  clients.appendRow([cell_(b.name), cell_(b.phone), cell_(b.email), b.lang, fmt(now), fmt(b.when), 1, cell_(b.service), cell_(b.notes)]);
}

/** The "Referrals" tab plus a "Top referrers" summary, created when first needed. */
function referralsSheet_(ss) {
  var refs = ss.getSheetByName('Referrals');
  if (refs) return refs;
  refs = ss.insertSheet('Referrals');
  refs.appendRow(REFERRAL_HEADERS);
  refs.setFrozenRows(1);
  var top = ss.insertSheet('Top referrers');
  top.getRange(1, 1).setFormula(
    "=QUERY(Referrals!A:E, \"select E, count(B) where E is not null group by E order by count(B) desc label E 'Referred by', count(B) 'Friends referred'\", 1)");
  return refs;
}

/** Run from the editor to print the link to the client spreadsheet. */
function openClientSheet() {
  Logger.log('Client list: ' + clientSheet_().getUrl());
}

/** Run once from the editor to grant calendar, email and spreadsheet permissions. */
function authorize() {
  CalendarApp.getDefaultCalendar().getName();
  MailApp.getRemainingDailyQuota();
  Logger.log('Client list: ' + clientSheet_().getUrl());
  Logger.log('Authorized. Next: Deploy → Manage deployments → New version.');
}
