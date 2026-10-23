# DUSACCOM

A dependency-free, responsive corporate website for the Dominican USA Chamber of Commerce. All runtime assets are served locally. The entire site is approximately 520 KB before transfer compression.

## Run locally

From this directory:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. No installation or build step is required. Node is optional for development tests, and is not required to host the site.

## Verify

```sh
node tests/forms.test.cjs
python3 scripts/check-site.py
node --check dist/app.js
```

## Implemented

- Mobile navigation, program details, membership inquiries, proposed event interest forms, and an events/resources switcher with keyboard navigation.
- Client-side validation, accessible field errors, explicit consent, loading indicators, error recovery, email-draft preparation, and a copy-message fallback.
- Real chamber contact information: **646-326-6052** and **dusaccom1@gmail.com**.
- Independent `/privacy/` and `/terms/` pages, policy dialogs, and a persistent consent banner with analytics opt-in and withdrawal.
- SEO description, OpenGraph image, Twitter card, organization structured data, sitemap, favicon, and robots file.
- Local photography, a preloaded hero image, lazy-loaded supporting photography, zero third-party runtime packages, cache/security header declarations, reduced-motion support, semantic landmarks, keyboard focus states, and native dialog focus containment.

## Inquiry delivery

The default flow prepares an email to `dusaccom1@gmail.com`. It never says a message was sent or a registration confirmed. Visitors review and send the draft from their own email app. Form entries are not persisted by the website.

For direct delivery, configure a real HTTPS service in `dist/config.js` under `inquiryEndpoint`. The service must accept JSON POST requests containing `name`, `email`, `company`, `interest`, `message`, and `consent`. Return a successful HTTP status only once the inquiry has been durably accepted. Add server validation, abuse controls, appropriate CORS, retention settings, and reliable delivery in that service. Update privacy copy and visible form instructions before enabling it. No payment processing is connected or claimed.

## Analytics

`dist/config.js` accepts an optional Google Analytics `G-…` ID and an `onAnalyticsEvent` callback for conversion pixels. They are disabled by default and invoked only with consent. Hooks include membership CTA clicks, program/resource views, event interest starts, inquiry drafts, and direct-delivery submissions. Form contents are never passed to analytics. Keep any added pixel implementation consent-aware.

## Content awaiting chamber approval

- Membership pathways and listed benefits are proposed; prices are intentionally omitted. Current availability and dues must be confirmed with the chamber.
- Event concepts are labeled as proposed, with dates to be announced. Interest inquiries do not reserve a place.
- No member testimonials or endorsement logos have been invented. Add verified quotes and permissions when supplied.
- Review and approve the website policy copy before a public launch. This initial publication is private.

## Verification limits

Form utility tests and static asset/semantic reference checks are included. Browser automation was unavailable in the build environment, so visual browser QA, measured Core Web Vitals, and a full WCAG audit remain unverified. Sub-two-second loading depends on hosting and visitor network conditions; no unmeasured performance guarantee is made.

Photography: New York City by Wojtek Witkowski (`photo-1480714378408-67cf0d13bc1b`) and community discussion (`photo-1515187029135-18ee286d815b`), sourced from Unsplash. These are illustrative photographs, not representations of a DUSACCOM event or endorsement.
