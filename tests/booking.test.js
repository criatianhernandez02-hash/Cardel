// Runs apps-script/Code.gs inside Node with a fake Google Calendar and checks
// the double-booking rules. Usage: node tests/booking.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const TZ = 'America/Los_Angeles';

// "YYYY-MM-DD HH:mm" in TZ → Date (search for the matching UTC offset).
function parseLocal(str) {
  const [d, t] = str.split(' ');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  for (const offH of [7, 8]) {
    const cand = new Date(guess + offH * 3600000);
    if (formatLocal(cand, 'yyyy-MM-dd HH:mm') === str) return cand;
  }
  throw new Error('cannot parse ' + str);
}
function formatLocal(date, fmt) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map(p => [p.type, p.value]));
  if (fmt === 'yyyy-MM-dd') return `${parts.year}-${parts.month}-${parts.day}`;
  if (fmt === 'yyyy-MM-dd HH:mm') return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
  return date.toString();
}

function makeEnv() {
  const events = [];
  const cal = {
    getEvents(start, end) {
      return events.filter(e => e.start < end && e.end > start).map(e => ({
        isAllDayEvent: () => !!e.allDay,
        getStartTime: () => e.start, getEndTime: () => e.end,
        getAllDayStartDate: () => e.start, getAllDayEndDate: () => e.end,
        getMyStatus: () => e.status || 'OWNER'
      }));
    },
    createEvent(title, start, end, opts) {
      const e = { title, start, end, opts };
      events.push(e);
      return { setColor() {} };
    },
    getName: () => 'Paty'
  };
  const cache = {}, props = {};
  let sheetBroken = false;
  const makeSheet = name => {
    const sh = { name, rows: [],
      setName(n) { sh.name = n; }, appendRow(r) { sh.rows.push(r.slice()); }, setFrozenRows() {},
      getDataRange: () => ({ getValues: () => sh.rows.map(r => r.slice()) }),
      getLastRow: () => sh.rows.length,
      getRange: (row, col, nr, nc) => ({ setValues: v => { sh.rows[row - 1] = v[0].slice(); },
        insertCheckboxes: () => { sh.checkboxes = (sh.checkboxes || 0) + 1; }, setFormula: f => { sh.formula = f; } }) };
    return sh;
  };
  const ss = { created: 0, sheets: [makeSheet('Sheet1')], getId: () => 'sheet-1', getUrl: () => 'https://sheet',
    getSheets() { return ss.sheets; }, insertSheet(n) { const sh = makeSheet(n); ss.sheets.push(sh); return sh; },
    getSheetByName(n) { return ss.sheets.find(x => x.name === n); } };
  const ctx = {
    CalendarApp: {
      getDefaultCalendar: () => cal, getCalendarById: () => cal,
      GuestStatus: { NO: 'NO' }
    },
    Utilities: { parseDate: (s) => parseLocal(s), formatDate: (d, tz, f) => formatLocal(d, f) },
    CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => { cache[k] = v; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    MailApp: { sendEmail() {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) },
    ContentService: {
      createTextOutput: s => ({ setMimeType() { return { body: s }; } }),
      MimeType: { JSON: 'json' }
    },
    Logger: { log() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
    SpreadsheetApp: {
      create: () => { if (sheetBroken) throw new Error('no drive'); ss.created++; return ss; },
      openById: () => ss
    }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script/Code.gs'), 'utf8'), ctx);
  return { ctx, events, ss, breakSheet: () => { sheetBroken = true; } };
}

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; }
}

// Monday 2026-10-05 08:00 local — Thursday 10/08 is an open day (10:00–18:00).
const NOW = parseLocal('2026-10-05 08:00');
const TUE = '2026-10-08'; // an open day (Thursday)

console.log('Booking backend');

test('closed days return no slots', () => {
  const { ctx } = makeEnv();
  const r = ctx.getAvailability_('kids-cut', '2026-10-04', 2, NOW); // Sun, Mon
  assert.strictEqual(r.days['2026-10-05'].length, 0);
});

test('open day lists slots within hours, service must finish by close', () => {
  const { ctx } = makeEnv();
  const slots = ctx.getAvailability_('color-touchup', TUE, 1, NOW).days[TUE];
  assert.strictEqual(slots[0], '10:00');
  assert.strictEqual(slots[slots.length - 1], '17:00'); // 60 min → last start 17:00
});

test('an event she adds by hand blocks that time (plus buffer)', () => {
  const { ctx, events } = makeEnv();
  events.push({ start: parseLocal(TUE + ' 12:00'), end: parseLocal(TUE + ' 13:00') });
  const slots = ctx.getAvailability_('kids-cut', TUE, 1, NOW).days[TUE];
  assert.ok(!slots.includes('11:30'), '11:30 + 30m + 10m buffer runs into 12:00');
  assert.ok(!slots.includes('12:00') && !slots.includes('12:30') && !slots.includes('13:00'));
  assert.ok(slots.includes('11:00') && slots.includes('13:30'));
});

test('all-day event (vacation) blocks the whole day', () => {
  const { ctx, events } = makeEnv();
  events.push({ allDay: true, start: parseLocal(TUE + ' 00:00'), end: parseLocal('2026-10-09 00:00') });
  assert.strictEqual(ctx.getAvailability_('kids-cut', TUE, 1, NOW).days[TUE].length, 0);
});

test('declined invitations do not block time', () => {
  const { ctx, events } = makeEnv();
  events.push({ start: parseLocal(TUE + ' 10:00'), end: parseLocal(TUE + ' 18:00'), status: 'NO' });
  assert.ok(ctx.getAvailability_('kids-cut', TUE, 1, NOW).days[TUE].length > 0);
});

test('minimum notice hides slots too close to now', () => {
  const { ctx } = makeEnv();
  const now = parseLocal(TUE + ' 11:10');
  const slots = ctx.getAvailability_('kids-cut', TUE, 1, now).days[TUE];
  assert.strictEqual(slots[0], '12:30'); // 1h notice → 12:10 → next slot 12:30
});

const client = { service: 'kids-cut', date: TUE, time: '10:00', name: 'Ana Lopez', phone: '(530) 555-0199', email: 'ana@example.com' };

test('booking creates a calendar event and invites the client', () => {
  const { ctx, events } = makeEnv();
  const r = ctx.book_(client, NOW);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(events.length, 1);
  assert.strictEqual(formatLocal(events[0].start, 'yyyy-MM-dd HH:mm'), TUE + ' 10:00');
  assert.strictEqual(formatLocal(events[0].end, 'yyyy-MM-dd HH:mm'), TUE + ' 10:30');
  assert.strictEqual(events[0].opts.guests, 'ana@example.com');
});

test('the same slot cannot be booked twice', () => {
  const { ctx } = makeEnv();
  assert.strictEqual(ctx.book_(client, NOW).ok, true);
  const r = ctx.book_({ ...client, phone: '530-555-0100' }, NOW);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.error, 'slot_taken');
});

