# Reverse Engineering Report — www.hotels.com → Maldives-Only OTA Reconstruction

**Target:** www.hotels.com (Expedia Group consumer online travel agency)
**Reconstruction objective:** A destination-restricted OTA web app for Maldives hotels/resorts
**Mode:** RESEARCH_AND_IMPLEMENT — research artifacts below are the completed reverse-engineering deliverable; the reconstruction specification (§17–18) is a documented handoff for the implementation phase.
**Date:** 2026-09-30
**Evidence root:** `.reverse-engineering/evidence/`

---

## 1. Executive Summary

**What the product is.** Hotels.com is a commission-based consumer OTA (online travel agency) owned by Expedia Group. It lets travelers search, compare, and book lodging (hotels, vacation rentals) plus ancillary products (cars, packages, gift cards), differentiated by a cross-brand loyalty program (One Key / legacy Hotels.com Rewards) and member-only pricing.

**Who it serves.** Leisure and business travelers (anonymous visitors up to tiered loyalty members), plus supply-side partners (hoteliers via Expedia Partner Central) and support self-service.

**Core workflows.** (1) Search → filter/sort → compare → property → room/rate selection → checkout → confirmation; (2) account creation/sign-in gating member prices, trips, and rewards; (3) earn/redeem loyalty currency (OneKeyCash, trip elements; legacy stamps).

**Major business mechanisms.** Commission from suppliers (implied by marketplace model), Member Prices (observed "instant savings of 10%" filter), loyalty-driven retention (tier discounts 10–20%, VIP Access perks), merchandising/ads in results ("You were interested…", promoted listings), gift cards and co-branded credit cards.

**Major architectural characteristics (observed).** React-based PWA composed of shared, independently published UI modules ("shared-ui-*", bundle families `lotus-home-ui`, `blossom-*-ui`, `shopping-pwa`) served from Expedia Group's `travel-assets.com` CDN, consuming a **GraphQL experience layer**; server-driven component assembly via named `data-stid` slots and the EGDS (Expedia Group Design System); Google Maps static maps; image CDN with transform policies; DataDome bot protection at the edge.

**Important findings.**
- The **filter/sort/merchandising taxonomy is the operational core of the product** — loyalty state (VIP Access, Member Prices), payment type (pay-later, gift card), refundability, meal plans, and traveler type are all filters (EVID-003).
- Search URL parameters form a stable, documented contract (dates, guests, rooms, regionId/destination, sort, amenities, `useRewards`, map bounds) (EVID-003, CDX records).
- The web front end is a **module-federated React PWA over GraphQL**, corroborated both by client bundle names (EVID-012/013) and Expedia Group engineering publications (EVID-019).
- The **Maldives domain differs structurally from the generic OTA model**: price = villa + meal plan + mandatory transfer (speedboat/seaplane/domestic) + TGST 17% + 10% service charge + Green Tax, with a daylight-only seaplane constraint that is itself a booking rule (EVID-021).

**Major limitations.** Live www.hotels.com returns HTTP 429 with a "Bot or Not?" challenge (DataDome) from this network for both HTTP clients and headless/system Chrome; **no live API payloads, property-detail page, or checkout page could be observed directly**. Those areas rest on archived renders, official documentation, and third-party teardowns, and are labeled accordingly (§19).

---

## 2. Investigation Scope & Method

```text
Target:      www.hotels.com (desktop web; mobile app via third-party teardown only)
Type:        Authenticated-capable consumer web application (public surfaces explored anonymously)
Scope:       Product surface, workflows, business rules, data model, API/data flows,
             architecture, UX system, monetization, + destination-specific Maldives domain rules
Access:      Public/anonymous. No credentials provided. No account created. No bookings made.
Tools:       Playwright (system Chrome) crawler, curl, Wayback Machine (CDX + replay),
             web search / official documentation, Expedia Group engineering publications,
             third-party UX teardowns
Period:      2026-09-30
Limitations: Live target bot-walled (HTTP 429) from this network — see EVID-001.
             Property-detail and checkout surfaces not directly observed.
Evidence     OBSERVED = verified from target/archives; INFERRED = multi-source supported;
method:      HYPOTHESIS = plausible, unverified. Confidence: high/medium/low.
```

**Method narrative.**
1. **RECON** — identified product, category, brand relationships (Expedia Group), rewards programs, tech clues.
2. **Direct runtime attempt** — curl + Playwright against live target → HTTP 429 DataDome challenge (EVID-001). Recorded as a hard access boundary; no evasion attempted (skill safety rule: do not defeat rate limits / access controls).
3. **Archived runtime exploration** — Playwright rendered Wayback snapshots of home, search results, deals, trips, login, gift cards, vacation rentals, editorial landing, One Key (EVID-002…011), capturing screenshots + structured DOM extraction (headings, `data-stid` slots, EGDS form fields, filters, sorts, nav).
4. **Network forensics** — request logs from the renders produced the bundle/CDN/analytics inventory (EVID-012, EVID-013).
5. **Documentation corroboration** — official One Key/Rewards terms, Smart Shopping pages, Expedia engineering blogs, booking-flow guides, mobile-app teardown (EVID-015…020).
6. **Domain research** — Maldives-specific pricing/logistics rules needed for the destination rebuild (EVID-021).
7. **Modeling** — coverage model, contradictions (CON-001), structured model (`product-model.json`).

