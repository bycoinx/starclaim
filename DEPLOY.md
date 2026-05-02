# StarClaim — Production Deployment Guide

## Architecture
- **Frontend**: React (Netlify) — `https://fascinating-florentine-5aace3.netlify.app`
- **Backend**: FastAPI (Render.com) — needs HTTPS public URL
- **Database**: MongoDB Atlas (free M0 cluster)
- **Email**: Resend
- **Payments**: Stripe (test mode now, switch to live when ready)
- **AI Stories**: Anthropic Claude Sonnet 4.5
- **Auth**: Emergent-managed Google OAuth (no setup needed)

---

## STEP 1 — MongoDB Atlas Setup (10 minutes)

1. Go to **https://www.mongodb.com/atlas/database** → **Try Free**
2. Create a free account (Google login is fastest)
3. Create a new project → name it `StarClaim`
4. Click **Build a Database** → choose **M0 FREE** tier
5. Provider: **AWS**, Region: closest to your users (e.g. `eu-central-1` Frankfurt for Turkey)
6. Cluster name: `starclaim-prod` → **Create**
7. Wait ~2 min for cluster to provision

### Create database user
1. **Security → Database Access** → **Add New Database User**
2. Auth method: **Password**
3. Username: `starclaim_app`
4. Password: click **Autogenerate Secure Password** → **COPY IT NOW** (save somewhere safe)
5. Built-in role: **Read and write to any database** → **Add User**

### Allow network access
1. **Security → Network Access** → **Add IP Address**
2. Click **ALLOW ACCESS FROM ANYWHERE** (`0.0.0.0/0`) — necessary because Render's IP rotates
3. Confirm

### Get connection string
1. **Database → Connect** (on your cluster) → **Drivers**
2. Driver: Python, version: 3.12 or later
3. Copy the connection string. It looks like:
   ```
   mongodb+srv://starclaim_app:<password>@starclaim-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=starclaim-prod
   ```
4. **Replace `<password>`** with the password you saved
5. Save this whole string — you'll paste it into Render env var

---

## STEP 2 — Get Required API Keys

### Anthropic (AI stories)
1. https://console.anthropic.com → Sign up / Sign in
2. **API Keys** → **Create Key** → name `StarClaim`
3. Copy the key (starts with `sk-ant-...`) — save it
4. Add billing/credits: minimum $5 buys ~5000 stories

### Resend (email delivery)
1. https://resend.com → Sign up (Google login OK)
2. **API Keys** → **Create API Key** → name `StarClaim`
3. Copy the key (starts with `re_...`) — save it
4. **Optional but recommended**: Add your custom domain at **Domains** for `from: noreply@yourdomain.com` instead of `onboarding@resend.dev`. For now, the default `onboarding@resend.dev` works but **only sends to verified addresses you own** until domain is verified.

### Stripe (payments — test mode)
1. https://dashboard.stripe.com → Sign up / Sign in
2. Make sure **TEST MODE** toggle (top-right) is ON
3. **Developers → API Keys** → reveal **Secret key** (starts with `sk_test_...`)
4. Copy and save
5. Webhook setup (after you have backend URL):
   - **Developers → Webhooks** → **Add endpoint**
   - URL: `https://YOUR-RENDER-URL.onrender.com/api/webhook/stripe`
   - Events: select `checkout.session.completed`
   - Reveal **Signing secret** (starts with `whsec_...`) → save

---

## STEP 3 — Deploy Backend to Render.com

1. Go to **https://dashboard.render.com** → Sign up
2. **New → Web Service** → connect your GitHub repo
3. Settings:
   - **Name**: `starclaim-api`
   - **Region**: closest to MongoDB Atlas region
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free (or Starter $7/mo for no cold starts)