test('an online booking removes overlapping slots for longer services', () => {
  const { ctx } = makeEnv();
  ctx.book_({ ...client, time: '13:00' }, NOW);
  const slots = ctx.getAvailability_('full-highlights', TUE, 1, NOW).days[TUE];
  assert.ok(slots.includes('10:00'), '10:00 + 150m = 12:30, +10m buffer = 12:40, clear of 13:00');
  assert.ok(!slots.includes('10:30'), '10:30 + 150m = 13:00 leaves no buffer');
  assert.ok(!slots.includes('12:00') && slots.includes('13:40') === false && slots.includes('14:00'));
});

test('rejects bad input and bots', () => {
  const { ctx } = makeEnv();
  assert.strictEqual(ctx.book_({ ...client, website: 'x' }, NOW).ok, false);
  assert.strictEqual(ctx.book_({ ...client, phone: '123' }, NOW).error, 'bad_phone');
  assert.strictEqual(ctx.book_({ ...client, service: 'nope' }, NOW).error, 'unknown_service');
  assert.strictEqual(ctx.book_({ ...client, time: '09:00' }, NOW).error, 'slot_taken'); // before opening
});

test('throttles repeated bookings from one phone number', () => {
  const { ctx } = makeEnv();
  ['10:00', '11:00', '12:00'].forEach(t => assert.ok(ctx.book_({ ...client, time: t }, NOW).ok));
  assert.strictEqual(ctx.book_({ ...client, time: '14:00' }, NOW).error, 'too_many');
});

test('DST change day (Nov 1 2026) still produces correct local times', () => {
  const { ctx, events } = makeEnv();
  const now = parseLocal('2026-10-30 08:00');
  const sat = '2026-10-31', tue = '2026-11-05';
  const r = ctx.book_({ ...client, date: tue, time: '15:00' }, now);
  assert.ok(r.ok);
  assert.strictEqual(formatLocal(events[0].start, 'yyyy-MM-dd HH:mm'), tue + ' 15:00');
  assert.strictEqual(ctx.getAvailability_('kids-cut', sat, 1, now).days[sat][0], '09:00');
});