---

## 3. Product Overview

| Aspect | Finding | Evidence |
|---|---|---|
| Purpose | Search/compare/book lodging + ancillaries online | EVID-002, EVID-003 |
| Category | Consumer OTA (marketplace/agency model) | EVID-015, EVID-016 |
| Primary users | Leisure travelers, budget-conscious planners, loyalty members | EVID-002, EVID-005 |
| Value prop | Deals + member discounts + one cross-brand rewards program + flexibility (free cancellation, pay later) | EVID-002, EVID-005, EVID-006 |
| Platforms | Desktop/mobile web (PWA), iOS/Android app, Branch-linked deep links | EVID-002 (app.link), EVID-018 |
| Major capabilities | Search wizard, filters/sort, map, compare (≤5), save-to-Trips, member prices, rewards, gift cards, vacation rentals, cars, support portal | EVID-003, EVID-020, EVID-002 |
| Business model | Supplier commissions + advertising/merchandising + financial products (co-branded cards, gift cards) | EVID-006, EVID-010, EVID-011 |

---

## 4. Product Map

```text
hotels.com
├── Marketing / Public surface
│   ├── Home (hero search + promo carousels + category chips)         [EVID-002]
│   ├── Deals hub (/lp/b/deals, member-only offers + FAQ)             [EVID-006]
│   ├── Editorial landings (/lp/b/accommodation, magazine)            [EVID-004]
│   ├── Vacation rentals (/lp/b/vacation-rentals)                     [EVID-008]
│   ├── Gift cards (/lp/b/giftcards)                                  [EVID-010]
│   ├── One Key rewards (/welcome-one-key) + co-branded cards         [EVID-005, EVID-011]
│   └── App download (Branch deep links)                              [EVID-002]
├── Search (Hotel-Search)
│   ├── Search wizard (destination/region/lat-long, dates, travelers, rooms)  [EVID-003]
│   ├── Results list (lodging-card-responsive) + result count         [EVID-003]
│   ├── Sidebar filters (9 fieldset families)                         [EVID-003]
│   ├── Sort menu + "How our sort order works"                        [EVID-003]
│   ├── Map view (Google static map + bounds param)                   [EVID-003, EVID-012]
│   ├── Compare properties (≤5, shared-ui-retail-lodging-compare)     [EVID-003, EVID-013]
│   └── Save to Trips (outlined-save-button)                          [EVID-003]
├── Property detail (/Hotel-Review)  — NOT DIRECTLY OBSERVED
│   ├── (inferred) gallery, overview, amenities, reviews, rooms       [EVID-013, EVID-015, EVID-018]
│   └── room/rate selection: refundability + prepay vs pay-later      [EVID-015]
├── Checkout — NOT DIRECTLY OBSERVED
│   ├── traveler details → payment → review → Book                    [EVID-015]
│   └── prepaid vs pay-at-hotel comparison modal                      [EVID-015]
├── Account / Identity
│   ├── Sign in or create account (email-first + Google + alternatives) [EVID-009]
│   ├── Cross-brand One Identity (Expedia, Hotels.com, Vrbo)          [EVID-009, EVID-005]
│   └── Trips (auth-gated itinerary/wishlist)                         [EVID-007]
├── Support (service.hotels.com), Feedback (directword.io)            [EVID-002]
└── Partner side (ExpediapartnerCentral — out of scope)               [EVID-002]
```

---

## 5. Persona & Access Model

| Persona | Access | Observed behavior | Evidence |
|---|---|---|---|
| Anonymous visitor | Public | Full search/filter/compare; no member prices; Trips prompts sign-in; can start checkout | EVID-002, EVID-003, EVID-007, EVID-015 |
| Signed-in member (One Key Blue) | Session cookie (unobserved mechanics) | Member Prices (10%+), OneKeyCash earning, save-to-trips, order history | EVID-005, EVID-016, EVID-007 |
| Tier member (Silver/Gold/Platinum) | Membership tier | 15–20% member discounts, VIP Access perks, bonus OneKeyCash, priority support | EVID-016 |
| Guest checkout user | Partial | Booking possible in flow per guide; rewards require sign-in before booking | EVID-015, EVID-016 |
| Support/self-service | Separate host | service.hotels.com; virtual agent handles booking lookup | EVID-002, EVID-018 |

**Access boundaries respected:** no credential creation, no authentication bypass, no checkout completion.

---

## 6. User Journeys

### 6.1 Search → Compare → Select (P0)

