# Kiki — Booking Flow Prototype

An interactive, phone-framed web prototype of the Kiki **booking request flow**
(guest/looker side), rebuilt 1:1 from the production mobile app for fast UX/UI
iteration.

## Flow covered

Explore → Room detail → **Request to book** → Dates → Payment breakdown →
Guests → Intro message → Rank request → Sent confirmation → Trips "Sent
requests".

## Fidelity sources

- **Design tokens** ported from `@kiki/ui-general` (`packages/ui/general/src/tokens.ts`)
  and the mobile theme (`apps/mobile-app/theme/theme.ts`): primary teal
  `#20A598`, tints, schedule colors, Inter, roundness.
- **Screens & behavior** ported from
  `apps/mobile-app/components/bookingRequest/` (BookingRequestForm, DatesStep,
  PaymentStep + PaymentScheduleGraphic, GuestInfoStep, MessageStep,
  ReorderRequests, BookingRequestSuccessSheet), including:
  - seasonal min-stay validation (50% of availability Apr–Aug, 30% Sep–Mar)
    with the red "N nights short" state,
  - the ≥100-char intro requirement with inline errors,
  - Couple option disabled when the listing isn't open to couples,
  - rank-against-existing-requests step after submit, then the success sheet
    over Trips.
- Photos/avatars are self-drawn SVG placeholders so the build is fully
  self-contained (no network requests).

## Develop

```bash
npm install
npm run dev     # local dev server
npm run build   # single-file build → dist/index.html
```

`dist/index.html` is a self-contained single file — open it anywhere.