console.log('Add-ons and new services');

test('the website can send a longer length (service + haircut add-on)', () => {
  const { ctx, events } = makeEnv();
  const r = ctx.book_({ ...client, service: 'balayage', minutes: 225, label: 'Balayage + haircut', time: '10:00' }, NOW);
  assert.ok(r.ok);
  assert.strictEqual(formatLocal(events[0].end, 'yyyy-MM-dd HH:mm'), TUE + ' 13:45');
  assert.ok(events[0].title.startsWith('Balayage + haircut'));
});

test('a service not in the script list still books with its length', () => {
  const { ctx, events } = makeEnv();
  const r = ctx.book_({ ...client, service: 'brand-new', minutes: 50, label: 'Gloss', time: '10:00' }, NOW);
  assert.ok(r.ok);
  assert.strictEqual(formatLocal(events[0].end, 'yyyy-MM-dd HH:mm'), TUE + ' 10:45'); // rounded to 45
});

test('availability uses the length sent by the website', () => {
  const { ctx } = makeEnv();
  const slots = ctx.getAvailability_('kids-cut', TUE, 1, NOW, 120, 'x').days[TUE];
  assert.strictEqual(slots[slots.length - 1], '16:00'); // 2h must end by 18:00
});

test('silly lengths fall back to the service default', () => {
  const { ctx, events } = makeEnv();
  assert.ok(ctx.book_({ ...client, minutes: 9999, time: '10:00' }, NOW).ok);
  assert.strictEqual(formatLocal(events[0].end, 'yyyy-MM-dd HH:mm'), TUE + ' 10:30');
});

console.log('Client list (Google Sheet)');

test('a booking is saved to Bookings and Clients', () => {
  const { ctx, ss } = makeEnv();
  assert.ok(ctx.book_(client, NOW).ok);
  const bookings = ss.getSheetByName('Bookings').rows, clients = ss.getSheetByName('Clients').rows;
  assert.strictEqual(bookings.length, 2);            // header + 1
  assert.strictEqual(bookings[1][4], 'Ana Lopez');
  assert.strictEqual(clients[1][1], '(530) 555-0199');
  assert.strictEqual(clients[1][6], 1);
});

test('the same phone number updates one client row', () => {
  const { ctx, ss } = makeEnv();
  ctx.book_(client, NOW);
  ctx.book_({ ...client, time: '13:00', phone: '530-555-0199', service: 'balayage' }, NOW);
  const clients = ss.getSheetByName('Clients').rows;
  assert.strictEqual(clients.length, 2);              // header + 1 client
  assert.strictEqual(clients[1][6], 2);
  assert.strictEqual(clients[1][7], 'Balayage');
  assert.strictEqual(ss.created, 1);                  // spreadsheet created once
});

test('formulas typed into the form are stored as plain text', () => {
  const { ctx, ss } = makeEnv();
  ctx.book_({ ...client, name: '=HYPERLINK("x")', notes: '+1 test' }, NOW);
  const row = ss.getSheetByName('Bookings').rows[1];
  assert.strictEqual(row[4], `'=HYPERLINK("x")`);
  assert.strictEqual(row[8], "'+1 test");
});

test('a spreadsheet problem never blocks the booking', () => {
  const { ctx, events, breakSheet } = makeEnv();
  breakSheet();
  assert.ok(ctx.book_(client, NOW).ok);
  assert.strictEqual(events.length, 1);
});

console.log('Referral tracking');

test('a booking with "referred by" lands on the Referrals tab with tick boxes', () => {
  const { ctx, ss, events } = makeEnv();
  assert.ok(ctx.book_({ ...client, referredBy: 'Maria Gomez' }, NOW).ok);
  const refs = ss.getSheetByName('Referrals');
  assert.strictEqual(refs.rows.length, 2);
  assert.strictEqual(refs.rows[1][1], 'Ana Lopez');
  assert.strictEqual(refs.rows[1][4], 'Maria Gomez');
  assert.strictEqual(refs.checkboxes, 1);
  assert.ok(ss.getSheetByName('Top referrers').formula.startsWith('=QUERY('));
  assert.ok(events[0].opts.description.includes('Referred by: Maria Gomez'));
});

test('no referral = no Referrals tab row', () => {
  const { ctx, ss } = makeEnv();
  ctx.book_(client, NOW);
  assert.strictEqual(ss.getSheetByName('Referrals'), undefined);
});

console.log(`\n${passed} passed`);
