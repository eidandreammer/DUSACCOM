# DUSACCOM — Next.js

Production-oriented chamber website built with **Next.js 16 App Router, React, strict TypeScript, and Tailwind CSS 4**. Existing DUSACCOM branding and the official contact details are preserved.

## Start

Requires Node.js 22.16+ and npm.

```sh
npm ci
npm run dev
```

Pages: `/`, `/about`, `/programs`, `/membership`, `/contact`, `/resources/[slug]`, `/privacy`, `/terms`. The membership and programs pages are server-rendered with validated URL selections. Other public content is prerendered. All routes retain an SSR/static HTML baseline with small client components for forms, filters, navigation, and consent.

```sh
npm run typecheck
npm test
npm run build
npm start
```

## Inquiries and persistence

`POST /api/inquiries` validates JSON with the same Zod/TypeScript schema used by the browser. It accepts contact, membership, and initiative inquiries and persists them to Cloudflare D1 before issuing a receipt. It includes bounded streaming body reads, same-origin checks, a honeypot, database-backed rate limits, idempotent submission IDs, parameterized SQL, and privacy-conscious structured logs. It never returns a successful receipt without durable acceptance.

D1 is provisioned by Sites from `.openai/hosting.json` (`d1: "DB"`). Schema-only migrations are in `drizzle/`. To initialize the **local** database and preview the Worker:

```sh
npm run db:local
npm run build:sites
npm run preview
```

`npm run dev` and a standard `next start` do not implicitly start a database emulator. Without a D1 binding, inquiries correctly return HTTP 503 and show the chamber’s email and phone as alternatives. Use the Worker preview to exercise local persistence. A conventional Node/Vercel deployment should supply an `InquiryStore` adapter for its own persistent database; the route business logic is independent of D1.

New submissions are stored in the `inquiries` table with status `new`. An authorized database operator can review these records using the hosting provider’s D1 tooling. **No automatic email notifications, staff dashboard, payment processor, member authentication, or recurring marketing subscription is configured.** There is no public route that lists inquiry records. Agree an operator review process, access policy, and retention schedule before opening submissions to the public.

A receipt confirms inquiry acceptance, not membership, event attendance, a payment, or an outgoing email. If a request times out, the visitor can retry with the same submission ID without creating duplicate records.

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
