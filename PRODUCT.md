# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who already treat facial appearance as something to measure and improve. They arrive with a photo, want a number and a diagnosis (best feature + limiter), then a next action. Casual one-off raters are the free-scan top of funnel.

Secondary: buyers of the one-time Full Face Report after the free scan.

## Product Purpose

Face Rating (`facerating.com`) is a browser AI face analyzer: upload a clear photo, receive a 0–100 face rating plus strongest feature, main limiter, and what to improve first.

Success: a first-time visitor completes a free scan without installing anything, understands the result well enough to act or upgrade, and does so without the product rewriting its indexed SEO metadata.

## Positioning

Same job as category leaders such as The Face Report — decode the face, then show what to do. Neighboring products can also score a selfie. Durable claim is only what the shipped tool does: in-browser scan, overall score, feature/limiter, improvement priority, plus the paid Face Report. Do not invent uniqueness, press, or clinical authority.

## Operating Context

- Next.js (App Router) + next-intl landing at `/` and locale routes; metadata and JSON-LD live in `src/app/[locale]/(default)/page.tsx`.
- Landing composition: `src/components/face-rating/landing-page.tsx`. Marketing strings: `src/components/face-rating/data.ts` (source of truth for the rebuilt page).
- Workflow: land → free upload/scan → score + strongest + limiter name → optional $9.90 Full Face Report.
- Local surface: `http://localhost:3000/`.
- Category reference (narrative only): `https://thefacereport.com/` — story rhythm, not a page to clone.

## Capabilities and Constraints

- Free: on-device scan; 0–100 face rating; strongest feature name; main limiter name. No account required.
- Paid primary conversion (confirmed 2026-08-14): **Full Face Report, $9.90 once** — explanations, region/ratio scores, styling + hairstyle previews on the user’s photo, 72-hour + four-week ranked plan, web report + emailed PDF. Not credits/subscription on the homepage.
- Adjacent rails (auth, credits, Stripe/Creem, image/video APIs) exist; they are not the landing’s job.

Hard constraints:

- **Do not change page SEO metadata** — titles, descriptions, robots, JSON-LD in `page.tsx` stay as shipped unless the user revokes this.
- **Hero layout is frozen** (confirmed 2026-08-14): `hero.tsx` structure, split, visual, CTA placement stay. Hero *copy* in `data.ts` may be rewritten.
- **Landing body copy below the hero may be rewritten** to the conversion story.
- **Do not clone competitor pages** — no matching section order, chrome, or wording.
- **Landing never shows fabricated user results.** Specific scores, diagnoses, and recommendations appear only after upload on the Result page. Marketing mocks use empty, locked, or clearly labeled sample-instrument states. No invented user counts.

Undecided: WCAG target.

## Brand Commitments

- Name: **Face Rating**.
- Voice: score + diagnosis + next move.
- Binding: reuse validated *narrative logic* (immediate decode, short ritual, know-then-act, free proof, inventory then paid depth, transform after measurement, return to decode). Do not copy competitor hexes, layout, or sentences.
- Incumbent visual system in `visual.ts` follows The Face Report measured tokens (near-black `#18181B`, accent `#9F1239`, Inter + Instrument Serif). Paper/gold is retired.

## Evidence on Hand

- Product assets: `public/face-rating/` (`hero-face.jpg`, glow-up before/after).
- Trust-bar logos in landing JSON — **not** press claims.
- No fabricated testimonials, user volume, or clinical studies.

**Absent — do not invent:** independent benchmarks, doctor endorsements, user volume, “used by X,” or unpaid features the app does not ship.

## Product Principles

1. **Diagnosis before theater** — measurement story before beauty transformation.
2. **SEO metadata is product law** — indexed title/description/JSON-LD do not move with visual work.
3. **Free scan is the product** — first success is completing analysis in the browser.
4. **Pay only for the unfinished page** — paid report fills explanations, ranked plan, on-face styling, and the PDF.
5. **One accent, many chapters** — contrast paces the long page; do not decorate every block equally.