```text
Goal:      Find a suitable hotel for given dates/destination
Actor:     Anonymous visitor
Entry:     Home hero ("Where to next?") or sticky search form on interior pages
Steps:     1. Enter destination (free text w/ autocomplete, region/airport/lat-long resolution)
           2. Pick date range (EGDSDateRangePicker Start/End)
           3. Set travelers/rooms (adults, children ages 0–17)
           4. Submit → /Hotel-Search?destination=…&startDate=…&endDate=…&adults=…&rooms=…
           5. Refine via sidebar filters (fieldsets) + sort menu
           6. Optional: map view (mapBounds), compare up to 5, save card
Validation: destination resolved to regionId/destination id; dates required; adults ≥1
API/data:  GraphQL experience layer (client-side), server-rendered shell
Outcome:   Result list with per-card price, rating, amenities, policies
Failure:   Empty result set → "no results" guidance (not observed live; INFERRED from filter UX)
Evidence:  EVID-003, EVID-015 (medium–high)
```

### 6.2 Book (P0) — documented, not directly observed

```text
Steps:     property → scroll to rooms → choose room/rate (Options column: cancellation &
           prepayment policy) → "Let's Book" → prepaid vs pay-on-arrival modal
           ("Pay Now" / "Pay at Hotel") → traveler details → payment → terms → "Book"
Rules:     rate plan determines refundability; member price requires sign-in;
           confirmation email + trips entry (INFERRED)
Evidence:  EVID-015 (medium), corroborated by paymentType filter EVID-003 (high)
```

### 6.3 Sign in / Join (P1)

```text
Steps:     Header "Sign in" → /login?uurl=e3id=redr&rurl=<return> → email →
           (or Google / other providers) → redirect back to rurl
Rules:     one account spans Expedia, Hotels.com, Vrbo; rewards terms acceptance
Evidence:  EVID-009, EVID-007 (high)
```

### 6.4 Rewards earn/redeem (P1)

```text
Earn:      OneKeyCash % of eligible spend (excl. taxes/fees), tier-boosted at VIP Access
           properties; trip elements (hotel night counts) drive tier progression
Redeem:    OneKeyCash applied at checkout on eligible prepaid bookings
Legacy:    10 stamps → 1 reward night (deprecated; conversion into OneKeyCash)
States:    pending → available after stay completes (up to 3 days pay-now / 35 days pay-later)
Evidence:  EVID-005, EVID-016, EVID-017 (high)
```

---

## 7. Feature Inventory

| Feature | Description | Workflow | Dependencies | Evidence | Confidence |
|---|---|---|---|---|---|
| Search wizard | Destination + dates + travelers + rooms | Search | Autocomplete service | EVID-003 | High |
| Filters (9 families) | Popular, amenities, payment, cancellation, property type, accessibility, traveler type, meal plan, rewards | Search | Inventory metadata | EVID-003 | High |
| Sort | Recommended / price ↑↓ / rating / distance + disclosure | Search | Ranking service | EVID-003, EVID-015 | High |
| Map view | Static/interactive map, `mapBounds` param | Search | Google Maps | EVID-003, EVID-012 | High |
| Compare (≤5) | Side-by-side price/rating/amenities | Compare | `shared-ui-retail-lodging-compare` | EVID-003, EVID-013, EVID-020 | High |
| Save to Trips | Per-card save; named trips | Save | Auth | EVID-003, EVID-007, EVID-018 | High |
| Member Prices | Struck-through member discount (10%+) | Monetization | Auth, supplier rates | EVID-003, EVID-005 | High |
| Secret Prices | Signed-in/email price unlock (legacy, purple badge) | Monetization | Auth | EVID-015 | Low |
| Pay later / pay at hotel | Rate-plan payment choice | Book | Supplier terms | EVID-003, EVID-015 | High |
| Refundability filters | Fully refundable property / free cancellation labels | Search/Book | Rate metadata | EVID-003, EVID-015 | High |
| One Key rewards | OneKeyCash, trip elements, tiers | Retention | Ledger service | EVID-005, EVID-016 | High |
| Stamps (legacy) | 10 nights → reward night | Retention | Deprecated | EVID-017 | High |
| Gift cards | Buy/check/combine | Monetization | Payment | EVID-010 | Medium |
| Co-branded cards | One Key credit cards | Monetization | Bank partner | EVID-011 | Low |
| Deals hub | Member-only offers + editorial + FAQ | Acquisition | Merch system | EVID-006 | High |
| Virtual agent | Bot for booking lookup in support | Support | service.hotels.com | EVID-018 | Medium |
| Price tracking | Track price for drops | Retention | Not observed live | EVID-016 | Low |

---

## 8. Business Logic

**Rule — Result ranking ("Recommended").**
Trigger: search submit/sort change. Logic: proprietary multi-factor ranking (price, reviews, location, commercial compensation). Observed: default sort label + "How our sort order works" disclosure + promoted placements ("You were interested…", "Ad" markers). Evidence: EVID-003, EVID-015. Confidence: HIGH (behavior), weights UNKNOWN.

**Rule — Member Price eligibility.**
Trigger: render price for signed-in member. Logic: struck-through standard rate vs member rate; availability per property/date; tier may modify depth. Observed: filter "Member Prices — Instant savings of 10%"; One Key page "Save 10% or more". Evidence: EVID-003, EVID-005, EVID-016. Confidence: HIGH.