4. Click **Advanced** → **Environment Variables** → add ALL of these:
   ```
   MONGO_URL          = mongodb+srv://starclaim_app:PASSWORD@starclaim-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=starclaim-prod
   DB_NAME            = starclaim
   CORS_ORIGINS       = https://fascinating-florentine-5aace3.netlify.app
   ANTHROPIC_API_KEY  = sk-ant-...
   STRIPE_API_KEY     = sk_test_...
   STRIPE_WEBHOOK_SECRET = whsec_...
   RESEND_API_KEY     = re_...
   SENDER_EMAIL       = StarClaim <onboarding@resend.dev>
   ```
   (No quotes around values in Render UI)

5. **Create Web Service** — first build takes ~3-4 min
6. Once green, copy the URL (e.g. `https://starclaim-api.onrender.com`) — you need it for the next step

7. Now go back to Stripe → Webhooks → edit your endpoint → set URL to `https://starclaim-api.onrender.com/api/webhook/stripe` if you didn't earlier

---

## STEP 4 — Configure Frontend on Netlify

1. **Netlify dashboard** → your site → **Site configuration → Environment variables**
2. Add:
   ```
   REACT_APP_BACKEND_URL = https://starclaim-api.onrender.com
   ```
   (No trailing slash. No quotes.)

3. **Deploys → Trigger deploy → Clear cache and deploy site**
4. Wait ~2 min for rebuild

---

## STEP 5 — Verify End-to-End

Open `https://fascinating-florentine-5aace3.netlify.app` and test:

1. **Homepage loads** with starfield + nebula
2. **Click "Yıldız Al"** → checkout modal opens
3. **Sign in with Google** (Emergent OAuth) → land in Dashboard
4. **Pick a star** → personalize → AI story generates → preview certificate → click "Ödemeyi Tamamla"
5. **Stripe checkout page** opens — use test card `4242 4242 4242 4242`, any future date, any CVC
6. After payment → redirect to `/payment/success` → polls status → shows success card
7. **Check inbox** — certificate PDF arrives via Resend
8. **Dashboard** → owned star appears
9. **Try claiming the same star again** — backend rejects with 400

---

## Cost (per month, real numbers)
- MongoDB Atlas M0: **Free** (512MB, fine for thousands of stars)
- Render Free tier: **Free** (cold start after 15 min idle — Starter $7 fixes it)
- Netlify: **Free** (100GB bandwidth)
- Anthropic Claude: ~**$0.001 per story** (so $1 = 1000 stories)
- Resend: **Free** for first 3000 emails/month
- Stripe: **2.9% + $0.30 per successful charge** (no monthly fee, $0 in test mode)

**Total to start: $0/month** (free tier all the way until first real customer)

---

## Going to Live (Real Stripe payments)
1. Stripe dashboard → flip TEST MODE off → activate account (need business info, bank acct)
2. Get live keys (`sk_live_...`)
3. Update Render env vars with live keys
4. Update Stripe webhook URL to use live mode
5. Test once with a real card (small amount) → refund yourself

---

## Troubleshooting

**Render backend won't boot**: check Render logs → usually missing env var or Atlas IP whitelist

**Frontend 404 on /payment/success after Stripe**: Netlify needs a redirect rule for SPA routing. Add `/app/frontend/public/_redirects`:
```
/*    /index.html   200
```

**Email never arrives**: Resend in unverified-domain mode only sends to your own email. Verify domain in Resend dashboard.

**CORS error in browser console**: confirm `CORS_ORIGINS` on Render exactly matches Netlify URL (no trailing slash)

**Anthropic key in Emergent dev environment**: The bundled `EMERGENT_LLM_KEY` has a tiny shared budget that may be exceeded quickly. For real testing in the Emergent preview, either:
- Top up the Emergent Universal Key (Profile → Universal Key → Add Balance), OR
- Set `ANTHROPIC_API_KEY=sk-ant-...` directly in `/app/backend/.env` — the code prefers this when present and bypasses the proxy entirely.

**"Already claimed" 400 error**: someone (you in another test) already bought that star. Pick another available one.
