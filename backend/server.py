"""
StarClaim backend — FastAPI + MongoDB + Emergent Google Auth + Claude Sonnet AI stories
+ Stripe checkout + Resend email + ReportLab PDF certificate.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from pathlib import Path
from datetime import datetime, timezone, timedelta
import os
import uuid
import logging
import asyncio
import httpx
import anthropic
import stripe
from openai import AsyncOpenAI

from seed_data import STAR_CATALOG, SAMPLE_LISTINGS, SAMPLE_ACTIVITIES
from certificate import generate_certificate
from emails import send_certificate_email

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
# AI key resolution:
#   If ANTHROPIC_API_KEY is set → use Anthropic SDK directly (production / external deploy).
#   Else if EMERGENT_LLM_KEY is set → use Emergent's LiteLLM proxy (OpenAI-compatible) for
#   the dev environment. Both code paths produce text. No proprietary lib in requirements.
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
EMERGENT_PROXY_URL = os.environ.get("INTEGRATION_PROXY_URL", "https://integrations.emergentagent.com") + "/llm"
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
if STRIPE_API_KEY:
    stripe.api_key = STRIPE_API_KEY

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="StarClaim API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("starclaim")


# -------------------- Models --------------------
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime


class Star(BaseModel):
    star_id: str
    code: str  # e.g. "sirius" / "sc-001"
    name: str
    constellation: str
    tier: str  # legendary | zodiac | named | constellation | standard
    price: float
    ra: str
    dec: str
    magnitude: Optional[float] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    custom_name: Optional[str] = None
    personal_message: Optional[str] = None
    occasion: Optional[str] = None
    ai_story: Optional[str] = None
    claimed_at: Optional[datetime] = None
    for_sale: bool = False
    asking_price: Optional[float] = None


class ClaimStarRequest(BaseModel):
    star_id: str
    custom_name: str
    personal_message: str = ""
    occasion: str = "general"
    package: str = "standard"
    gift: bool = False
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    ai_story: Optional[str] = None
    language: str = "TR"


class CheckoutSessionRequest(BaseModel):
    star_id: str
    custom_name: str
    personal_message: str = ""
    occasion: str = "general"
    package: str = "standard"
    gift: bool = False
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    ai_story: Optional[str] = ""
    language: str = "TR"
    origin_url: str  # e.g. https://fascinating-florentine-5aace3.netlify.app


class ListStarRequest(BaseModel):
    star_id: str
    asking_price: float


class MarketplaceCheckoutRequest(BaseModel):
    listing_id: str
    origin_url: str


class StoryRequest(BaseModel):
    star_name: str
    constellation: str
    custom_name: str
    personal_message: Optional[str] = ""
    occasion: str = "general"
    language: str = "TR"


class NewsletterRequest(BaseModel):
    email: EmailStr


# -------------------- Auth helpers --------------------
async def get_session_token(request: Request) -> Optional[str]:
    tok = request.cookies.get("session_token")
    if tok:
        return tok
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    return None


async def get_current_user(request: Request) -> User:
    token = await get_session_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)


async def optional_user(request: Request) -> Optional[User]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


# -------------------- Seed --------------------
async def seed_database():
    if await db.stars.count_documents({}) == 0:
        docs = []
        for s in STAR_CATALOG:
            doc = dict(s)
            doc["star_id"] = doc.get("star_id") or f"star_{uuid.uuid4().hex[:10]}"
            docs.append(doc)
        await db.stars.insert_many(docs)
        logger.info(f"Seeded {len(docs)} stars")

    if await db.listings.count_documents({}) == 0:
        listings = []
        for l in SAMPLE_LISTINGS:
            star = await db.stars.find_one({"code": l["code"]}, {"_id": 0})
            if not star:
                continue
            listings.append({
                "listing_id": f"lst_{uuid.uuid4().hex[:10]}",
                "star_id": star["star_id"],
                "star_code": star["code"],
                "star_name": star["name"],
                "constellation": star["constellation"],
                "tier": star["tier"],
                "original_price": l["original"],
                "asking_price": l["asking"],
                "owner_name": l["owner"],
                "owner_id": None,
                "listed_at": datetime.now(timezone.utc).isoformat(),
                "days_ago": l["days_ago"],
                "hops": l.get("hops", 1),
            })
        if listings:
            await db.listings.insert_many(listings)
            logger.info(f"Seeded {len(listings)} listings")

    if await db.activities.count_documents({}) == 0:
        for a in SAMPLE_ACTIVITIES:
            a["_ts"] = datetime.now(timezone.utc).isoformat()
        if SAMPLE_ACTIVITIES: await db.activities.insert_many([dict(a) for a in SAMPLE_ACTIVITIES])
        logger.info(f"Seeded {len(SAMPLE_ACTIVITIES)} activities")


async def cleanup_demo_data_once():
    """One-time production cleanup: remove seeded demo owners/listings and reset stars."""
    marker_key = "demo_data_cleanup_v2"
    if await db.app_settings.find_one({"key": marker_key}):
        return

    now = datetime.now(timezone.utc).isoformat()
    await db.stars.update_many(
        {},
        {"$set": {
            "owner_id": None,
            "owner_name": None,
            "custom_name": None,
            "personal_message": None,
            "occasion": None,
            "ai_story": None,
            "claimed_at": None,
            "for_sale": False,
            "asking_price": None,
        }},
    )
    await db.listings.delete_many({})
    await db.activities.delete_many({})
    await db.orders.delete_many({})
    await db.payment_transactions.delete_many({})
    await db.marketplace_sales.delete_many({})
    await db.app_settings.update_one(
        {"key": marker_key},
        {"$set": {"key": marker_key, "completed_at": now}},
        upsert=True,
    )
    logger.info("Demo data cleanup completed: all stars reset to available")


@app.on_event("startup")
async def startup():
    await seed_database()
    await cleanup_demo_data_once()


@app.on_event("shutdown")
async def shutdown():
    client.close()


# -------------------- Auth endpoints --------------------
@api.post("/auth/session")
async def auth_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    async with httpx.AsyncClient(timeout=15) as hc:
        r = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = data["email"]
    name = data.get("name", email.split("@")[0])
    picture = data.get("picture")
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    expires = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    return {"user_id": user_id, "email": email, "name": name, "picture": picture}


@api.get("/auth/me")
async def auth_me(user: User = Depends(get_current_user)):
    return user.model_dump()


@api.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = await get_session_token(request)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# -------------------- Stars --------------------
@api.get("/stars")
async def list_stars(
    tier: Optional[str] = None,
    constellation: Optional[str] = None,
    available: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: str = "price_asc",
    limit: int = 200,
):
    q = {}
    if tier and tier != "all":
        q["tier"] = tier
    if constellation and constellation != "all":
        q["constellation"] = constellation
    if available is True:
        q["owner_id"] = None
        q["owner_name"] = None
    if min_price is not None or max_price is not None:
        q["price"] = {}
        if min_price is not None:
            q["price"]["$gte"] = min_price
        if max_price is not None:
            q["price"]["$lte"] = max_price
        if not q["price"]:
            q.pop("price")

    sort_map = {
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "name": [("name", 1)],
        "tier": [("tier", 1), ("price", -1)],
    }
    cur = db.stars.find(q, {"_id": 0}).sort(sort_map.get(sort, [("price", 1)])).limit(limit)
    return await cur.to_list(limit)


@api.get("/stars/constellations")
async def list_constellations():
    cons = await db.stars.distinct("constellation")
    return sorted(cons)


@api.get("/stars/{star_id}")
async def get_star(star_id: str):
    s = await db.stars.find_one({"star_id": star_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Star not found")
    return s


@api.post("/stars/claim")
async def claim_star(body: ClaimStarRequest, user: User = Depends(get_current_user)):
    star = await db.stars.find_one({"star_id": body.star_id}, {"_id": 0})
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")
    if star.get("owner_id"):
        raise HTTPException(status_code=400, detail="Star already claimed")

    update = {
        "owner_id": user.user_id,
        "owner_name": user.name,
        "custom_name": body.custom_name,
        "personal_message": body.personal_message,
        "occasion": body.occasion,
        "claimed_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.stars.update_one({"star_id": body.star_id}, {"$set": update})

    # Record order
    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    await db.orders.insert_one({
        "order_id": order_id,
        "user_id": user.user_id,
        "star_id": body.star_id,
        "star_code": star["code"],
        "package": body.package,
        "amount": star["price"],
        "gift": body.gift,
        "recipient_name": body.recipient_name,
        "recipient_email": body.recipient_email,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Record activity
    await db.activities.insert_one({
        "activity_id": f"act_{uuid.uuid4().hex[:10]}",
        "type": "claim",
        "user_name": user.name.split(" ")[0] + " " + (user.name.split(" ")[-1][0] + "." if len(user.name.split()) > 1 else ""),
        "star_name": star["name"],
        "constellation": star["constellation"],
        "_ts": datetime.now(timezone.utc).isoformat(),
    })

    updated = await db.stars.find_one({"star_id": body.star_id}, {"_id": 0})
    return {"order_id": order_id, "star": updated}


@api.get("/stars/mine/list")
async def my_stars(user: User = Depends(get_current_user)):
    cur = db.stars.find({"owner_id": user.user_id}, {"_id": 0}).sort([("claimed_at", -1)])
    stars = await cur.to_list(200)
    order_docs = await db.orders.find(
        {"user_id": user.user_id},
        {"_id": 0, "order_id": 1, "star_id": 1, "created_at": 1},
    ).sort([("created_at", -1)]).to_list(500)
    order_by_star = {}
    for order in order_docs:
        order_by_star.setdefault(order["star_id"], order["order_id"])
    for star in stars:
        star["order_id"] = order_by_star.get(star["star_id"])
    return stars


# -------------------- Marketplace --------------------
@api.get("/marketplace/listings")
async def get_listings(limit: int = 50):
    cur = db.listings.find({"status": {"$ne": "sold"}}, {"_id": 0}).sort([("listed_at", -1)]).limit(limit)
    rows = await cur.to_list(limit)
    for r in rows:
        orig = r.get("original_price") or 1
        r["percent_increase"] = round((r["asking_price"] - orig) / orig * 100)
    return rows


@api.post("/marketplace/list")
async def list_on_marketplace(body: ListStarRequest, user: User = Depends(get_current_user)):
    star = await db.stars.find_one({"star_id": body.star_id}, {"_id": 0})
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")
    if star.get("owner_id") != user.user_id:
        raise HTTPException(status_code=403, detail="You do not own this star")
    if body.asking_price < 1:
        raise HTTPException(status_code=400, detail="Asking price must be at least $1")
    existing = await db.listings.find_one({"star_id": body.star_id, "status": {"$ne": "sold"}}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Star is already listed")
    listing = {
        "listing_id": f"lst_{uuid.uuid4().hex[:10]}",
        "star_id": star["star_id"],
        "star_code": star["code"],
        "star_name": star["name"],
        "constellation": star["constellation"],
        "tier": star["tier"],
        "original_price": star["price"],
        "asking_price": body.asking_price,
        "owner_name": user.name,
        "owner_id": user.user_id,
        "listed_at": datetime.now(timezone.utc).isoformat(),
        "days_ago": 0,
        "hops": 1,
        "status": "active",
    }
    await db.listings.insert_one(listing)
    await db.stars.update_one(
        {"star_id": body.star_id},
        {"$set": {"for_sale": True, "asking_price": body.asking_price}},
    )
    listing.pop("_id", None)
    return listing


async def _process_paid_marketplace_purchase(transaction: dict) -> None:
    """Transfer ownership after a paid marketplace checkout."""
    listing_id = transaction["listing_id"]
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing or listing.get("status") == "sold":
        await db.payment_transactions.update_one(
            {"session_id": transaction["session_id"]},
            {"$set": {"status": "fulfilled", "fulfilled_at": datetime.now(timezone.utc).isoformat()}},
        )
        return

    buyer_id = transaction.get("user_id")
    buyer_name = transaction.get("user_name") or "StarClaim Owner"
    amount = float(transaction["amount"])
    commission = round(amount * 0.10, 2)
    seller_amount = round(amount - commission, 2)

    await db.stars.update_one(
        {"star_id": listing["star_id"]},
        {"$set": {
            "owner_id": buyer_id,
            "owner_name": buyer_name,
            "for_sale": False,
            "asking_price": None,
        }},
    )
    await db.listings.update_one(
        {"listing_id": listing_id},
        {"$set": {
            "status": "sold",
            "sold_at": datetime.now(timezone.utc).isoformat(),
            "buyer_id": buyer_id,
            "buyer_name": buyer_name,
            "sale_price": amount,
            "platform_commission": commission,
            "seller_amount": seller_amount,
        }},
    )
    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    await db.orders.insert_one({
        "order_id": order_id,
        "session_id": transaction["session_id"],
        "user_id": buyer_id,
        "star_id": listing["star_id"],
        "star_code": listing["star_code"],
        "package": "marketplace",
        "amount": amount,
        "gift": False,
        "marketplace_listing_id": listing_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    sale_id = f"sale_{uuid.uuid4().hex[:12]}"
    await db.marketplace_sales.insert_one({
        "sale_id": sale_id,
        "listing_id": listing_id,
        "session_id": transaction["session_id"],
        "star_id": listing["star_id"],
        "seller_id": listing.get("owner_id"),
        "seller_name": listing.get("owner_name"),
        "buyer_id": buyer_id,
        "buyer_name": buyer_name,
        "amount": amount,
        "platform_commission": commission,
        "seller_amount": seller_amount,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.activities.insert_one({
        "activity_id": f"act_{uuid.uuid4().hex[:10]}",
        "type": "marketplace_sale",
        "user_name": buyer_name.split()[0] if buyer_name else "Anonymous",
        "star_name": listing["star_name"],
        "constellation": listing["constellation"],
        "_ts": datetime.now(timezone.utc).isoformat(),
    })
    await db.payment_transactions.update_one(
        {"session_id": transaction["session_id"]},
        {"$set": {
            "status": "fulfilled",
            "fulfilled_at": datetime.now(timezone.utc).isoformat(),
            "sale_id": sale_id,
            "order_id": order_id,
        }},
    )


@api.post("/marketplace/checkout/session")
async def create_marketplace_checkout_session(body: MarketplaceCheckoutRequest, request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    user = await get_current_user(request)
    listing = await db.listings.find_one({"listing_id": body.listing_id, "status": {"$ne": "sold"}}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("owner_id") == user.user_id:
        raise HTTPException(status_code=400, detail="You cannot buy your own listing")

    amount = round(float(listing["asking_price"]), 2)
    origin = body.origin_url.rstrip("/")
    try:
        session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            mode="payment",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"StarClaim Marketplace · {listing['star_name']}",
                        "description": f"{listing['constellation']} · resale listing",
                    },
                    "unit_amount": int(round(amount * 100)),
                },
                "quantity": 1,
            }],
            success_url=f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin}/payment/cancel",
            metadata={"type": "marketplace", "listing_id": body.listing_id, "star_id": listing["star_id"]},
            customer_email=user.email,
        )
    except Exception as e:
        logger.exception("Stripe marketplace session creation failed")
        raise HTTPException(status_code=500, detail=f"Stripe error: {e}")

    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "payment_intent": session.payment_intent,
        "type": "marketplace",
        "status": "pending",
        "payment_status": "unpaid",
        "amount": amount,
        "currency": "usd",
        "listing_id": body.listing_id,
        "star_id": listing["star_id"],
        "star_code": listing["star_code"],
        "user_id": user.user_id,
        "user_email": user.email,
        "user_name": user.name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.id}


# -------------------- AI Story --------------------
@api.post("/ai/story")
async def ai_story(body: StoryRequest):
    if not ANTHROPIC_API_KEY and not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="No AI key configured (ANTHROPIC_API_KEY or EMERGENT_LLM_KEY)")

    lang = body.language.upper()
    if lang == "TR":
        system = (
            "Sen StarClaim adlı premium yıldız isimlendirme platformunun duygusal ve şiirsel hikaye yazarısın. "
            "Kullanıcının seçtiği yıldıza, özel anlamına ve anısına dair 130-170 kelimelik, büyüleyici bir Türkçe hikaye yaz. "
            "Üslubun şiirsel, sıcak, kozmik imgelerle dolu olsun. Klişelerden kaçın. Hikayeyi kişisel hissettir. "
            "Hikayeyi 3-4 kısa paragrafa böl. Başlık yazma, sadece hikaye metnini döndür."
        )
        user_text = (
            f"Yıldız: {body.star_name} ({body.constellation} takımyıldızı)\n"
            f"Kullanıcının verdiği özel isim: {body.custom_name}\n"
            f"Özel vesile: {body.occasion}\n"
            f"Kişisel mesaj: {body.personal_message or '—'}\n\n"
            f"Bu yıldıza ithaf edilen kişisel, duygusal ve unutulmaz bir hikaye yaz."
        )
    else:
        system = (
            "You are the emotional, poetic storyteller for StarClaim, a premium star-naming platform. "
            "Write a 130-170 word English story tying the user's chosen star to its deeper meaning. "
            "Style: poetic, warm, cosmic imagery, avoid cliches. 3-4 short paragraphs. No title — return story text only."
        )
        user_text = (
            f"Star: {body.star_name} ({body.constellation} constellation)\n"
            f"User's custom name: {body.custom_name}\n"
            f"Occasion: {body.occasion}\n"
            f"Personal message: {body.personal_message or '—'}\n\n"
            f"Write a personal, emotional, unforgettable dedication story for this star."
        )

    try:
        if ANTHROPIC_API_KEY:
            # Production: direct Anthropic API
            client_anthropic = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
            msg = await client_anthropic.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=600,
                system=system,
                messages=[{"role": "user", "content": user_text}],
            )
            story_text = "".join(
                block.text for block in msg.content if getattr(block, "type", None) == "text"
            )
        else:
            # Dev / Emergent: LiteLLM proxy (OpenAI-compatible) — works for any model the proxy supports
            oai = AsyncOpenAI(api_key=EMERGENT_LLM_KEY, base_url=EMERGENT_PROXY_URL)
            resp = await oai.chat.completions.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=600,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_text},
                ],
            )
            story_text = resp.choices[0].message.content or ""
        return {"story": story_text.strip()}
    except Exception as e:
        logger.exception("AI story failed")
        raise HTTPException(status_code=500, detail=f"AI story generation failed: {e}")


# -------------------- Stripe Checkout + Post-Payment --------------------
# Server-side authoritative pricing — frontend NEVER decides the amount.
PACKAGE_MULTIPLIER = {"standard": 1.0, "constellation": 1.2, "legendary": 1.6}


def _star_price_for_package(star_price: float, package: str) -> float:
    return round(star_price * PACKAGE_MULTIPLIER.get(package, 1.0), 2)


async def _process_paid_claim(transaction: dict) -> None:
    """After Stripe confirms payment, mark star owned + generate PDF + send email.
    Idempotent: only runs once per transaction (status flips from 'paid' to 'fulfilled').
    """
    star_id = transaction["star_id"]
    star = await db.stars.find_one({"star_id": star_id}, {"_id": 0})
    if not star:
        logger.error(f"Star {star_id} missing during fulfillment")
        return
    if star.get("owner_id"):
        # Already fulfilled by another path; just mark transaction done
        await db.payment_transactions.update_one(
            {"session_id": transaction["session_id"]},
            {"$set": {"status": "fulfilled", "fulfilled_at": datetime.now(timezone.utc).isoformat()}},
        )
        return

    user_id = transaction.get("user_id")
    user_email = transaction.get("user_email") or ""
    user_name = transaction.get("user_name") or transaction.get("custom_name") or "StarClaim Owner"

    update = {
        "owner_id": user_id,
        "owner_name": user_name,
        "custom_name": transaction["custom_name"],
        "personal_message": transaction.get("personal_message", ""),
        "occasion": transaction.get("occasion", "general"),
        "ai_story": transaction.get("ai_story") or None,
        "claimed_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.stars.update_one({"star_id": star_id}, {"$set": update})

    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    await db.orders.insert_one({
        "order_id": order_id,
        "session_id": transaction["session_id"],
        "user_id": user_id,
        "star_id": star_id,
        "star_code": star["code"],
        "package": transaction.get("package", "standard"),
        "amount": transaction["amount"],
        "gift": transaction.get("gift", False),
        "recipient_name": transaction.get("recipient_name"),
        "recipient_email": transaction.get("recipient_email"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    await db.activities.insert_one({
        "activity_id": f"act_{uuid.uuid4().hex[:10]}",
        "type": "claim",
        "user_name": user_name.split()[0] if user_name else "Anonymous",
        "star_name": star["name"],
        "constellation": star["constellation"],
        "_ts": datetime.now(timezone.utc).isoformat(),
    })

    # Generate PDF certificate
    try:
        pdf_bytes = generate_certificate(
            star_name=star["name"],
            constellation=star["constellation"],
            custom_name=transaction["custom_name"],
            personal_message=transaction.get("personal_message", ""),
            occasion=transaction.get("occasion", "general"),
            ra=star["ra"],
            dec=star["dec"],
            owner_name=user_name,
            story=transaction.get("ai_story") or None,
            language=transaction.get("language", "TR"),
        )
    except Exception as e:
        logger.exception(f"Certificate PDF generation failed: {e}")
        pdf_bytes = b""

    # Send email — to recipient if gift, else to buyer
    is_gift = bool(transaction.get("gift"))
    delivery_email = (transaction.get("recipient_email") if is_gift else user_email) or user_email
    delivery_name = (transaction.get("recipient_name") if is_gift else user_name) or user_name
    if delivery_email and pdf_bytes:
        try:
            await send_certificate_email(
                to_email=delivery_email,
                custom_name=transaction["custom_name"],
                star_name=star["name"],
                constellation=star["constellation"],
                personal_message=transaction.get("personal_message", ""),
                owner_name=delivery_name,
                pdf_bytes=pdf_bytes,
                language=transaction.get("language", "TR"),
                is_gift=is_gift,
                sender_name=user_name if is_gift else "",
            )
        except Exception as e:
            logger.exception(f"Email send failed: {e}")

    await db.payment_transactions.update_one(
        {"session_id": transaction["session_id"]},
        {"$set": {
            "status": "fulfilled",
            "fulfilled_at": datetime.now(timezone.utc).isoformat(),
            "order_id": order_id,
        }},
    )


@api.post("/checkout/session")
async def create_checkout_session(body: CheckoutSessionRequest, request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    star = await db.stars.find_one({"star_id": body.star_id}, {"_id": 0})
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")
    if star.get("owner_id"):
        raise HTTPException(status_code=400, detail="Star already claimed")

    amount = _star_price_for_package(star["price"], body.package)
    if amount < 0.5:
        raise HTTPException(status_code=400, detail="Amount too low")

    # Get current user (optional — guest checkout allowed but we capture if present)
    user = await optional_user(request)
    user_id = user.user_id if user else f"guest_{uuid.uuid4().hex[:10]}"
    user_email = user.email if user else None
    user_name = user.name if user else None

    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/payment/cancel"

    metadata = {
        "star_id": body.star_id,
        "star_code": star["code"],
        "user_id": user_id,
        "package": body.package,
        "gift": "1" if body.gift else "0",
    }

    try:
        session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            mode="payment",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"StarClaim · {body.custom_name}",
                        "description": f"{star['name']} ({star['constellation']}) — {body.package} package",
                    },
                    "unit_amount": int(round(amount * 100)),
                },
                "quantity": 1,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
            customer_email=user_email,
        )
    except Exception as e:
        logger.exception("Stripe session creation failed")
        raise HTTPException(status_code=500, detail=f"Stripe error: {e}")

    # Persist pending transaction (mandatory per playbook)
    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "payment_intent": session.payment_intent,
        "status": "pending",
        "payment_status": "unpaid",
        "amount": amount,
        "currency": "usd",
        "star_id": body.star_id,
        "star_code": star["code"],
        "user_id": user_id,
        "user_email": user_email,
        "user_name": user_name,
        "custom_name": body.custom_name,
        "personal_message": body.personal_message,
        "occasion": body.occasion,
        "package": body.package,
        "gift": body.gift,
        "recipient_name": body.recipient_name,
        "recipient_email": body.recipient_email,
        "ai_story": body.ai_story or "",
        "language": body.language,
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": session.url, "session_id": session.id}


@api.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Session not found")

    # If already fulfilled, return cached status — DO NOT re-process
    if txn.get("status") == "fulfilled":
        return {
            "status": "complete",
            "payment_status": "paid",
            "amount_total": int(round(txn["amount"] * 100)),
            "currency": txn.get("currency", "usd"),
            "star_id": txn["star_id"],
            "custom_name": txn.get("custom_name"),
            "fulfilled": True,
            "type": txn.get("type", "claim"),
        }

    try:
        session = await asyncio.to_thread(stripe.checkout.Session.retrieve, session_id)
    except Exception as e:
        logger.exception("Stripe retrieve failed")
        raise HTTPException(status_code=500, detail=f"Stripe error: {e}")

    new_status = session.status  # open | complete | expired
    new_payment_status = session.payment_status  # paid | unpaid | no_payment_required

    update = {
        "status": new_status,
        "payment_status": new_payment_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    # Idempotent fulfillment trigger
    if new_payment_status == "paid" and txn.get("status") != "fulfilled":
        # Re-fetch latest doc to be safe
        latest = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if latest and latest.get("status") != "fulfilled":
            if latest.get("type") == "marketplace":
                await _process_paid_marketplace_purchase(latest)
            else:
                await _process_paid_claim(latest)

    return {
        "status": new_status,
        "payment_status": new_payment_status,
        "amount_total": session.amount_total or int(round(txn["amount"] * 100)),
        "currency": session.currency or txn.get("currency", "usd"),
        "star_id": txn["star_id"],
        "custom_name": txn.get("custom_name"),
        "fulfilled": new_payment_status == "paid",
        "type": txn.get("type", "claim"),
    }


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")

    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        else:
            # No secret configured — accept event payload as-is (dev/test only)
            import json
            event = json.loads(payload)
    except Exception as e:
        logger.exception("Webhook signature verification failed")
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")

    event_type = event["type"] if isinstance(event, dict) else event.get("type")
    if event_type == "checkout.session.completed":
        data = event["data"]["object"] if isinstance(event, dict) else event["data"]["object"]
        session_id = data.get("id")
        if session_id:
            txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if txn and txn.get("status") != "fulfilled":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid", "status": "complete"}},
                )
                latest = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
                if latest:
                    if latest.get("type") == "marketplace":
                        await _process_paid_marketplace_purchase(latest)
                    else:
                        await _process_paid_claim(latest)

    return {"received": True}


@api.get("/orders/certificate/{order_id}")
async def get_certificate(order_id: str, user: User = Depends(get_current_user)):
    """Re-download a certificate PDF for an existing order."""
    order = await db.orders.find_one({"order_id": order_id, "user_id": user.user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    star = await db.stars.find_one({"star_id": order["star_id"]}, {"_id": 0})
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")
    pdf_bytes = generate_certificate(
        star_name=star["name"],
        constellation=star["constellation"],
        custom_name=star.get("custom_name") or star["name"],
        personal_message=star.get("personal_message") or "",
        occasion=star.get("occasion") or "general",
        ra=star["ra"],
        dec=star["dec"],
        owner_name=user.name,
        story=star.get("ai_story"),
        language="TR",
    )
    from fastapi.responses import Response as FResponse
    return FResponse(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="StarClaim-{star["code"]}-Certificate.pdf"'},
    )


# -------------------- Activities / Stats --------------------
@api.get("/activities/live")
async def live_activities(limit: int = 20):
    cur = db.activities.find({}, {"_id": 0}).sort([("_ts", -1)]).limit(limit)
    return await cur.to_list(limit)


@api.get("/stats/overview")
async def stats_overview():
    total = await db.stars.count_documents({})
    owned = await db.stars.count_documents({"owner_id": {"$ne": None}})
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    claimed_today = await db.stars.count_documents({"claimed_at": {"$gte": today_start}})
    listings = await db.listings.count_documents({})
    return {
        "total_stars": total,
        "owned": owned,
        "available": total - owned,
        "claimed_today": claimed_today,
        "marketplace_listings": listings,
    }


# -------------------- Newsletter --------------------
@api.post("/newsletter")
async def subscribe(body: NewsletterRequest):
    await db.newsletter.update_one(
        {"email": body.email},
        {"$set": {"email": body.email, "subscribed_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True, "email": body.email}


@api.get("/")
async def root():
    return {"service": "StarClaim API", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