**Rule — OneKeyCash earning.**
Trigger: completed eligible booking while signed in. Logic: % of spend excluding taxes/fees (base ~2% hotels per program docs; tier multipliers on VIP Access); pending → available after stay. Evidence: EVID-016. Confidence: HIGH.

**Rule — Trip elements → tier.**
Trigger: each qualifying element ≥ $25 (per program terms). Silver 5 / Gold 15 / Platinum 30 within a year. Evidence: EVID-016. Confidence: HIGH.

**Rule — Legacy stamps.**
10 eligible nights → 1 reward night valued at average nightly rate of the 10 stamps (excl. taxes). Deprecated/converted to OneKeyCash. Evidence: EVID-017, conversion confirmed EVID-005. Confidence: HIGH (CON-001 resolved).

**Rule — Pay-now vs pay-later.**
Trigger: room/rate selection. Logic: two rate plans per room; pay-later often pairs with free cancellation until deadline; pay-now may be cheaper and is required for OneKeyCash redemption. Evidence: EVID-003 (paymentType filter), EVID-015, EVID-016. Confidence: HIGH.

**Rule — Rewards require sign-in before booking.**
Evidence: EVID-016 ("must be a Member prior to making an Eligible Booking"). Confidence: HIGH.

**Rule — Maldives pricing stack (destination-specific, for rebuild).**
`total = (villa + mealPlan) × 1.10 (service charge) × 1.17 (TGST) + GreenTax($6|12 ppn × guests × nights) + transfer(RT per person × travelers)`. Seaplane resorts enforce arrival < 15:00 / daylight-only transfers; transfer type is fixed by atoll (no user choice). Evidence: EVID-021. Confidence: HIGH (external domain sources).

---

## 9. Data Model

Logical entities (API-derived / inferred — not literal DB tables):

```text
User ── owns ── Trip (named) ── contains ── SavedItem(property)
User ── has ── OneKeyAccount (tier, oneKeyCash balances: pending|available, tripElements)
Search ── resolves to ── Destination (regionId | destinationId | lat/long, name)
Search ── has ── DateRange, Occupancy (rooms, adults, children[])
Search ── returns ── Property[] ── has ── Room[], RatePlan[], Amenity[], ReviewSummary,
                                        Location(lat/long), Media[], MealPlan[], Policies
RatePlan ── has ── paymentType (pay_now | pay_later), refundability, priceBreakdown
Booking/Itinerary ── links ── User, Property, Room, RatePlan, Travelers, PriceBreakdown,
                              status(confirmed|cancelled|completed), confirmation code
Offer/Deal ── applies to ── Property/RatePlan (member price, promo)
GiftCard, CoBrandedCard (financial products)
```

Key observed field vocabulary (search URL + EGDS fields): `destination`, `regionId`, `latLong`, `startDate`, `endDate`, `adults`, `children`, `rooms`, `sort`, `amenities`, `mapBounds`, `useRewards`, `trv_star/rating/price`, `selected`, `siteid`, `locale`, `theme`, `userIntent`. Evidence: EVID-003 + Wayback CDX records. Confidence: HIGH.

---

## 10. API / Data Flow Map

| API ID | Method/Endpoint (class) | Purpose | Trigger | Auth | Evidence | Confidence |
|---|---|---|---|---|---|---|
| `api-graphql-experience` | POST GraphQL (gateway path unobserved) | Page/experience data for all screens | Page load, search, interactions | Session/anonymous | EVID-012/013 (`graphql.js`, `blossom-*` bundles), EVID-019 | HIGH (existence), endpoint UNKNOWN |
| `api-search` | GraphQL query (lodging property search) | Result list, counts, prices, map pins | Search submit/filter/sort | Anonymous | EVID-003, EVID-013 | HIGH |
| `api-autocomplete` | Destination suggest (EGDS LocationField) | Resolve text → region/airport/lat-long | Typing in "Where to?" | Anonymous | EVID-003 | HIGH (behavior) |
| `api-media` | `images.trvl-media.com/lodging/{ids}/{hash}.jpg?impolicy=resizecrop&rw=&ra=` | Property photos | Render | Anonymous | EVID-012 | HIGH |
| `api-maps` | `maps.googleapis.com/maps/api/staticmap` | Results map | Map view | Key server-side | EVID-012 | HIGH |
| `api-error-beacon` | `GET /cl/2x2.gif?action=logErrors` | Client error logging | JS errors | Anonymous | EVID-012 | HIGH |
| `api-identity` | `/login?uurl=…&rurl=…` (+ One Identity providers) | Sign-in/sign-up | Header sign-in | — | EVID-009 | HIGH |
| `api-booking` | Not observed | Create reservation | Checkout submit | Session | EVID-015 | MEDIUM (documented flow only) |

**Data flow (reconstructed):**

```text
UI (React shared-ui module)
  → GraphQL experience layer (query from module)
  → Experience API gateway → micro-services (search / pricing / identity / booking)
  → domain logic → persistence + supplier (Expedia Group inventory) → response
  → UI render; media via trvl-media CDN; maps via Google; errors via pixel beacon
```

