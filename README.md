# DUSACCOM — Next.js

Production-oriented chamber website built with **Next.js 16 App Router, React, strict TypeScript, and Tailwind CSS 4**. Existing DUSACCOM branding and the official contact details are preserved.

## Start

Requires Node.js 22.16+ and npm.

```sh
npm ci
npm run dev
```

Pages: `/`, `/about`, `/programs`, `/membership`, `/contact`, `/resources/[slug]`, `/privacy`, `/terms`. The membership and programs pages are server-rendered with validated URL selections. Other public content is prerendered. All routes retain an SSR/static HTML baseline with small client components for forms, filters, navigation, and consent.

The main page summarizes the Chamber in this order after the existing hero: About, Mission & Vision, Become a Member, Register, INFOTEP English and Spanish lessons, Events Calendar, and Registration Form. Navbar and footer section links return to this landing page; supporting detail pages and member quick links remain available. Membership cards always show their description, benefits, and signup link, with equal heights and bottom-aligned buttons within each row. Membership cards preselect the pathway in the main-page form without clearing entered contact details. Direct links can use `/?tier=nonprofit#register-form` (or another valid tier ID).

```sh
npm run typecheck
npm test
npm run build
npm start
```

## Inquiries and persistence

`POST /api/inquiries` validates JSON with the same Zod/TypeScript schema used by the browser. It accepts contact, membership, and initiative inquiries, plus event registrations and persists them to Cloudflare D1 before issuing a receipt. It includes bounded streaming body reads, same-origin checks, a honeypot, database-backed rate limits, idempotent submission IDs, parameterized SQL, and privacy-conscious structured logs. It never returns a successful receipt without durable acceptance.

D1 is provisioned by Sites from `.openai/hosting.json` (`d1: "DB"`). Schema-only migrations are in `drizzle/`. To initialize the **local** database and preview the Worker:

```sh
npm run db:local
npm run build:sites
npm run preview
```

`npm run dev` and a standard `next start` do not implicitly start a database emulator. Without a D1 binding, inquiries correctly return HTTP 503 and show the chamber’s email and phone as alternatives. Use the Worker preview to exercise local persistence. A conventional Node/Vercel deployment should supply an `InquiryStore` adapter for its own persistent database; the route business logic is independent of D1.

New submissions are stored in the `inquiries` table with status `new`. An authorized database operator can review these records using the hosting provider’s D1 tooling. **No automatic inquiry email notifications, staff inquiry dashboard, payment processor, or recurring marketing subscription is configured.** There is no public route that lists inquiry records. Agree an operator review process, access policy, and retention schedule before opening submissions to the public.

Inquiry receipts confirm inquiry acceptance. Event registration receipts confirm a saved registration for the selected scheduled event. Receipts do not establish membership, collect a payment, or send an outgoing email. If a request times out, the visitor can retry with the same submission ID without creating duplicate records.

## Hosting

The source is portable Next.js. OpenNext adapts its output for the existing private Cloudflare/Sites deployment. `npm run build:sites` runs the standard Next.js production build, then packages the Cloudflare Worker in `dist/server/index.js` and hashed local assets in `dist/client`. Publishing uses the Sites source/version workflow and applies schema migrations before deployment.

Do not run a raw `wrangler deploy` against the Sites-managed project or change its audience implicitly. `wrangler.jsonc` is a **local preview** configuration; the placeholder ID is not a production database ID.

## Branding and approved content

Official contact: **646-326-6052** · **dusaccom1@gmail.com**.

Edit typed content in `src/lib/content.ts`. Board profiles, member milestones, testimonials, and partners have explicit typed collections, initially empty because no approved names, quotes, logos, or milestones were supplied. The layouts support approved records without fabricated endorsements. Membership benefits/pathways and event concepts are clearly described as proposed; pricing, dates, venues, registration, and approval must be confirmed by the Chamber.

Photographs are illustrative community/business imagery, not evidence of DUSACCOM events or endorsements. Source photos are local Unsplash assets (`photo-1480714378408-67cf0d13bc1b`, `photo-1515187029135-18ee286d815b`).

## Performance and accessibility

`next/image` uses a custom loader for build-time optimized local WebP variants; no third-party image or font request is needed. Hero images are prioritized, secondary images are lazy loaded, layouts reserve image dimensions, and client interactions respect reduced motion. Server components keep marketing content out of client feature bundles.

