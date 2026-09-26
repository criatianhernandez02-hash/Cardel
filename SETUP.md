# Connecting online booking to Paty's Google Calendar

Plan on about 15 minutes. It's free, and there's nothing to install. Do this **signed in to Paty's Google account**, the one whose calendar she checks on her phone.

## How it works

```
Client on website ──► picks service + time ──► Google Apps Script (runs as Paty) ──► Paty's Google Calendar
                          ▲                                                                │
                          └──────────── only shows times that are free ◄──────────────────┘
```

- **Her calendar is the boss.** When she adds anything to her Google Calendar, that time disappears from the website: a walk-in, a phone booking, "Lunch", "Dentist", or an all-day "Vacation".
- **Online bookings land in her calendar right away** as purple events titled like `Balayage / Ombré — Ana Lopez`. The client's phone number, email and notes go in the event details. She gets a notification like she would for any event.
- **No double bookings.** The server checks the calendar a second time at the moment of booking, inside a lock. If two people click the same time, only the first one gets it; the second person is asked to pick another time.
- If the client gives an email, they receive a Google Calendar invite with a reminder.
- **Moving or cancelling:** move or delete the event in Google Calendar and the website updates on its own.

## Step 1: Create the script

1. Go to <https://script.google.com> and click **New project**.
2. Rename the project (top left) to `Cardel Booking`.
3. Delete everything in `Code.gs`. Paste in the whole contents of [`apps-script/Code.gs`](apps-script/Code.gs) from this repo.
4. Click the gear icon (**Project Settings**) and check **Show "appsscript.json" manifest file in editor**. Go back to the editor, open `appsscript.json`, and replace its contents with [`apps-script/appsscript.json`](apps-script/appsscript.json).
5. Click **Save** (disk icon).

## Step 2: Adjust the settings (top of `Code.gs`)

| Setting | What it does |
|---|---|
| `HOURS` | The hours clients can book, for each day of the week. `null` means closed. |
| `SERVICES` | How long each service blocks the calendar, in minutes. |
| `BUFFER_MINUTES` | Cleanup time kept free before and after each appointment. The default is 10. |
| `MIN_NOTICE_HOURS` | Stops last-minute bookings. The default is 3 hours. |
| `MAX_DAYS_AHEAD` | How far ahead clients can book. The default is 60 days. |
| `EXTRA_BLOCKING_CALENDAR_IDS` | Other calendars that should also block time. For example, if Booksy syncs into a separate Google calendar, paste that calendar's ID here. |

## Step 3: Give permission

1. In the function dropdown at the top, choose **`authorize`** and click **Run**.
2. Google asks for permission. Click **Review permissions**, pick Paty's account, then **Advanced** → **Go to Cardel Booking (unsafe)** → **Allow**.
   - The "unsafe" wording is normal for any script you write yourself. The script only reads and writes her own calendar and sends her a notification email.

## Step 4: Publish it as a web app

1. Click **Deploy** → **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set **Execute as** to **Me** and **Who has access** to **Anyone**.
4. Click **Deploy** and copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy…/exec`.

## Step 5: Connect the website

1. Open [`assets/js/config.js`](assets/js/config.js) and paste the URL:
   ```js
   bookingEndpoint: 'https://script.google.com/macros/s/AKfy…/exec',
   ```
2. Commit and push. The yellow "Preview mode" banner goes away, and bookings are now real.

## Step 6: Test it

1. On the website, book a **Free Consultation** for tomorrow using your own phone number and email. It should show up in Paty's Google Calendar within seconds.
2. Refresh the website and pick the same day. That time should be gone.
3. In Google Calendar, create an event called "Lunch" from 12:00 to 1:00. On the website, 12:00 and 12:30 are no longer offered.
4. Delete both test events.

## Changing things later

- **Hours or durations:** edit `Code.gs` in script.google.com. Then go to **Deploy** → **Manage deployments** → pencil icon → **Version: New version** → **Deploy**. The URL stays the same. Also update the hours shown on the site in `assets/js/config.js`.
- **Taking a day off:** just add an all-day event to Google Calendar, for example "Closed". Nothing else is needed.
- **Prices, services and wording on the site:** edit `assets/js/config.js`. If you add a new service, add it with the **same id** in `Code.gs` too.

## What about Booksy?

The listings show Paty already uses Booksy. There are two options:

1. **Use the website + Google Calendar as the main system (recommended).** She can turn off Booksy online booking, or keep Booksy only for existing clients.
2. **Keep both.** Booksy's help center says it can import an outside calendar, and the website respects everything in her Google Calendar. If Booksy appointments are synced into a Google calendar, add that calendar's ID to `EXTRA_BLOCKING_CALENDAR_IDS` so they block website times too. Check in the Booksy Biz app how its sync works before relying on it, because search results disagree on whether the sync is live and two-way.

## Zero-code alternative

Google Calendar has a built-in **Appointment schedule** booking page (in Google Calendar, go to Create → Appointment schedule). On a free Gmail account it gives one booking page with one appointment length, and it hides times that are busy on her main calendar. It's a good fallback, but it can't show a menu of services with different lengths, so this site uses the custom script above.