---

## 11. Technical Architecture

```text
Client (React PWA, module federation: lotus-home-ui | blossom-*-ui | shopping-pwa)
   ↓
Edge: DataDome bot wall (observed 429 "Bot or Not?") + CDN (travel-assets.com, cdn-hotels.com)
   ↓
Frontend SSR/CSR shell (hotels.com) ── GraphQL experience layer (graphql.js clients)
   ↓
Experience API gateway (GraphQL federation — per EVID-019)
   ↓
Application micro-services (search, pricing, inventory, identity, booking, rewards)
   ↓
Persistence + caches (technology UNKNOWN) + supplier connectivity (Expedia Group supply)
   ↓
External: Google Maps, image CDN, Branch (app deep links), support portal, ad/analytics, payment
```

| Component | Observed evidence | Interpretation | Alternative | Confidence |
|---|---|---|---|---|
| React PWA w/ shared modules | bundle names, hook naming, `shopping-pwa` | Module-based SPA architecture | — | HIGH |
| GraphQL experience layer | `graphql.js` bundles, EG blog EVID-019 | Single graph API for web/app | REST+GraphQL mix | HIGH |
| SDUI / named slots | `data-stid` taxonomy, EGDS fields | Server-driven assembly | Pure client routing of components | HIGH |
| Edge bot management | 429 + captcha-delivery.com | DataDome | Other vendor on same domain | HIGH |
| JVM/Kotlin microservices | EG engineering publications | Backend stack | Not directly observed for hotels.com | MEDIUM |
| Kubernetes deployment | EG publication (Hotels.com platform) | Infra | — | MEDIUM |
| Google Maps | staticmap request | Maps integration | — | HIGH |
| Pixel error logging | `/cl/2x2.gif?action=logErrors` | Client telemetry | — | HIGH |

---

## 12. UI / UX System

**Screens observed (archived):** Home, Search results, Deals, Trips (signed-out), Login, Gift cards, Vacation rentals, Editorial landing, One Key. **Not observed:** Property detail (web), checkout, authenticated trips.

**Visual system (from renders):** dense-but-scannable list layout; card-based results with photo, name, location, rating, price block, policy labels; left sidebar filter fieldsets; top toolbar with map/compare/sort; promo carousels on home; consistent EGDS header (utility bar + main nav + search strip). Details: `.reverse-engineering/evidence/screenshots/`.

**Interaction system:** autocomplete location field; date range picker; stepper travelers; removable filter chips; sort menu with explanation link; save (heart) per card; compare tray; currency picker (USD); sticky search form on interior pages (`search-form-sticky`).

**State system:** signed-out trips empty state ("Your next adventure awaits when you sign in!" + "Sign in or create an account"); archived search partially hydrated (title empty → hydration-dependent titles); 503 "Site temporarily unavailable" error page (EVID-011); loading placeholders observed (`managed-banner-loading-placeholder`, `render-status--static|hydrated`). Empty/error/loading conventions are therefore: placeholder blocks → `render-status` hydration markers.

**Component inventory (named, observed):** `search-form-with-alternateDestination`, `EGDSSearchFormLocationField-*`, `EGDSDateRangePicker-*`, `rooms-traveler-selector-menu-container`, `lodging-card-responsive`, `outlined-save-button`, `property-listing-results`, `results-header`, `desktop-sidebar`, `onekeybanner-toggle`, `shared-ui-voice-of-the-customer`, `carousel-wrapper/container/item`, `managed-banner-*`.

---

## 13. Authentication & Authorization

- **Methods:** email-first single field + submit; Google sign-in; "Other ways to sign in" (additional IdPs) — EVID-009.
- **Model:** One Identity — one account spans Expedia, Hotels.com, Vrbo — EVID-009, EVID-005.
- **Session:** cookie/token-based, mechanics not observed (no login performed). Sign-in carries return URL (`uurl=e3id=redr&rurl=…`) — EVID-009.
- **Authorization:** `/trips` and rewards require sign-in; anonymous users are redirected to login with `rurl` preserved — EVID-007. Member prices and OneKeyCash require membership before booking — EVID-016.
- **No bypass attempted** (skill safety boundary).

---

## 14. Monetization

```text
Anonymous browse → (member price / deals hub) → Sign-in prompt → Member Price unlocked
Usage → Booking → commission to Expedia Group (INFERRED, marketplace standard)
Booking (signed in) → OneKeyCash pending → stay completes → available → future discount
Trip elements accumulate → Silver/Gold/Platinum → deeper discounts + perks → retention
Gift cards / co-branded cards → prepaid float + interchange (EVID-010, EVID-011)
```

- Plans/trials: none (free membership) — no paywall observed (EVID-018 "No Paywall").
- Observed discount surfaces: "Members save up to 20%" carousel (home), "Member Prices — instant savings of 10%" (filter), deals hub with member-only offers — EVID-002, EVID-003, EVID-006.
- Cancellation/refund: policy-driven per rate plan; disputes handled via support (third-party reports) — EVID-015.