Semantic landmarks, a skip link, keyboard-visible focus, native form controls, accessible errors/status messages, and generous interaction targets are included. Browser automation was unavailable in the build environment. Visual responsive QA, a full WCAG audit, and field Core Web Vitals must be measured before claiming compliance or sub-two-second loads.

## SEO, analytics, and operational readiness

Next Metadata config supplies title templates, descriptions, canonical URLs, OpenGraph/Twitter cards, and organization structured data. `sitemap.ts` and `robots.ts` generate public crawl metadata. `GET /api/health` is a minimal liveness endpoint that exposes no database or private data.

Copy `.env.example` for site-origin configuration. Set `NEXT_PUBLIC_GA_ID` only when an approved Google Analytics property is ready. No tracking is enabled by default. Analytics load only after consent; form contents never enter conversion events. Optional pixel integrations can listen to the `dusaccom:analytics` custom event, emitted only after consent. Respect later consent withdrawal. Conversions include page views, inquiry option selection, and confirmed inquiry acceptance.

Server logs use event names, status codes, timings, request IDs, and receipt references. They exclude form bodies, raw IP addresses, and error stacks. Native Next.js error, loading, and not-found boundaries cover visitor failures. Review policy copy, database handling, content approvals, operator access, and your chosen analytics configuration before a public launch.
# DUSACCOM

## Chapter event calendar

The landing page calendar serves the chapter supporting Latinos in the United States. It includes month navigation, date selection, event time zones, and inline registration. Below the calendar, up to three confirmed upcoming events appear in order of start time, soonest first, regardless of the selected month. This card section stays hidden when there are no upcoming events. Proposed initiatives without confirmed dates do not appear as upcoming events. No live dates are fabricated.

To publish an event in `src/lib/content.ts`, keep its stable ID, set `status: 'confirmed'`, provide a `location`, and add `schedule` with `startsAt` (an ISO timestamp including `Z` or an explicit UTC offset), `timeZone` (an IANA time zone), and `registration: 'open'` or `'closed'`. Optional `titleEs` and `descriptionEs` supply Spanish event text. The calendar groups each event by its local date and displays its local time zone. An event link can use `/?event=<id>#events`.

Registrations use the existing database-backed inquiry service with `kind: 'event-registration'` and the event ID in `interest`. The name, email, and consent are required; a message is optional. The server rejects registration for unscheduled, proposed, past, or closed events and returns a receipt only after durable storage succeeds. Retries use the same submission ID and receipt. The existing SQLite `kind` column is plain text, so the added kind requires no SQL schema migration. Online submission still requires the configured D1 binding; a conventional Next.js development server without D1 returns a recoverable error rather than a false confirmation.

## Firebase accounts and live calendar

Email/password accounts, password reset, protected administrator roles, and live calendar publishing are implemented with Firebase. See [the setup and administrator guide](docs/FIREBASE_SETUP.md) for completed project details, assigning roles, host environment variables, and deployment steps. Firebase stores accounts, roles, and events; the existing D1 inquiry/registration storage remains in use.

The homepage cycles through the four remaining Dominican cultural photographs every thirty seconds, with a crossfade and no shading overlay. The slideshow has no visible controls; automatic rotation is disabled when reduced motion is preferred. The image list in `src/lib/hero-images.json` maps the current files in `public/imgs/Imágenes culturales dominicanas_files/` to responsive variants generated by the build script.

Successful sign-in and account creation redirect to the events calendar. Administrators can select an existing category or enter a new category (up to 60 characters); categories from published events become available for later events. Publishing collapses the creation card, which can be reopened from its heading. Event cards appear only in Upcoming events, ordered by start time, with calendar-day filtering and a control to show all upcoming events. Every enabled administrator can edit and delete any published event, including events created by another administrator. The Include past events control exposes older events for management. Editing preserves the original creator and creation timestamp; deletion requires an inline confirmation. The account menu is opaque. The header, hero text panel, and event editor backdrop use transparent backgrounds with blur and no tint. The registration dropdown is transparent with blur over the hero and solid white outside it. The footer displays the complete logo at its natural aspect ratio. Explore Membership links lead to the registration form; membership-card links also select the appropriate pathway. Deploy the updated `firestore.rules` with these changes so custom categories can be saved.
