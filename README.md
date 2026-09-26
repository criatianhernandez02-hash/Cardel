# Cardel Designs Hair Salon: website

This is a fast, bilingual (English/Spanish) one-page website for Cardel Designs Hair Salon in Woodland, CA. It has live online booking tied to the owner's Google Calendar.

- **The site:** `index.html` + `assets/`. It's plain HTML, CSS and JS, with no build step.
- **Booking backend:** `apps-script/Code.gs`, a free Google Apps Script that reads and writes Paty's Google Calendar, so there are no double bookings. Setup is in **[SETUP.md](SETUP.md)**.
- **Why it's built this way:** see [docs/RESEARCH.md](docs/RESEARCH.md).

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000   (add ?lang=es for Spanish)
```

Until `bookingEndpoint` is set in `assets/js/config.js`, booking runs in **preview mode**: it shows sample times and books nothing.

## Test the booking logic

```bash
node tests/booking.test.js
```

This runs the real `Code.gs` against a fake calendar. It checks business hours, buffers, blocking by hand-added and all-day events, the minimum notice period, double-booking protection, input validation and daylight-saving changes.

## Before launch: confirm with Paty

Everything to edit is in `assets/js/config.js`:

- [ ] **Phone number.** It's currently a placeholder, `(530) 555-0123`.
- [ ] **Hours.** These are placeholders. Update them in `config.js` **and** in `HOURS` in `apps-script/Code.gs`.
- [ ] **Services, prices and times.** Prices are placeholder "from" estimates.
- [x] **Photos.** 4 photos of her work are in `assets/img/gallery/` (one is also the hero). They are small (about 510 px tall); higher-resolution originals would look sharper, so swap them in with the same file names when available.
- [ ] **Google reviews link** (`links.googleReviews`) and 2–4 more real review quotes.
- [ ] **Cancellation policy wording** (in the FAQ and booking form).
- [ ] **Booking backend.** Follow [SETUP.md](SETUP.md).

## Hosting

Any static host works: GitHub Pages, Netlify or Cloudflare Pages, all free.

For **GitHub Pages**, go to repo **Settings → Pages → Deploy from branch → `main` / root**. On free GitHub accounts, Pages only works for public repos.

Then point a custom domain at it, e.g. `cardeldesigns.com`, and set the Google Business Profile website and booking links (see docs/RESEARCH.md).
