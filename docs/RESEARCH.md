# Why salon websites turn visitors into calls and bookings, and how this site applies it

This research was done in September 2026. Several sources are salon-software vendors. Vendor numbers are labeled as such and are good for direction, but they aren't independent studies.

## The business today

- **Cardel Designs Hair Salon**, 1810 E Main St Suite 105, Woodland, CA 95776. The owner and stylist is Paty (Patricia).
- **Rating:** 4.6★ from 22 reviews, according to Birdeye. Reviewers praise how much attention to detail she gives and say they never feel rushed.
- **Current presence:** a Google Business Profile, Instagram [@cardel_designs_hairsalon](https://www.instagram.com/cardel_designs_hairsalon/), Facebook (Cardel Boutique) and a Booksy listing. The old domain cardeldesignshairsalon.com no longer resolves.
- **Woodland** is about 50% Hispanic/Latino ([Data USA](https://datausa.io/profile/geo/woodland-ca)).

## What the research says

| Finding | Number | Source |
|---|---|---|
| Salon appointments booked while the salon is closed | **~46%** | Phorest data via [Salon Today](https://www.salontoday.com/603348/data-confirms-demand-for-online-booking) |
| 18–24 year-olds who expect online booking | **43%** | same survey |
| Smartphone users who have contacted a business straight from search, e.g. click-to-call | **60%** | Google, via [local SEO compilations](https://seoprofy.com/blog/local-seo-statistics/) |
| Increase in bounce rate as mobile load time goes from 1s to 3s | **+32%** | [Google / Think with Google](https://www.thinkwithgoogle.com/_qs/documents/9757/Milliseconds_Make_Millions_report_hQYAbZJ.pdf) |
| Consumers who read reviews on Google | **83%** | [BrightLocal 2025](https://www.brightlocal.com/research/local-consumer-review-survey-2025/) |
| Consumers who prefer to buy with information in their own language | **76%** | [CSA Research](https://www.newswire.com/news/survey-of-8-709-consumers-in-29-countries-finds-that-76-prefer-21174283) |
| Typical salon no-show rate / reduction when reminders are sent | 15–20% / up to −50% (vendor data) | [DaySmart](https://www.daysmart.com/salon/blog/how-to-reduce-salon-no-shows/) |

The high-converting salon sites we reviewed share the same pattern:

1. **One clear action on the first screen**, which is Book, with the phone number right beside it.
2. **A sticky Call / Book bar on mobile.**
3. **A price menu that shows how long each service takes.** Vague pricing makes people hesitate.
4. **Reviews placed next to the booking buttons.**
5. **Real photos of the stylist's work.**
6. **Address, map and hours that are easy to find.**
7. **A fast page.**

## How this site applies it

| Best practice | Where it is on the site |
|---|---|
| One main action, repeated | "Book online" button in the hero, header, About section, menu and mobile bar. It uses one accent colour that appears nowhere else. |
| Call without searching | A phone button in the hero, a "Call" tab on the sticky mobile bar, and the number in the Visit section, booking page and footer. All of them are `tel:` links. |
| Where the salon is | The address sits in the hero and links to Google Maps directions. There's also a "Directions" tab on the mobile bar, a Visit section with a map and hours table (today is highlighted), and a live "Open now · until 6 pm" status. |
| What clients can get | A service menu with "from" prices and times. Tapping any service jumps straight to open times for that service. |
| Quality of service | A promise strip (consultation first, never rushed…), an About Paty section, a real client review, the 4.6★ rating with a link to Google reviews, and a gallery or Instagram link. |
| Book 24/7 | A 3-step booking flow (service → time → details) connected live to Paty's Google Calendar. See [SETUP.md](../SETUP.md). |
| Fewer no-shows | Clients who give an email get a Google Calendar invite with reminders. The cancellation policy is shown before they confirm. |
| Bilingual | A complete, hand-written Spanish version behind the EN/ES button. It switches automatically for phones set to Spanish, and "Se habla español" appears on the first screen. |
| Local SEO | `HairSalon` structured data (address, geo, hours, rating, `ReserveAction`), a descriptive page title and meta description. Name, address and phone should match the Google Business Profile exactly. |
| Speed | Plain HTML/CSS/JS with no framework and nothing to build. The map loads lazily. |
| Measuring | Every call, directions and booking tap pushes a `cta_click` event, and each finished booking sends `booking_complete`. Add Google Analytics 4 and these events show up on their own. |

## After launch: Google Business Profile

1. In the profile, go to **Edit profile → Website** and enter the new site's URL.
2. Go to **Edit profile → Bookings / Appointment link** and enter the site URL with `#book` on the end. This adds a "Book" button right on Google Search and Maps.
3. Add the services and prices to the profile so they match the site.
4. Ask happy clients for Google reviews. Each new review can be copied into `reviews` in `assets/js/config.js`, which should get to 3–5 quotes on the site.