---

## 15. Integration & Dependency Map

| Integration | Purpose | Evidence | Confidence |
|---|---|---|---|
| DataDome (captcha-delivery.com) | Bot management at edge | EVID-001, network log | High |
| Google Maps | Results map | EVID-012 | High |
| Expedia Group media CDN (trvl-media, travel-assets) | Images + JS bundles | EVID-012 | High |
| Branch (hotels.app.link) | App deep links/attribution | EVID-002 | High |
| Google sign-in (+ other IdPs) | Auth | EVID-009 | High |
| Directword.io | Feedback survey | EVID-002 | High |
| Payment processors | Card/PayPal (documented) | EVID-015, EVID-015b(9travel) | Medium |
| Co-branded card issuer | One Key cards | EVID-011 | Low |
| Ad/measurement networks | Merchandising/SEM (rffrid/mdpcid params) | CDX records, EVID-012 | Medium |

---

## 16. Technology Stack

| Technology | Role | Evidence | Confidence |
|---|---|---|---|
| React (+ hooks/TypeScript) | Web UI | Bundle names, hook naming, EG job posts | High |
| PWA / SPA (shopping-pwa, lotus, blossom bundles) | Client apps | EVID-012/013 | High |
| GraphQL (Apollo-style client) | Experience API | `graphql.js`, EVID-019 | High |
| Module federation / shared-ui packages | Component distribution | `shared-ui-*` bundles | High |
| EGDS design system + design tokens | UI language | `EGDS*` fields, EVID-019 | High |
| Edge CDN + DataDome | Delivery/security | EVID-001/012 | High |
| Google Maps static | Maps | EVID-012 | High |
| JVM/Kotlin (Spring), gRPC, Kubernetes/Helm | Backend (brand platform) | EVID-019 | Medium (org-level, not per-file) |
| Adobe/EG analytics + pixel beacons | Telemetry | `/cl/2x2.gif`, `mdpcid` params | Medium |

---

## 17. Reconstruction Specification — Maldives-Only OTA

> Classification legend: `ORIGINAL_OBSERVED` (verified on target/archives), `ORIGINAL_INFERRED` (multi-source supported), `RECOMMENDED_FOR_REBUILD` (my recommendation for the new product), `UNKNOWN`.

### 17.1 Product framing

A single-destination OTA for Maldives resorts where **transfer logistics and meal plans are first-class**, not add-ons — the key structural difference from generic Hotels.com (`ORIGINAL_INFERRED` from EVID-003 vs EVID-021).

### 17.2 Functional requirements

| # | Requirement | Classification | Basis |
|---|---|---|---|
| FR-1 | Search wizard: atoll/island destination, dates, adults/children/rooms | ORIGINAL_OBSERVED | EVID-003 |
| FR-2 | Results list with cards: photo, stars, guest rating, transfer badge, meal-plan badge, total price incl. taxes/transfers | RECOMMENDED_FOR_REBUILD (tax-inclusive display fixes industry pain, EVID-021) | EVID-003, EVID-021 |
| FR-3 | Filters: atoll, price, stars, rating, transfer type, meal plan, villa type, amenities, free cancellation | ORIGINAL_OBSERVED (pattern) + Maldives extensions | EVID-003, EVID-021 |
| FR-4 | Sort: Featured/price/rating/distance + disclosure | ORIGINAL_OBSERVED | EVID-003 |
| FR-5 | Property detail: gallery, overview, amenities, reviews, rooms with rate plans (refundable/pay-later vs prepay), sticky price summary | ORIGINAL_OBSERVED (pattern) | EVID-013, EVID-015, EVID-018 |
| FR-6 | Checkout wizard: travelers → payment (mock) → review → confirmation; price breakdown showing TGST/service charge/green tax/transfer | ORIGINAL_OBSERVED (pattern) + Maldives extensions | EVID-015, EVID-021 |
| FR-7 | Accounts: sign-in/sign-up (mock local auth), member prices, trips/wishlist, booking history | ORIGINAL_OBSERVED | EVID-007, EVID-009 |
| FR-8 | Rewards lite: stamps per night (10 → credit) + cashback balance (simplified One Key) | ORIGINAL_OBSERVED (legacy mechanics) | EVID-016, EVID-017 |
| FR-9 | Arrival-time rule: warn/block same-day seaplane connections landing after 15:00 | RECOMMENDED_FOR_REBUILD | EVID-021 |
| FR-10 | Deals hub with member-only offers | ORIGINAL_OBSERVED | EVID-006 |
| FR-11 | Compare (≤3) side-by-side | ORIGINAL_OBSERVED | EVID-003, EVID-020 |
| FR-12 | Empty/loading/error states incl. signed-out trips state and error page | ORIGINAL_OBSERVED | EVID-007, EVID-011 |

### 17.3 Frontend

