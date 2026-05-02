# StarClaim — Product Requirements Document

## Original Problem Statement
Premium e-commerce website for selling and trading named stars. Turkish primary, English secondary. Luxury cosmic aesthetic (deep space black + gold + Cinzel typography). Animated starfield hero, 5-tier pricing, zodiac picker, AI-generated personal stories, marketplace for reselling owned stars, Google-based authentication, gift mode, live social ticker.

URL: starclaim.net
Tagline: "Gökyüzündeki Yerinizi Talep Edin"

## User Personas
1. **Romantic Gifter** — buying a star for partner/parent/friend for an emotional occasion (birthday, anniversary, memorial)
2. **Self-Claimer** — buying a star for themselves to commemorate a life moment (graduation, newborn)
3. **Star Investor** — buying low-tier stars expecting resale uplift via marketplace
4. **Group Buyer** — friends/family buying neighboring stars in the same constellation

## Architecture
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui + lucide-react
- Backend: FastAPI + Motor (async MongoDB)
- Auth: Emergent-managed Google OAuth (session token stored httpOnly cookie, 7-day expiry)
- AI: Claude Sonnet 4.5 via `emergentintegrations` (Emergent Universal LLM Key) for personal star stories
- i18n: Custom lightweight TR/EN dictionary with localStorage persistence

## Implemented (Feb 2026 — MVP)
### Backend (`/app/backend/server.py` + `seed_data.py`)
- `GET /api/` health, `GET /api/stats/overview`, `GET /api/activities/live`
- `GET /api/stars` (filters: tier, constellation, price range, available, sort), `GET /api/stars/constellations`, `GET /api/stars/{id}`
- `POST /api/stars/claim` (auth) — personalize + own, creates order, records activity
- `GET /api/stars/mine/list` (auth) — user dashboard
- `GET /api/marketplace/listings` (auto-computes percent_increase), `POST /api/marketplace/list` (auth)
- `POST /api/ai/story` — Claude Sonnet 4.5 personalized story (TR/EN, occasion-aware)
- `POST /api/auth/session` (exchange Emergent session_id), `GET /api/auth/me`, `POST /api/auth/logout`
- `POST /api/newsletter`
- Seed: 53 stars (10 legendary + 6 zodiac + 7 named + 10 constellation + 20 standard), 6 marketplace listings, 10 activities

### Frontend
- Pages: Home, StarPicker, Marketplace, Stories, About, Dashboard, AuthCallback
- Components: StarCanvas (300+ animated particles + shooting meteors), Navbar (sticky glass), Footer, LiveNotifications (popup), StarCard (tier-styled), CheckoutModal (5-step wizard with real AI story step)
- Homepage sections: Hero with nebula bg + canvas, social ticker marquee, How It Works, Zodiac picker (12 signs linking to filtered picker), 5-tier pricing cards with animated legendary glow, Gift section with 8 occasions, Social Stars (couples/friends/family), Marketplace preview, Testimonials, FAQ accordion, Newsletter
- Tier-specific card borders: legendary=gold glow, zodiac=purple, named=blue, constellation=green, standard=muted
- Fonts: Cinzel (headings), DM Sans (body), Cormorant Garamond italic (quotes/stories)
- TR default with EN toggle (all strings dictionary-backed)
- All interactive elements have `data-testid`

## Testing (Iteration 1)
Backend: 22/22 pytest passed — all endpoints, filters, auth protection, AI story TR+EN, claim flow.
Frontend: Homepage, Stars, Marketplace, Stories, About, Dashboard all load; navbar, language toggle, 12 zodiac IDs, 5 packages, checkout modal, live notification, newsletter all verified.

## Implemented (Feb 2026 — MVP + Production)
### Backend (`/app/backend/`)
- `server.py`, `seed_data.py`, `certificate.py` (ReportLab PDF), `emails.py` (Resend with PDF attachment)
- Endpoints: catalog, marketplace, AI story (Anthropic SDK direct OR Emergent LiteLLM proxy via OpenAI SDK), Emergent Google OAuth, Stripe checkout (`/api/checkout/session`, `/api/checkout/status/{id}`, `/api/webhook/stripe`), `/api/orders/certificate/{id}` PDF re-download
- `payment_transactions` collection with idempotent fulfillment (mark owned + generate PDF + email)
- Server-authoritative pricing (PACKAGE_MULTIPLIER) — frontend cannot manipulate amount

### Frontend
- Pages added: `/payment/success` (polls status), `/payment/cancel`
- CheckoutModal step 4 redirects to Stripe (no fake card form)
- All env-driven, deployable to Netlify

### Deployment artefacts
- `/app/DEPLOY.md` — full step-by-step Render + Netlify + Atlas + Stripe + Resend guide
- `/app/frontend/public/_redirects` — Netlify SPA fallback

## Backlog / Next
### P0
- Real payment integration (deferred: user will add Stripe later with n8n)

### P1
- Marketplace "Buy" transaction flow + 10% commission accounting
- Digital certificate PDF generation (current: preview card only)
- Email delivery (confirmation + gift recipient email)
- User profile edit, owned star sharing links (public view)

### P2
- Physical certificate shipping flow
- AR star-finder (point phone to sky) — app-side
- NFT certificate for Legendary tier
- Admin dashboard to add new stars and manage orders
- Blog CMS for Stories page

## Environment
- `EMERGENT_LLM_KEY` — set in `/app/backend/.env` (Claude Sonnet for stories)
- `MONGO_URL`, `DB_NAME` — preserved defaults
- `REACT_APP_BACKEND_URL` — external preview URL

## Credentials
Google OAuth only. See `/app/memory/test_credentials.md` for mock session instructions.