- React + TypeScript + router; component set mapped to observed slots: `SearchStrip`, `LodgingCard`, `FilterSidebar`, `SortMenu`, `CompareTray`, `SaveButton`, `PriceBreakdown`, `StickyPriceSummary` — `RECOMMENDED_FOR_REBUILD` mirroring `data-stid` taxonomy (`ORIGINAL_OBSERVED`).
- Server-driven styling via design tokens — `RECOMMENDED_FOR_REBUILD` (EG pattern `ORIGINAL_OBSERVED`).

### 17.4 Backend / domain model

Entities: `User, Session, Property(Island), Atoll, RoomType, RatePlan, MealPlan, Transfer, PriceQuote, Booking, Trip, RewardsAccount, Offer`. Quote engine implements the Maldives tax stack (`ORIGINAL_INFERRED` EVID-021). Booking lifecycle state machine (§17.8).

### 17.5 APIs

`POST /api/search`, `GET /api/properties/:slug`, `POST /api/quote`, `POST /api/bookings`, `GET /api/bookings/:id`, `POST /api/auth/*`, `GET /api/offers`. GraphQL is `ORIGINAL_OBSERVED` for Hotels.com but **REST is `RECOMMENDED_FOR_REBUILD`** at this scale (simpler; single-destination dataset).

### 17.6 Auth/authorization

Mock credentials with localStorage session; member gates on price/rewards/trips — mirrors observed behavior (`ORIGINAL_OBSERVED` pattern).

### 17.7 State management & storage

Client store for search params (URL-encoded like Hotels.com: `destination, startDate, endDate, adults, children, rooms, sort, filters` — `ORIGINAL_OBSERVED`); persistent bookings/rewards in localStorage (`RECOMMENDED_FOR_REBUILD` — no DB in scope).

### 17.8 State machine (booking)

```text
Draft → QuoteIssued → PendingPayment → Confirmed → (CheckIn → Completed → RewardPosted)
                    ↘ CancelRequested → Cancelled (refund policy applies)
Failure: PaymentFailed → Draft (retry); SeaplaneWindowViolation → blocked at quote
```

### 17.9 Background jobs / queues / caching / search / notifications / payments / infra

All `RECOMMENDED_FOR_REBUILD`-lite or `UNKNOWN` for original: none required for a client-side demo except simulated email confirmation (console/localStorage). Original likely has async reward posting (pending → available) — `ORIGINAL_OBSERVED` in terms (EVID-016).

### 17.10 Reconstruction levels

- **L1 Functional clone:** anonymous search → filter → detail → mock checkout → confirmation, with Maldives pricing math (FR-1…6, 9, 12).
- **L2 Product-equivalent:** + accounts, member prices, trips, rewards ledger, compare, deals, cancellation flow (FR-7…11).
- **L3 Production-grade:** real GraphQL gateway, inventory connectors (B2B XML/API), payment PSP, PCI scope, email/SMS, observability, CDN, autoscale, fraud/bot management, rate parity rules — none observable at target from this network (`UNKNOWN` where noted).

---

## 18. Build Prioritization (implementation handoff)

| ID | Feature | Priority | Dependencies | Business rules | Related screens | Related APIs | Related entities | Evidence | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| P0-1 | Search wizard + URL param contract | P0 | dataset | dates/guests required | Home, Search | search | Search, Destination | EVID-003 | High |
| P0-2 | Results list + card anatomy | P0 | P0-1 | tax-inclusive display | Search | search | Property | EVID-003 | High |
| P0-3 | Filters + sort | P0 | P0-2 | 9 filter families + Maldives extensions | Search | search | Property | EVID-003 | High |
| P0-4 | Property detail + rooms/rate plans | P0 | P0-2 | refundability/prepay | Detail | property, quote | Room, RatePlan | EVID-013/015 | High |
| P0-5 | Quote engine (TGST+SC+GreenTax+transfer+meal) | P0 | P0-4 | 1.10×1.17 stack; $6/12 ppn | Detail, Checkout | quote | PriceQuote | EVID-021 | High |
| P0-6 | Checkout wizard + confirmation | P0 | P0-5 | seaplane arrival rule | Checkout, Confirmation | bookings | Booking | EVID-015 | Medium |
| P0-7 | Core layout/nav/empty-error states | P0 | — | signed-out trips gate | All | — | — | EVID-002/007/011 | High |
| P1-1 | Mock auth + member prices | P1 | P0-2 | sign-in before discount | Login | auth | User | EVID-009 | High |
| P1-2 | Trips/save + booking history | P1 | P1-1 | auth-gated | Trips | bookings | Trip | EVID-007/018 | High |
| P1-3 | Rewards (stamps + cashback) | P1 | P1-1 | 10 nights → credit; pending→available | Account | rewards | RewardsAccount | EVID-016/017 | High |
| P1-4 | Compare ≤3 | P1 | P0-2 | max 3 | Search | — | — | EVID-003/020 | High |
| P1-5 | Deals hub | P1 | P0-2 | member-only gating | Deals | offers | Offer | EVID-006 | High |
| P2-1 | Map view | P2 | P0-2 | — | Search | — | — | EVID-003 | High |
| P2-2 | Cancellation flow | P2 | P1-2 | policy-driven refund | Trips | bookings | Booking | EVID-015 | Medium |
| P2-3 | Reviews section | P2 | P0-4 | — | Detail | — | Review | EVID-013 | Medium |
| P3-1 | Gallery polish/animations | P3 | P0-4 | — | Detail | — | — | EVID-018 | Medium |
| P3-2 | Currency/locale picker | P3 | — | USD fixed in demo | Header | — | — | EVID-003 | High |

---

## 19. Unknowns & Open Questions

1. **Property detail page (web) anatomy** — no archived snapshot; modeled from shared-ui bundles + app teardown + guides (PARTIALLY_EXPLORED).
2. **Live GraphQL schemas/endpoints** — bot wall blocks capture; only bundle-level proof exists.
3. **Checkout visual steps on current build** — documented by third parties only (medium confidence).
4. **Authenticated UIs** (trips populated, account, rewards dashboard) — no credentials; not accessed.
5. **Ranking algorithm weights** behind "Recommended" — proprietary, undisclosed.
6. **Payment/PCI architecture** — UNKNOWN (standard OTA hypothesis only).
7. **Mobile app internals** — third-party screen teardown only; no binary analysis.
8. **Kotlin/Spring/gRPC/Kubernetes** — org-level publications; per-service attribution for hotels.com is INFERRED (medium).

---

## 20. Confidence Assessment

| Area | Confidence | Basis |
|---|---|---|
| Product surface & navigation | High | Multiple archived renders |
| Search/filter/sort/merchandising | High | Full DOM extraction EVID-003 |
| Rewards & monetization rules | High | Official T&Cs + pages |
| Auth pattern | High | Archived login/trips |
| Architecture (client + GraphQL layer) | High | Bundle forensics + EG publications |
| Backend specifics | Medium | Publications, not target source |
| Property detail / checkout | Medium | Third-party guides + bundles |
| Live API payloads | None (blocked) | EVID-001 |
| Maldives pricing rules | High | Multiple specialist sources |

---

## 21. Evidence Appendix

| ID | Artifact | Path / Source |
|---|---|---|
| EVID-001 | Live target 429 "Bot or Not?" (screenshot + extraction) | `evidence/screenshots/EVID-001-direct-home-botwall.png`, `evidence/notes/EVID-001-direct-home-botwall.json` |
| EVID-002 | Archived home render | `evidence/screenshots/EVID-002-wb-home.png` + notes |
| EVID-003 | Archived search results render (filters/sort/cards) | `evidence/screenshots/EVID-003-wb-search-results.png` + notes |
| EVID-004 | Accommodation editorial landing | `evidence/screenshots/EVID-004-wb-accommodation-landing.png` + notes |
| EVID-005 | One Key rewards page | `evidence/screenshots/EVID-005-wb-one-key.png` + notes |
| EVID-006 | Deals hub | `evidence/screenshots/EVID-006-wb-deals.png` + notes |
| EVID-007 | Trips signed-out state | `evidence/screenshots/EVID-007-wb-trips.png` + notes |
| EVID-008 | Vacation rentals landing | `evidence/screenshots/EVID-008-wb-vacation-rentals.png` + notes |
| EVID-009 | Sign-in page | `evidence/screenshots/EVID-009-wb-login.png` + notes |
| EVID-010 | Gift cards | `evidence/screenshots/EVID-010-wb-giftcards.png` + notes |
| EVID-011 | One Key cards 503 error page | `evidence/screenshots/EVID-011-wb-one-key-cards-503.png` + notes |
| EVID-012 | Crawl network logs (hosts, bundles, CDN, maps, beacons) | `evidence/network/crawl-requests.json`, `crawl2-requests.json`, `crawl3-requests.json` |
| EVID-013 | Bundle/module inventory (derived) | `evidence/notes/` crawl indexes + §16 |
| EVID-014 | Structured DOM extractions (stid/EGDS/filters) | `evidence/notes/EVID-00*.json` |
| EVID-015 | Booking flow guide (third party) | upgradedpoints.com guide (web search capture 2026-09-30) |
| EVID-016 | One Key official terms | expedia.com/one-key-terms (web search capture) |
| EVID-017 | Hotels.com Rewards terms (stamps) | Rewards T&Cs PDF (web search capture) |
| EVID-018 | Mobile app UX teardown (56 screens) | screensdesign.com showcase (web search capture) |
| EVID-019 | Expedia Group engineering publications (GraphQL experience layer, Kotlin, SDUI, gRPC/K8s) | Medium/careers/kotlinlang case study (web search capture) |
| EVID-020 | Smart Shopping official page (compare ≤5, AI room recs) | hotels.com/why/smart-shopping (web search capture) |
| EVID-021 | Maldives domain economics (tax stack, meal plans, transfers, seaplane windows) | holiday.com.mv, maldives.com, resort FAQs (web search capture) |
| — | Investigation log | `.reverse-engineering/investigation-log.jsonl` |
| — | Coverage model | `.reverse-engineering/coverage.json` |
| — | Machine-readable model | `product-model.json` |
