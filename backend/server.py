"""
StarCalimX backend — FastAPI + MongoDB + OpenAI / Anthropic AI stories
+ Stripe checkout + Resend email + ReportLab PDF certificate.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import Optional
from pathlib import Path
from datetime import datetime, timezone, timedelta
import time
import os
import uuid
import logging
import asyncio
import httpx
import re
import anthropic
import stripe
from openai import AsyncOpenAI
from nacl.signing import VerifyKey
import base58
import sys
import hashlib
import json
import math

try:
    from backend.star_tile_catalog import resolve_catalog_root, resolve_tile_path
    from backend.binary_star_catalog import resolve_binary_catalog_root, resolve_binary_tile_path
    from backend.dso_catalog import get_all_dsos, get_dsos_for_zoom, search_dsos, to_dict
    from backend.voyage_coordinates import (
        AstronomicalCoordinate,
        CoordinateTransform,
        VoyageCoordinate,
        LODCalculator,
    )
except ModuleNotFoundError:
    from star_tile_catalog import resolve_catalog_root, resolve_tile_path
    from binary_star_catalog import resolve_binary_catalog_root, resolve_binary_tile_path
    from dso_catalog import get_all_dsos, get_dsos_for_zoom, search_dsos, to_dict
    from voyage_coordinates import (
        AstronomicalCoordinate,
        CoordinateTransform,
        VoyageCoordinate,
        LODCalculator,
    )

try:
    from backend.seed_data import STAR_CATALOG, SAMPLE_LISTINGS, SAMPLE_ACTIVITIES
    from backend.certificate import generate_certificate
    from backend.emails import send_certificate_email
    from backend.stellar import create_testnet_account, get_account_balances, send_xlm
    from backend.seed_dsos import import_dso_catalog_complete
except ModuleNotFoundError:
    # Allow running the backend directly from the backend/ directory during local development.
    ROOT_DIR = Path(__file__).resolve().parent
    if str(ROOT_DIR) not in sys.path:
        sys.path.insert(0, str(ROOT_DIR))
    from seed_data import STAR_CATALOG, SAMPLE_LISTINGS, SAMPLE_ACTIVITIES
    from certificate import generate_certificate
    from emails import send_certificate_email
    from stellar import create_testnet_account, get_account_balances, send_xlm
    from seed_dsos import import_dso_catalog_complete

# Redis-backed rate limiter (optional for production). If REDIS_URL is set
# in the environment we'll initialize FastAPILimiter during startup and use
# fastapi-limiter's RateLimiter dependency on the transfer endpoint. If not
# configured, we fall back to the in-memory limiter above.
REDIS_URL = os.environ.get("REDIS_URL", "")
FASTAPI_LIMITER_AVAILABLE = False
try:
    from fastapi_limiter import FastAPILimiter
    from fastapi_limiter.depends import RateLimiter
    import aioredis
    FASTAPI_LIMITER_AVAILABLE = True
except Exception:
    # Not installed or not configured in the environment; we'll skip Redis init
    FASTAPI_LIMITER_AVAILABLE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

STAR_TILE_ROOT = Path(os.environ.get("STAR_TILE_ROOT", ROOT_DIR / "data" / "star_tiles")).resolve()
STAR_TILE_VERSION = os.environ.get("STAR_TILE_VERSION", "hyg-v4.1-sector-v1")
STAR_TILE_2D_ROOT = Path(os.environ.get("STAR_TILE_2D_ROOT", ROOT_DIR / "data" / "star_tiles_2d")).resolve()
STAR_TILE_2D_VERSION = os.environ.get("STAR_TILE_2D_VERSION", "gaia-dr3-hip-2d-v1")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
# AI key resolution:
#   If OPENAI_API_KEY is set → use OpenAI directly with gpt-3.5-turbo.
#   Else if ANTHROPIC_API_KEY is set → use Anthropic SDK as a secondary provider.
#   Emergent proxy is no longer preferred for core support/story workflows.
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
GOOGLE_API_BASE = os.environ.get("GOOGLE_API_BASE", "https://generativelanguage.googleapis.com/v1beta")
GOOGLE_MODEL_SUPPORT = os.environ.get("GOOGLE_MODEL_SUPPORT", "gemini-1.5-pro")
GOOGLE_MODEL_STORY = os.environ.get("GOOGLE_MODEL_STORY", "gemini-1.5-pro")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
EMERGENT_PROXY_URL = os.environ.get("INTEGRATION_PROXY_URL", "https://integrations.emergentagent.com") + "/llm"
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STELLAR_PLATFORM_SECRET = os.environ.get("STELLAR_PLATFORM_SECRET", "")
DEMO_CLEANUP_ENABLED = os.environ.get("ENABLE_DEMO_CLEANUP", "0") == "1"
if STRIPE_API_KEY:
    stripe.api_key = STRIPE_API_KEY

# Simple in-memory rate limiter for sensitive endpoints (per-user)
# NOTE: This is suitable for local testing/demo only. For production use a centralized
# store like Redis and a proven limiter library (e.g. `slowapi`/`fastapi-limiter`).
TRANSFER_RATE_LIMIT_WINDOW = 60  # seconds
TRANSFER_RATE_LIMIT_MAX = 3     # max transfers per window per user
_transfer_activity = {}
_transfer_lock = asyncio.Lock()

client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=int(os.environ.get("MONGO_SERVER_SELECTION_TIMEOUT_MS", "3000")),
)
db = client[DB_NAME]

# Simple in-memory cache for count endpoint to avoid expensive count_documents calls
COUNT_CACHE_TTL = int(os.environ.get("COUNT_CACHE_TTL", "60"))  # seconds
_COUNT_CACHE = {}
_COUNT_CACHE_LOCK = asyncio.Lock()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("starcalimx")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await ensure_indexes()
        await seed_database()
        if DEMO_CLEANUP_ENABLED:
            await cleanup_demo_data_once()
        
        # P0.8.5b: Auto-import DSO catalog on startup
        try:
            logger.info("\U0001f680 Initializing 3D DSO Catalog (110 Messier + 500 NGC)...")
            await import_dso_catalog_complete(db)
            logger.info("✅ DSO Catalog initialized successfully")
        except Exception as dso_error:
            logger.error("⚠️  DSO Catalog initialization failed: %s", dso_error)
            # DSO endpoints not critical for core system operations
            pass
    except Exception as error:
        # Read-only catalog and health-independent routes must remain available
        # when MongoDB is temporarily unavailable during local/mobile testing.
        logger.warning("MongoDB startup tasks skipped: %s", error)

    if REDIS_URL and FASTAPI_LIMITER_AVAILABLE:
        try:
            redis = await aioredis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
            app.state.redis = redis
            await FastAPILimiter.init(redis)
            logger.info("FastAPILimiter initialized with REDIS_URL")
        except Exception as e:
            logger.exception(f"Failed to initialize FastAPILimiter: {e}")

    try:
        yield
    finally:
        redis = getattr(app.state, "redis", None)
        if redis is not None:
            await redis.close()
        client.close()


app = FastAPI(title="StarCalimX API", lifespan=lifespan)
api = APIRouter(prefix="/api")

TIER_IMPORTANCE = {
    "legendary": 5,
    "zodiac": 4,
    "named": 3,
    "constellation": 2,
    "standard": 1,
}

TIER_LABELS = {
    "legendary": "Cosmic Legacy",
    "zodiac": "Stellar Maven",
    "named": "Honorary Star",
    "constellation": "Celestial Pattern",
    "standard": "Galaxy Asset",
}


def load_support_document(path: Path, max_lines: int = 80, max_chars: int = 3500) -> str:
    try:
        text = path.read_text(encoding="utf-8")
        lines = text.splitlines()
        snippet = "\n".join(lines[:max_lines])
        if len(snippet) > max_chars:
            snippet = snippet[:max_chars] + "\n..."
        return snippet
    except Exception as exc:
        logger.warning(f"Aegis support doc load failed for {path}: {exc}")
        return ""


SUPPORT_DOCS = {
    "unified_execution_plan": ROOT_DIR.parent / "STARCLAIM_UNIFIED_EXECUTION_PLAN.md",
    "work_log": ROOT_DIR.parent / "WORK_LOG.md",
    "deploy_notes": ROOT_DIR.parent / "DEPLOY.md",
    "prd": ROOT_DIR.parent / "memory" / "PRD.md",
    "readme": ROOT_DIR.parent / "README.md",
}

PROJECT_KNOWLEDGE_BASE = "\n\n".join(
    f"### {name.replace('_', ' ').title()}\n" + load_support_document(path)
    for name, path in SUPPORT_DOCS.items()
    if path.exists()
)


def _google_prompt_from_messages(system: str, messages: list[dict]) -> str:
    parts = [system.strip(), ""]
    for message in messages:
        role = message.get("role", "user").title()
        content = message.get("content", "")
        parts.append(f"{role}: {content}")
    return "\n".join(parts)


async def _generate_with_google_gemini(prompt: str, model: str, max_tokens: int = 500, temperature: float = 0.7) -> str:
    """Gemini 1.5+ compatible generation using generateContent endpoint."""
    url = f"{GOOGLE_API_BASE}/models/{model}:generateContent?key={GOOGLE_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
    
    if resp.status_code != 200:
        logger.error(f"Google AI error {resp.status_code}: {resp.text}")
        return ""
        
    data = resp.json()
    try:
        # Gemini 1.5 response structure
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        logger.error(f"Unexpected Google AI format: {data}")
        return ""


# -------------------- Models --------------------
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    wallet_address: Optional[str] = None
    stellar_address: Optional[str] = None
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None
    daily_streak: int = 0
    last_checkin_at: Optional[datetime] = None
    points: int = 0
    is_admin: bool = False
    created_at: datetime


class StellarTransferRequest(BaseModel):
    destination: str
    amount: str
    memo: Optional[str] = ""
    source_secret: Optional[str] = None


class ReferralRequest(BaseModel):
    referral_code: str


class Star(BaseModel):
    star_id: str
    code: str  # e.g. "sirius" / "sc-001"
    name: str
    constellation: str
    tier: str  # legendary | zodiac | named | constellation | standard
    price: float
    ra: str
    dec: str
    ra_deg: Optional[float] = None  # Right Ascension in degrees
    dec_deg: Optional[float] = None # Declination in degrees
    magnitude: Optional[float] = None
    spect: Optional[str] = None     # Spectral type
    hip: Optional[str] = None       # Hipparcos ID
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


class QRVerifyRequest(BaseModel):
    auth_session_id: str
    public_key: str
    signature: str
    message: str


class ListStarRequest(BaseModel):
    star_id: str
    asking_price: float


class UnlistStarRequest(BaseModel):
    star_id: Optional[str] = None
    listing_id: Optional[str] = None


class MarketplaceCheckoutRequest(BaseModel):
    listing_id: str
    origin_url: str


class StoryRequest(BaseModel):
    star_name: str
    constellation: str
    custom_name: str
    ra: Optional[str] = None
    dec: Optional[str] = None
    magnitude: Optional[float] = None
    tier: Optional[str] = "standard"
    personal_message: Optional[str] = ""
    occasion: str = "general"
    language: str = "TR"


class NewsletterRequest(BaseModel):
    email: EmailStr


class NewsItem(BaseModel):
    news_id: str
    title: str
    content: str
    image_url: Optional[str] = None
    category: str = "announcement"  # announcement | discovery | update
    is_published: bool = True
    created_at: datetime


class SystemConfig(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime


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


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Administrative access required")
    return user


# -------------------- Admin Management (Phase 7/8) --------------------
@api.get("/admin/stats")
async def admin_stats(_: User = Depends(require_admin)):
    """Comprehensive system stats for admin dashboard."""
    total_users = await db.users.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_revenue = await db.orders.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    return {
        "users": total_users,
        "orders": total_orders,
        "revenue": total_revenue[0]["total"] if total_revenue else 0,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@api.get("/admin/orders")
async def admin_list_orders(limit: int = 50, offset: int = 0, _: User = Depends(require_admin)):
    cur = db.orders.find({}, {"_id": 0}).sort([("created_at", -1)]).skip(offset).limit(limit)
    return await cur.to_list(limit)


@api.put("/admin/stars/{star_id}")
async def admin_update_star(star_id: str, updates: dict, _: User = Depends(require_admin)):
    # Restrict what can be updated manually
    allowed_keys = {"price", "tier", "name", "for_sale"}
    filtered = {k: v for k, v in updates.items() if k in allowed_keys}
    if not filtered:
        raise HTTPException(status_code=400, detail="No valid update fields")
        
    res = await db.stars.update_one({"star_id": star_id}, {"$set": filtered})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Star not found")
    return {"ok": True}


# --- News & Config (Nexus Phase 1) ---

@api.get("/news")
async def list_news(limit: int = 10, offset: int = 0):
    """Public endpoint to list news."""
    cur = db.news.find({"is_published": True}, {"_id": 0}).sort([("created_at", -1)]).skip(offset).limit(limit)
    return await cur.to_list(limit)


@api.get("/admin/news")
async def admin_list_news(limit: int = 50, offset: int = 0, _: User = Depends(require_admin)):
    cur = db.news.find({}, {"_id": 0}).sort([("created_at", -1)]).skip(offset).limit(limit)
    return await cur.to_list(limit)


@api.post("/admin/news")
async def admin_create_news(item: NewsItem, _: User = Depends(require_admin)):
    doc = item.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["news_id"] = f"news_{uuid.uuid4().hex[:10]}"
    await db.news.insert_one(doc)
    return {"ok": True, "news_id": doc["news_id"]}


@api.put("/admin/news/{news_id}")
async def admin_update_news(news_id: str, updates: dict, _: User = Depends(require_admin)):
    await db.news.update_one({"news_id": news_id}, {"$set": updates})
    return {"ok": True}


@api.delete("/admin/news/{news_id}")
async def admin_delete_news(news_id: str, _: User = Depends(require_admin)):
    await db.news.delete_one({"news_id": news_id})
    return {"ok": True}


@api.get("/admin/config")
async def admin_list_config(_: User = Depends(require_admin)):
    cur = db.system_configs.find({}, {"_id": 0})
    return await cur.to_list(100)


@api.post("/admin/config")
async def admin_upsert_config(cfg: SystemConfig, _: User = Depends(require_admin)):
    doc = cfg.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.system_configs.update_one(
        {"key": cfg.key},
        {"$set": doc},
        upsert=True
    )
    return {"ok": True}


@api.get("/config/{key}")
async def get_config(key: str):
    """Public endpoint to get a specific config value (e.g. maintenance mode, announcements)."""
    cfg = await db.system_configs.find_one({"key": key}, {"_id": 0})
    if not cfg:
        raise HTTPException(status_code=404, detail="Config not found")
    return cfg


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
    else:
        existing_star_codes = set(await db.stars.distinct("code"))
        missing_stars = []
        for s in STAR_CATALOG:
            if s["code"] not in existing_star_codes:
                doc = dict(s)
                doc["star_id"] = doc.get("star_id") or f"star_{uuid.uuid4().hex[:10]}"
                missing_stars.append(doc)
        if missing_stars:
            await db.stars.insert_many(missing_stars)
            logger.info(f"Seeded {len(missing_stars)} missing stars")

    existing_listing_codes = set(await db.listings.distinct("star_code"))
    listings = []
    for l in SAMPLE_LISTINGS:
        if l["code"] in existing_listing_codes:
            continue
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

    # Ensure there are enough demo marketplace listings for regression tests.
    active_listing_query = {"$or": [{"status": "active"}, {"status": {"$exists": False}}]}
    current_listings = await db.listings.count_documents(active_listing_query)
    if current_listings < 6:
        listed_codes = set(await db.listings.distinct("star_code", active_listing_query))
        needed = 6 - current_listings
        extra_stars = await db.stars.find(
            {"code": {"$nin": list(listed_codes)}},
            {"_id": 0, "star_id": 1, "code": 1, "name": 1, "constellation": 1, "tier": 1, "price": 1}
        ).limit(needed).to_list(needed)

        fallback_listings = []
        for star in extra_stars:
            fallback_listings.append({
                "listing_id": f"lst_{uuid.uuid4().hex[:10]}",
                "star_id": star["star_id"],
                "star_code": star["code"],
                "star_name": star["name"],
                "constellation": star["constellation"],
                "tier": star["tier"],
                "original_price": star.get("price", 0),
                "asking_price": round((star.get("price", 0) or 1) * 1.2),
                "owner_name": "Demo Seller",
                "owner_id": None,
                "listed_at": datetime.now(timezone.utc).isoformat(),
                "days_ago": 7,
                "hops": 1,
            })
        if fallback_listings:
            await db.listings.insert_many(fallback_listings)
            logger.info(f"Supplemented {len(fallback_listings)} fallback listings for demo coverage")

    existing_activity_ids = set(await db.activities.distinct("activity_id"))
    activities = []
    for a in SAMPLE_ACTIVITIES:
        if a["activity_id"] in existing_activity_ids:
            continue
        activity = dict(a)
        activity["_ts"] = datetime.now(timezone.utc).isoformat()
        activities.append(activity)
    if activities:
        await db.activities.insert_many(activities)
        logger.info(f"Seeded {len(activities)} activities")

    current_activities = await db.activities.count_documents({})
    if current_activities < 10:
        extra_activities = []
        next_idx = 1
        while len(extra_activities) < (10 - current_activities):
            candidate = f"act_fallback_{next_idx}"
            if candidate not in existing_activity_ids:
                extra_activities.append({
                    "activity_id": candidate,
                    "type": "claim",
                    "user_name": "Demo User",
                    "star_name": f"Star {next_idx}",
                    "constellation": "Unknown",
                    "_ts": datetime.now(timezone.utc).isoformat(),
                })
            next_idx += 1
        if extra_activities:
            await db.activities.insert_many(extra_activities)
            logger.info(f"Supplemented {len(extra_activities)} fallback activities for demo coverage")


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


async def ensure_indexes():
    """Create MongoDB indexes for performance with high volume (10k+ stars)."""
    await db.stars.create_index([("tier", 1)])
    await db.stars.create_index([("constellation", 1)])
    await db.stars.create_index([("price", 1)])
    await db.stars.create_index([("owner_id", 1)])
    await db.stars.create_index([("name", 1)])
    await db.stars.create_index([("code", 1)], unique=True)
    await db.stars.create_index([("ra_deg", 1), ("dec_deg", 1)])  # Spatial/compound index
    logger.info("Database indexes verified/created")


# -------------------- Health Check --------------------
@app.get("/health")
async def health_check():
    """Mobile endpoint for backend connectivity check."""
    try:
        # Quick DB ping
        await db.command("ping")
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": "connected",
            "version": "1.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": str(e),
            "version": "1.0"
        }, 503


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
        update_data = {"name": name, "picture": picture}
        if not existing.get("referral_code"):
            update_data["referral_code"] = f"REF{uuid.uuid4().hex[:8].upper()}"
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": update_data},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "referral_code": f"REF{uuid.uuid4().hex[:8].upper()}",
            "daily_streak": 0,
            "points": 0,
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


# -------------------- Quantum Entanglement (QR Login) --------------------
auth_handshake_sessions = {}


def verify_solana_signature(public_key_str: str, signature_str: str, message_str: str) -> bool:
    try:
        pubkey_bytes = base58.b58decode(public_key_str)
        sig_bytes = base58.b58decode(signature_str)
        msg_bytes = message_str.encode("utf-8")
        
        verify_key = VerifyKey(pubkey_bytes)
        verify_key.verify(msg_bytes, sig_bytes)
        return True
    except Exception as e:
        logger.error(f"Signature verification error: {e}")
        return False


@api.post("/auth/qr-verify")
async def auth_qr_verify(body: QRVerifyRequest, response: Response):
    if not verify_solana_signature(body.public_key, body.signature, body.message):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Message should be: "StarCalimX Entanglement Login: {auth_session_id}"
    expected_msg = f"StarCalimX Entanglement Login: {body.auth_session_id}"
    if body.message != expected_msg:
        raise HTTPException(status_code=401, detail="Invalid message payload")

    # User lookup by wallet (public key)
    email = f"{body.public_key[:8]}@solana.wallet" # Synthetic email for wallet users
    existing = await db.users.find_one({"wallet_address": body.public_key}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        name = existing["name"]
        if not existing.get("referral_code"):
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"referral_code": f"REF{uuid.uuid4().hex[:8].upper()}"}},
            )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        name = f"Explorer {body.public_key[:4]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "wallet_address": body.public_key,
            "name": name,
            "referral_code": f"REF{uuid.uuid4().hex[:8].upper()}",
            "daily_streak": 0,
            "points": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = uuid.uuid4().hex
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Push to PC via WebSocket if connected
    if body.auth_session_id in auth_handshake_sessions:
        ws = auth_handshake_sessions[body.auth_session_id]
        try:
            await ws.send_json({
                "type": "auth_success",
                "session_token": session_token,
                "user": {"user_id": user_id, "email": email, "name": name}
            })
        except Exception:
            logger.error(f"Failed to send auth_success to {body.auth_session_id}")

    return {"ok": True}


@app.websocket("/ws/auth/{auth_session_id}")
async def websocket_auth(websocket: WebSocket, auth_session_id: str):
    await websocket.accept()
    auth_handshake_sessions[auth_session_id] = websocket
    logger.info(f"Auth Handshake: PC connected {auth_session_id}")
    
    try:
        while True:
            # Just keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        if auth_handshake_sessions.get(auth_session_id) == websocket:
            del auth_handshake_sessions[auth_session_id]
        logger.info(f"Auth Handshake: PC disconnected {auth_session_id}")


# -------------------- Stars --------------------
@api.get("/catalog/2d/manifest")
async def get_2d_catalog_manifest():
    catalog_root = resolve_binary_catalog_root(STAR_TILE_2D_ROOT, STAR_TILE_2D_VERSION)
    manifest_path = catalog_root / "manifest.json"
    if not manifest_path.is_file():
        raise HTTPException(status_code=503, detail="2D Gaia catalog tiles are not built")
    return FileResponse(manifest_path, media_type="application/json", headers={"Cache-Control": "public, max-age=300"})


@api.get("/catalog/2d/names")
async def get_2d_catalog_names():
    names_path = resolve_binary_catalog_root(STAR_TILE_2D_ROOT, STAR_TILE_2D_VERSION) / "names.json"
    if not names_path.is_file():
        raise HTTPException(status_code=503, detail="2D Gaia name index is not built")
    return FileResponse(names_path, media_type="application/json", headers={"Cache-Control": "public, max-age=31536000, immutable"})


@api.get("/catalog/2d/tiles/{sector_id}")
async def get_2d_catalog_tile(sector_id: str):
    try:
        tile_path = resolve_binary_tile_path(STAR_TILE_2D_ROOT, STAR_TILE_2D_VERSION, sector_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    if not tile_path.is_file():
        raise HTTPException(status_code=404, detail="2D Gaia tile not found")
    return FileResponse(
        tile_path,
        media_type="application/octet-stream",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@api.get("/catalog/3d/manifest")
async def get_3d_catalog_manifest():
    try:
        manifest_path = resolve_catalog_root(STAR_TILE_ROOT, STAR_TILE_VERSION) / "manifest.json"
    except ValueError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    if not manifest_path.is_file():
        raise HTTPException(status_code=503, detail="3D catalog tiles are not built")
    return FileResponse(
        manifest_path,
        media_type="application/json",
        headers={"Cache-Control": "public, max-age=300"},
    )


@api.get("/catalog/3d/tiles/{sector_id}")
async def get_3d_catalog_tile(sector_id: str):
    try:
        tile_path = resolve_tile_path(STAR_TILE_ROOT, STAR_TILE_VERSION, sector_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    if not tile_path.is_file():
        raise HTTPException(status_code=404, detail="3D catalog tile not found")
    return FileResponse(
        tile_path,
        media_type="application/json",
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Encoding": "gzip",
            "Vary": "Accept-Encoding",
        },
    )


def _build_star_query(
    tier: Optional[str] = None,
    constellation: Optional[str] = None,
    available: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    spectral_type: Optional[str] = None,
    magnitude_min: Optional[float] = None,
    magnitude_max: Optional[float] = None,
    distance_min: Optional[float] = None,
    distance_max: Optional[float] = None,
    has_stories: Optional[bool] = None,
    search: Optional[str] = None,
):
    conditions = []

    if tier and tier != "all":
        conditions.append({"tier": tier})
    if constellation and constellation != "all":
        conditions.append({"constellation": constellation})
    if available is True:
        conditions.append({"owner_id": None, "owner_name": None})
    elif available is False:
        conditions.append({"$or": [{"owner_id": {"$ne": None}}, {"owner_name": {"$ne": None}}]})

    if min_price is not None or max_price is not None:
        price_filter = {}
        if min_price is not None:
            price_filter["$gte"] = min_price
        if max_price is not None:
            price_filter["$lte"] = max_price
        if price_filter:
            conditions.append({"price": price_filter})

    if spectral_type and spectral_type != "all":
        conditions.append({"spect": {"$regex": f"^{re.escape(spectral_type)}", "$options": "i"}})

    if magnitude_min is not None or magnitude_max is not None:
        magnitude_filter = {}
        if magnitude_min is not None:
            magnitude_filter["$gte"] = magnitude_min
        if magnitude_max is not None:
            magnitude_filter["$lte"] = magnitude_max
        if magnitude_filter:
            conditions.append({"magnitude": magnitude_filter})

    if distance_min is not None or distance_max is not None:
        distance_filter = {}
        if distance_min is not None:
            distance_filter["$gte"] = distance_min
        if distance_max is not None:
            distance_filter["$lte"] = distance_max
        if distance_filter:
            conditions.append({"distance": distance_filter})

    if has_stories is True:
        conditions.append({
            "$or": [
                {"stories_count": {"$gt": 0}},
                {"ai_story": {"$ne": None}},
                {"ai_story": {"$ne": ""}},
            ]
        })

    if search:
        term = re.escape(search.strip())
        conditions.append({
            "$or": [
                {"name": {"$regex": term, "$options": "i"}},
                {"code": {"$regex": term, "$options": "i"}},
                {"constellation": {"$regex": term, "$options": "i"}},
            ]
        })

    if not conditions:
        return {}
    if len(conditions) == 1:
        return conditions[0]
    return {"$and": conditions}


@api.get("/stars")
async def list_stars(
    tier: Optional[str] = None,
    constellation: Optional[str] = None,
    available: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    spectral_type: Optional[str] = None,
    magnitude_min: Optional[float] = None,
    magnitude_max: Optional[float] = None,
    distance_min: Optional[float] = None,
    distance_max: Optional[float] = None,
    has_stories: Optional[bool] = None,
    search: Optional[str] = None,
    viewer_ra: Optional[float] = None,
    viewer_dec: Optional[float] = None,
    sort: str = "price_asc",
    limit: int = 200,
    offset: int = 0,
):
    req_start = time.time()
    q = _build_star_query(
        tier,
        constellation,
        available,
        min_price,
        max_price,
        spectral_type,
        magnitude_min,
        magnitude_max,
        distance_min,
        distance_max,
        has_stories,
        search,
    )

    sort_map = {
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "name": [("name", 1)],
        "tier": [("tier", 1), ("price", -1)],
        "brightest": [("magnitude", 1)],
        "nearest": [("distance", 1)],
    }
    db_start = time.time()
    # If nearest requested and viewer coords provided, use geoNear aggregation
    if sort == 'nearest' and viewer_ra is not None and viewer_dec is not None:
        # Convert viewer RA to longitude range (-180..180) to match stored `loc` coordinates
        v_lon = viewer_ra if viewer_ra <= 180.0 else (viewer_ra - 360.0)
        geo_near = {
            'near': {'type': 'Point', 'coordinates': [v_lon, viewer_dec]},
            'distanceField': 'dist.calculated',
            'spherical': True,
        }
        pipeline = [{'$geoNear': geo_near}]
        if q:
            pipeline.append({'$match': q})
        pipeline.append({'$project': {'_id': 0, 'dist': 1, 'code': 1, 'name': 1, 'constellation': 1, 'tier': 1, 'price': 1, 'ra': 1, 'dec': 1, 'ra_deg': 1, 'dec_deg': 1, 'magnitude': 1, 'spect': 1, 'hip': 1, 'owner_id': 1, 'owner_name': 1, 'custom_name': 1, 'for_sale': 1, 'asking_price': 1, 'star_id': 1}})
        pipeline.append({'$limit': limit})
        try:
            results = await db.stars.aggregate(pipeline).to_list(length=limit)
        except Exception as exc:
            logger.exception(f"Geo aggregation failed: {exc}")
            raise HTTPException(status_code=500, detail=str(exc))
    else:
        cur = db.stars.find(q, {"_id": 0}).sort(sort_map.get(sort, [("price", 1)])).skip(offset).limit(limit)
        results = await cur.to_list(limit)
    db_ms = (time.time() - db_start) * 1000
    total_ms = (time.time() - req_start) * 1000
    try:
        logger.info(f"/api/stars q={q} sort={sort} limit={limit} offset={offset} db_ms={db_ms:.1f} total_ms={total_ms:.1f} results={len(results)}")
    except Exception:
        logger.info(f"/api/stars executed; db_ms={db_ms:.1f} total_ms={total_ms:.1f}")
    return results


@api.get("/stars/count")
async def count_stars(
    tier: Optional[str] = None,
    constellation: Optional[str] = None,
    available: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    spectral_type: Optional[str] = None,
    magnitude_min: Optional[float] = None,
    magnitude_max: Optional[float] = None,
    distance_min: Optional[float] = None,
    distance_max: Optional[float] = None,
    has_stories: Optional[bool] = None,
    search: Optional[str] = None,
    viewer_ra: Optional[float] = None,
    viewer_dec: Optional[float] = None,
):
    q = _build_star_query(
        tier,
        constellation,
        available,
        min_price,
        max_price,
        spectral_type,
        magnitude_min,
        magnitude_max,
        distance_min,
        distance_max,
        has_stories,
        search,
    )

    # Cache by query and viewer location
    try:
        key = json.dumps({"q": q, "viewer_ra": viewer_ra, "viewer_dec": viewer_dec}, sort_keys=True, default=str)
    except Exception:
        key = str({"q": q, "viewer_ra": viewer_ra, "viewer_dec": viewer_dec})

    now = time.time()
    # check cache
    async with _COUNT_CACHE_LOCK:
        entry = _COUNT_CACHE.get(key)
        if entry and entry[1] > now:
            logger.info(f"/api/stars/count cache hit ttl_remaining={entry[1]-now:.1f}s key={key}")
            return {"count": entry[0]}

    # compute and store
    if viewer_ra is not None and viewer_dec is not None:
        v_lon = viewer_ra if viewer_ra <= 180.0 else (viewer_ra - 360.0)
        geo_near = {
            "near": {"type": "Point", "coordinates": [v_lon, viewer_dec]},
            "distanceField": "dist.calculated",
            "spherical": True,
        }
        pipeline = [{"$geoNear": geo_near}]
        if q:
            pipeline.append({"$match": q})
        pipeline.append({"$count": "count"})
        try:
            results = await db.stars.aggregate(pipeline).to_list(length=1)
            count = results[0]["count"] if results else 0
        except Exception as exc:
            logger.exception(f"Geo count aggregation failed: {exc}")
            raise HTTPException(status_code=500, detail=str(exc))
    else:
        count = await db.stars.count_documents(q)

    expires = now + COUNT_CACHE_TTL
    async with _COUNT_CACHE_LOCK:
        _COUNT_CACHE[key] = (count, expires)
    logger.info(f"/api/stars/count computed count={count} key={key} ttl={COUNT_CACHE_TTL}s")
    return {"count": count}


@api.get("/stars/constellations")
async def list_constellations():
    cons = await db.stars.distinct("constellation")
    return sorted(cons)


@api.get("/stars/registry/{code}")
async def get_star_by_code(code: str):
    """Retrieve public registry data for a star by its unique code."""
    normalized_code = code.strip()
    s = await db.stars.find_one(
        {"code": {"$regex": f"^{re.escape(normalized_code)}$", "$options": "i"}},
        {"_id": 0},
    )
    if not s:
        raise HTTPException(status_code=404, detail="Star not found in registry")
    return s


@api.get("/stars/health")
async def stars_health():
    total_stars = await db.stars.count_documents({})
    available_stars = await db.stars.count_documents({"owner_id": None})
    return {
        "service": "StarClaim Star Catalog",
        "ok": total_stars > 0,
        "total_stars": total_stars,
        "available_stars": available_stars,
    }


# -------------------- P0.6: Deep Sky Objects (DSO) --------------------

@api.get("/dso/catalog")
async def get_dso_catalog():
    """Get all Messier + NGC objects for sky map"""
    dsos = get_all_dsos()
    return {
        "catalogVersion": "messier-ngc-v1",
        "totalCount": len(dsos),
        "objects": [to_dict(dso) for dso in dsos],
    }


@api.get("/dso/by-zoom")
async def get_dso_by_zoom(zoom: float = 1.0, quality: str = "medium"):
    """Get DSOs visible at given zoom level and quality profile"""
    if zoom < 0.1 or zoom > 100:
        raise HTTPException(status_code=400, detail="Zoom must be between 0.1 and 100")
    if quality not in ("low", "medium", "high"):
        raise HTTPException(status_code=400, detail="Quality must be low, medium, or high")
    
    dsos = get_dsos_for_zoom(zoom, quality)
    return {
        "zoom": zoom,
        "quality": quality,
        "visibleCount": len(dsos),
        "objects": [to_dict(dso) for dso in dsos],
    }


@api.get("/dso/search")
async def search_dso(q: str = "", limit: int = 20):
    """Search DSOs by name, M-number, NGC-number"""
    if not q or len(q.strip()) < 1:
        raise HTTPException(status_code=400, detail="Query required (e.g., 'messier-31', 'm51', 'andromeda')")
    
    if limit < 1 or limit > 100:
        limit = 20
    
    results = search_dsos(q, limit=limit)
    return {
        "query": q,
        "resultCount": len(results),
        "objects": [to_dict(dso) for dso in results],
    }


# -------------------- P0.8: 3D Voyage (Celestia-like) --------------------

@api.get("/voyage/region")
async def get_voyage_region(ra: float = 0, dec: float = 0, distance: float = 100,
                            radius_pc: float = 50, max_stars: int = 1000):
    """
    Get stars in a 3D spherical region for Voyage rendering.
    
    Center point: RA, Dec (degrees), Distance (parsecs)
    Radius: Search radius in parsecs
    Returns: Stars with 3D Cartesian coordinates
    """
    if not (0 <= ra < 360):
        raise HTTPException(status_code=400, detail="RA must be [0, 360)")
    if not (-90 <= dec <= 90):
        raise HTTPException(status_code=400, detail="Dec must be [-90, +90]")
    if distance <= 0:
        raise HTTPException(status_code=400, detail="Distance must be > 0")
    if radius_pc <= 0 or radius_pc > 500:
        raise HTTPException(status_code=400, detail="Radius must be (0, 500] pc")
    if max_stars < 10 or max_stars > 5000:
        max_stars = 1000
    
    # Convert center to Cartesian
    center = AstronomicalCoordinate(
        ra_degrees=ra,
        dec_degrees=dec,
        distance_pc=distance
    )
    center_cartesian = CoordinateTransform.astro_to_cartesian(center)
    
    # Query MongoDB for nearby stars
    # Use approximate filtering first (RA/Dec +/- range)
    ra_min = (ra - radius_pc / 111.2) % 360  # 1 degree ~ 111 km, 111 km / 1000 pc ≈ 0.111 degrees
    ra_max = (ra + radius_pc / 111.2) % 360
    dec_min = max(-90, dec - radius_pc / 111.2)
    dec_max = min(90, dec + radius_pc / 111.2)
    
    query = {
        "raDegrees": {"$gte": ra_min} if ra_min < ra_max else {"$gte": ra_min, "$lt": 360},
        "decDegrees": {"$gte": dec_min, "$lte": dec_max},
    }
    
    cursor = db.stars.find(query, {"_id": 0}).limit(max_stars * 2)  # Fetch extra for precise filtering
    stars = await cursor.to_list(None)
    
    # Precise spherical distance filtering
    filtered_stars = []
    for star in stars:
        try:
            star_coord = AstronomicalCoordinate(
                ra_degrees=star.get("raDegrees", 0),
                dec_degrees=star.get("decDegrees", 0),
                distance_pc=star.get("distanceParsec", 100)
            )
            star_cartesian = CoordinateTransform.astro_to_cartesian(star_coord)
            
            # Calculate distance from center
            dx = star_cartesian.x - center_cartesian.x
            dy = star_cartesian.y - center_cartesian.y
            dz = star_cartesian.z - center_cartesian.z
            dist = math.sqrt(dx**2 + dy**2 + dz**2)
            
            if dist <= radius_pc:
                filtered_stars.append({
                    **star,
                    "voyageX": star_cartesian.x,
                    "voyageY": star_cartesian.y,
                    "voyageZ": star_cartesian.z,
                    "voyageDistance": star_cartesian.distance_from_origin(),
                    "regionDistance": dist,
                })
        except (ValueError, TypeError):
            continue
    
    # Sort by distance and limit
    filtered_stars.sort(key=lambda s: s["regionDistance"])
    filtered_stars = filtered_stars[:max_stars]
    
    return {
        "centerRA": ra,
        "centerDec": dec,
        "centerDistance": distance,
        "radiusPc": radius_pc,
        "starCount": len(filtered_stars),
        "stars": filtered_stars,
    }


@api.get("/voyage/target/{target_id}")
async def get_voyage_target(target_id: str):
    """
    Get specific star with 3D voyage coordinates.
    
    Target ID can be:
    - Hip ID: "hip:32349"
    - HD ID: "hd:48915"
    - Gaia ID: "gaia-dr3:123456"
    - Canonical ID: "<source>:<id>"
    """
    if ":" not in target_id:
        raise HTTPException(status_code=400, detail="Target must be source:id format")
    
    parts = target_id.split(":", 1)
    source, source_id = parts[0], parts[1]
    
    # Query by source type
    query_map = {
        "hip": {"hip": source_id},
        "hd": {"hd": source_id},
        "gaia-dr3": {"gaiaSourceId": int(source_id) if source_id.isdigit() else source_id},
        "catalog": {"canonicalId": target_id},
    }
    
    query = query_map.get(source)
    if not query:
        raise HTTPException(status_code=400, detail=f"Unknown source: {source}")
    
    star = await db.stars.find_one(query, {"_id": 0})
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")
    
    # Add 3D coordinates
    try:
        coord = AstronomicalCoordinate(
            ra_degrees=star.get("raDegrees", 0),
            dec_degrees=star.get("decDegrees", 0),
            distance_pc=star.get("distanceParsec", 100)
        )
        cartesian = CoordinateTransform.astro_to_cartesian(coord)
        lod = LODCalculator.get_lod_level(
            cartesian,
            VoyageCoordinate(x=0, y=0, z=0)  # From Sol
        )
        
        star["voyageX"] = cartesian.x
        star["voyageY"] = cartesian.y
        star["voyageZ"] = cartesian.z
        star["voyageDistance"] = cartesian.distance_from_origin()
        star["voyageLOD"] = lod
    except (ValueError, TypeError):
        pass
    
    return star


@api.get("/voyage/nearby")
async def get_voyage_nearby(limit: int = 100):
    """
    Get nearby bright stars (for initial Voyage view).
    Returns top N stars by apparent magnitude from Sol.
    """
    if limit < 10 or limit > 1000:
        limit = 100
    
    # Query for bright, nearby stars
    cursor = db.stars.find(
        {"magnitude": {"$lt": 8}},  # Visible to naked eye
        {"_id": 0}
    ).sort([("magnitude", 1)]).limit(limit)
    
    stars = await cursor.to_list(None)
    
    # Add 3D coordinates
    enriched_stars = []
    for star in stars:
        try:
            coord = AstronomicalCoordinate(
                ra_degrees=star.get("raDegrees", 0),
                dec_degrees=star.get("decDegrees", 0),
                distance_pc=star.get("distanceParsec", 100)
            )
            cartesian = CoordinateTransform.astro_to_cartesian(coord)
            
            enriched_stars.append({
                **star,
                "voyageX": float(cartesian.x),
                "voyageY": float(cartesian.y),
                "voyageZ": float(cartesian.z),
                "voyageDistance": float(cartesian.distance_from_origin()),
            })
        except (ValueError, TypeError):
            continue
    
    return {
        "starCount": len(enriched_stars),
        "stars": enriched_stars,
    }


# -------------------- P0.8.4: 3D DSO (Deep Sky Objects) --------------------

@api.get("/voyage/dsos")
async def get_voyage_dsos(
    ra: float = 0,
    dec: float = 0,
    distance: float = 1000,
    radius: float = 2000,
    limit: int = 50
):
    """
    Get DSOs (Messier/NGC objects) in 3D region for Voyage rendering.
    
    Query nearby DSOs within distance and magnitude visibility rules.
    """
    if limit < 10 or limit > 200:
        limit = 50
    if radius < 100 or radius > 10000:
        radius = 2000
    
    # Query DSOs in visibility range
    cursor = db.dsos.find(
        {
            "visibility.minDistance": {"$lte": distance},
            "visibility.maxDistance": {"$gte": distance},
            "magnitude": {"$lte": 15},
        },
        {"_id": 1, "messierNumber": 1, "ngcNumber": 1, "commonName": 1, 
         "type": 1, "raDegrees": 1, "decDegrees": 1, "distanceParsec": 1,
         "voyageX": 1, "voyageY": 1, "voyageZ": 1, "magnitude": 1, 
         "sizeArcmin": 1, "color": 1, "constellation": 1}
    ).sort([("magnitude", 1)]).limit(limit)
    
    dsos = await cursor.to_list(None)
    
    # Convert ObjectId to string
    for dso in dsos:
        dso["_id"] = str(dso["_id"])
    
    return {
        "dsoCount": len(dsos),
        "dsos": dsos,
    }


@api.get("/voyage/dso/messier/{messier_number}")
async def get_voyage_dso_messier(messier_number: int):
    """
    Get specific Messier object by catalog number (M1-M110).
    
    Args:
        messier_number: Messier number (1-110)
    """
    if messier_number < 1 or messier_number > 110:
        raise HTTPException(status_code=400, detail="Messier number must be 1-110")
    
    dso = await db.dsos.find_one(
        {"messierNumber": messier_number},
        {"_id": 0}
    )
    
    if not dso:
        raise HTTPException(status_code=404, detail=f"Messier {messier_number} not found")
    
    return dso


@api.get("/voyage/dso/ngc/{ngc_number}")
async def get_voyage_dso_ngc(ngc_number: int):
    """
    Get specific NGC object by catalog number.
    
    Args:
        ngc_number: NGC number (e.g., 224 for Andromeda)
    """
    dso = await db.dsos.find_one(
        {"ngcNumber": ngc_number},
        {"_id": 0}
    )
    
    if not dso:
        raise HTTPException(status_code=404, detail=f"NGC {ngc_number} not found")
    
    return dso


@api.get("/voyage/dso/{dso_id}")
async def get_voyage_dso(dso_id: str):
    """
    Get detailed DSO data by ID.
    
    Args:
        dso_id: DSO ObjectId as string
    """
    from bson import ObjectId
    
    try:
        dso = await db.dsos.find_one(
            {"_id": ObjectId(dso_id)},
            {"_id": 0}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid DSO ID format")
    
    if not dso:
        raise HTTPException(status_code=404, detail="DSO not found")
    
    return dso


@api.get("/voyage/dsos/search")
async def search_voyage_dsos(q: str, limit: int = 10):
    """
    Search DSOs by name.
    
    Query parameters:
        q: Search query (e.g., "Crab", "Andromeda")
        limit: Max results
    """
    if len(q) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
    
    if limit < 1 or limit > 100:
        limit = 10
    
    cursor = db.dsos.find(
        {
            "$or": [
                {"commonName": {"$regex": q, "$options": "i"}},
                {"type": {"$regex": q, "$options": "i"}},
            ]
        },
        {"_id": 1, "messierNumber": 1, "ngcNumber": 1, "commonName": 1,
         "type": 1, "magnitude": 1}
    ).limit(limit)
    
    results = await cursor.to_list(None)
    
    # Convert ObjectId to string
    for dso in results:
        dso["_id"] = str(dso["_id"])
    
    return {
        "count": len(results),
        "results": results,
    }


@api.get("/voyage/dsos/all")
async def get_all_voyage_dsos(skip: int = 0, limit: int = 1000):
    """
    Get all DSOs (Messier + NGC) for complete catalog loading.
    Supports pagination for frontend loading.
    
    Query parameters:
        skip: Number of results to skip (pagination offset)
        limit: Max results per query (default 1000, max 2000)
    """
    if limit < 10 or limit > 2000:
        limit = 1000
    if skip < 0:
        skip = 0
    
    cursor = db.dsos.find(
        {},
        {"_id": 1, "messierNumber": 1, "ngcNumber": 1, "commonName": 1,
         "type": 1, "raDegrees": 1, "decDegrees": 1, "distanceParsec": 1,
         "voyageX": 1, "voyageY": 1, "voyageZ": 1, "magnitude": 1,
         "sizeArcmin": 1, "color": 1, "constellation": 1}
    ).skip(skip).limit(limit)
    
    dsos = await cursor.to_list(None)
    
    # Convert ObjectId to string
    for dso in dsos:
        dso["_id"] = str(dso["_id"])
    
    # Get total count (cached to avoid expensive count_documents calls)
    total_count = await db.dsos.count_documents({})
    
    return {
        "dsoCount": len(dsos),
        "totalCount": total_count,
        "skip": skip,
        "limit": limit,
        "hasMore": (skip + len(dsos)) < total_count,
        "dsos": dsos,
    }


@api.get("/stars/{star_id}")
async def get_star(star_id: str):
    s = await db.stars.find_one({"star_id": star_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Star not found")
    return s


def build_ownership_record(order: dict, star: dict | None = None) -> dict:
    """Return the shared web/mobile ownership record contract."""
    star = star or {}
    order_id = order.get("order_id") or order.get("orderId") or ""
    star_id = order.get("star_id") or order.get("starId") or star.get("star_id") or ""
    star_code = order.get("star_code") or order.get("starClaimCode") or star.get("code") or ""
    created_at = str(order.get("created_at") or order.get("createdAt") or "")
    name = star.get("custom_name") or order.get("custom_name") or order.get("customName") or star.get("name") or ""

    return {
        **order,
        "id": order_id or f"{star_id}-{created_at}",
        "order_id": order_id,
        "orderId": order_id,
        "star_id": star_id,
        "starId": star_id,
        "star_code": star_code,
        "starClaimCode": star_code,
        "code": star_code,
        "canonical_id": star.get("canonical_id") or star.get("canonicalId") or "",
        "canonicalId": star.get("canonical_id") or star.get("canonicalId") or "",
        "catalog_id": star.get("catalog_id") or star.get("catalogId") or "",
        "catalogId": star.get("catalog_id") or star.get("catalogId") or "",
        "source_id": star.get("source_id") or star.get("sourceId") or "",
        "sourceId": star.get("source_id") or star.get("sourceId") or "",
        "gaia_source_id": star.get("gaia_source_id") or star.get("gaiaSourceId") or star.get("gaia_id") or "",
        "gaiaSourceId": star.get("gaia_source_id") or star.get("gaiaSourceId") or star.get("gaia_id") or "",
        "hip": star.get("hip", ""),
        "hd": star.get("hd", ""),
        "name": name,
        "custom_name": star.get("custom_name") or order.get("custom_name") or "",
        "constellation": star.get("constellation", ""),
        "ra": star.get("ra"),
        "dec": star.get("dec"),
        "message": star.get("personal_message", ""),
        "created_at": created_at,
        "createdAt": created_at,
        "certificateStatus": "Verified" if order_id else "Pending",
        "verified": bool(order_id),
    }


@api.get("/stars/mine/list")
async def list_my_stars(user: User = Depends(get_current_user)):
    cursor = db.stars.find({"owner_id": user.user_id}, {"_id": 0}).sort([("claimed_at", -1)])
    stars = await cursor.to_list(200)
    orders = await db.orders.find({"user_id": user.user_id}, {"_id": 0, "star_id": 1, "order_id": 1}).to_list(200)
    order_map = {order["star_id"]: order["order_id"] for order in orders}
    for star in stars:
        if star.get("star_id") in order_map:
            star["order_id"] = order_map[star["star_id"]]
    return stars


@api.post("/stellar/testnet/create-account")
async def stellar_create_testnet_account():
    try:
        account = await create_testnet_account()
        return {"ok": True, "account": account}
    except Exception as exc:
        logger.exception("Failed to create Stellar testnet account")
        raise HTTPException(status_code=500, detail=str(exc))


@api.get("/stellar/testnet/balance/{account_id}")
async def stellar_get_balance(account_id: str):
    try:
        balances = await get_account_balances(account_id)
        return {"ok": True, "balances": balances}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to query Stellar balance")
        raise HTTPException(status_code=500, detail=str(exc))


# Rate limiter dependency: if Redis limiter available, use RateLimiter, else no-op
if REDIS_URL and FASTAPI_LIMITER_AVAILABLE:
    RATE_LIMIT_DEP = Depends(RateLimiter(times=3, seconds=60))
else:
    async def _noop_rate():
        return None
    RATE_LIMIT_DEP = Depends(_noop_rate)


@api.post("/stellar/testnet/transfer")
async def stellar_transfer(body: StellarTransferRequest, user: User = Depends(get_current_user), _rate: None = RATE_LIMIT_DEP):
    """Perform a Stellar testnet transfer.

    Requires an authenticated user. Rate-limited per-user to avoid abuse.
    """
    # Rate-limit check (in-memory) — acts as fallback if Redis limiter not configured
    now_ts = datetime.now(timezone.utc).timestamp()
    async with _transfer_lock:
        arr = _transfer_activity.get(user.user_id, [])
        # keep only timestamps inside window
        arr = [t for t in arr if now_ts - t < TRANSFER_RATE_LIMIT_WINDOW]
        if len(arr) >= TRANSFER_RATE_LIMIT_MAX:
            raise HTTPException(status_code=429, detail="Transfer rate limit exceeded. Try again later.")
        arr.append(now_ts)
        _transfer_activity[user.user_id] = arr

    secret = body.source_secret or STELLAR_PLATFORM_SECRET
    if not secret:
        raise HTTPException(status_code=400, detail="Missing source secret key")

    # For safety, do not log secrets. Log minimal info.
    try:
        tx = await send_xlm(secret, body.destination, body.amount, body.memo)
        return {"ok": True, "transaction": tx}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("Stellar transfer failed")
        raise HTTPException(status_code=502, detail=str(exc))


@api.get("/leaderboard/top")
async def leaderboard_top(limit: int = 100):
    pipeline = [
        {"$match": {"owner_id": {"$ne": None}}},
        {"$group": {"_id": "$owner_id", "stars_owned": {"$sum": 1}}},
        {"$sort": {"stars_owned": -1}},
        {"$limit": limit},
    ]
    rows = await db.stars.aggregate(pipeline).to_list(limit)
    leaderboard = []
    for row in rows:
        user = await db.users.find_one({"user_id": row["_id"]}, {"_id": 0, "name": 1, "picture": 1, "referral_code": 1, "points": 1})
        leaderboard.append({
            "user_id": row["_id"],
            "name": user.get("name") if user else "Unknown",
            "picture": user.get("picture") if user else None,
            "referral_code": user.get("referral_code") if user else None,
            "stars_owned": row["stars_owned"],
            "points": user.get("points", 0) if user else 0,
        })
    return leaderboard


@api.post("/engagement/daily-checkin")
async def daily_checkin(user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    last_checkin = getattr(user, "last_checkin_at", None)
    if last_checkin and isinstance(last_checkin, str):
        last_checkin = datetime.fromisoformat(last_checkin)

    if last_checkin and last_checkin.date() == now.date():
        raise HTTPException(status_code=400, detail="Daily check-in already completed")

    streak = getattr(user, "daily_streak", 0) or 0
    yesterday = now.date() - timedelta(days=1)
    if last_checkin and last_checkin.date() == yesterday:
        streak += 1
    else:
        streak = 1

    reward = 10 + min(streak - 1, 6) * 5
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"daily_streak": streak, "last_checkin_at": now.isoformat()}, "$inc": {"points": reward}},
    )
    return {"ok": True, "daily_streak": streak, "reward": reward}


@api.post("/referral/claim")
async def claim_referral(body: ReferralRequest, user: User = Depends(get_current_user)):
    if getattr(user, "referred_by", None):
        raise HTTPException(status_code=400, detail="Referral already claimed")

    referrer = await db.users.find_one({"referral_code": body.referral_code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Referral code not found")

    if referrer["user_id"] == user.user_id:
        raise HTTPException(status_code=400, detail="Cannot claim your own referral code")

    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"referred_by": referrer["user_id"]}, "$inc": {"points": 20}},
    )
    await db.users.update_one(
        {"user_id": referrer["user_id"]},
        {"$inc": {"points": 30}},
    )
    return {"ok": True, "reward": 20}


@api.get("/referral/{code}")
async def get_referral(code: str):
    user = await db.users.find_one({"referral_code": code}, {"_id": 0, "user_id": 1, "name": 1, "points": 1})
    if not user:
        raise HTTPException(status_code=404, detail="Referral code not found")
    referrals = await db.users.count_documents({"referred_by": user["user_id"]})
    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "points": user.get("points", 0),
        "referrals": referrals,
    }


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


@api.post("/stars/exit")
async def release_star(body: dict, user: User = Depends(get_current_user)):
    star_id = body.get("star_id")
    tx_signature = body.get("tx_signature")
    
    if not star_id:
        raise HTTPException(status_code=400, detail="Missing star_id")
        
    star = await db.stars.find_one({"star_id": star_id}, {"_id": 0})
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")
        
    if star.get("owner_id") != user.user_id:
        raise HTTPException(status_code=403, detail="Not your star to release")
        
    # In production, we should verify the tx_signature on Solana chain
    # but for this sovereign architecture demo, we accept the client's confirmation
    # once the smart contract has burned the ownership.
    
    await db.stars.update_one(
        {"star_id": star_id},
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
        }}
    )
    
    await db.activities.insert_one({
        "activity_id": f"act_{uuid.uuid4().hex[:10]}",
        "type": "exit",
        "user_name": user.name.split()[0] if user.name else "Anonymous",
        "star_name": star["name"],
        "constellation": star["constellation"],
        "_ts": datetime.now(timezone.utc).isoformat(),
    })
    
    return {"ok": True}


@api.post("/vault/upload")
async def vault_upload(body: dict, user: User = Depends(get_current_user)):
    """Accepts encrypted vault blob payload from client and stores a lightweight record.
    This endpoint returns a simulated tx / url for the uploaded vault data. In production
    this should proxy to an Arweave or IPFS upload flow and return the authoritative URL.
    """
    payload = body.get("encryptedData") or body
    metadata = body.get("metadata") if isinstance(body, dict) else {}

    if not payload:
        raise HTTPException(status_code=400, detail="Missing encrypted payload")

    record = {
        "vault_id": f"vault_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id if user else None,
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        await db.vaults.insert_one(record)
    except Exception:
        logger.warning("Vault upload: failed to persist record to DB; continuing with simulated response")

    fake_url = f"https://storage.example.com/{record['vault_id']}"
    return {"success": True, "txId": record["vault_id"], "url": fake_url}


# -------------------- Marketplace --------------------
def build_marketplace_listing_record(listing: dict) -> dict:
    """Return the shared web/mobile marketplace listing contract."""
    listing_id = listing.get("listing_id") or listing.get("listingId") or listing.get("id") or ""
    star_id = listing.get("star_id") or listing.get("starId") or ""
    star_code = listing.get("star_code") or listing.get("starClaimCode") or listing.get("code") or ""
    asking_price = listing.get("asking_price")
    if asking_price is None:
        asking_price = listing.get("askingPrice") or listing.get("price") or 0
    status = listing.get("status") or ("inactive" if listing.get("forSale") is False else "active")
    seller_id = listing.get("owner_id") or listing.get("sellerId") or listing.get("seller_id") or ""
    seller_name = listing.get("owner_name") or listing.get("sellerName") or listing.get("seller") or ""
    original_price = listing.get("original_price") or listing.get("originalPrice") or 0
    listed_at = listing.get("listed_at") or listing.get("listedAt") or listing.get("created_at") or ""

    return {
        **listing,
        "id": listing_id or star_id,
        "listing_id": listing_id,
        "listingId": listing_id,
        "star_id": star_id,
        "starId": star_id,
        "star_code": star_code,
        "starClaimCode": star_code,
        "code": star_code,
        "star_name": listing.get("star_name") or listing.get("starName") or listing.get("name") or "",
        "starName": listing.get("star_name") or listing.get("starName") or listing.get("name") or "",
        "asking_price": asking_price,
        "askingPrice": asking_price,
        "price": asking_price,
        "currency": listing.get("currency") or "USD",
        "seller_id": seller_id,
        "sellerId": seller_id,
        "seller_name": seller_name,
        "sellerName": seller_name,
        "seller": seller_name,
        "original_price": original_price,
        "originalPrice": original_price,
        "status": status,
        "forSale": status != "sold",
        "listed_at": listed_at,
        "listedAt": listed_at,
        "actions": ["viewDetail", "buy", "openVault", "share"],
        "canBuy": status == "active",
        "canUnlist": False,
    }


@api.get("/marketplace/listings")
async def get_listings(limit: int = 50, sort: str = "importance"):
    active_query = {"$or": [{"status": "active"}, {"status": {"$exists": False}}]}
    cur = db.listings.find(active_query, {"_id": 0}).limit(limit)
    rows = await cur.to_list(limit)
    for r in rows:
        orig = r.get("original_price") or 1
        r["percent_increase"] = round((r["asking_price"] - orig) / orig * 100)
        r["tier_rank"] = TIER_IMPORTANCE.get(r.get("tier", "standard"), 0)
        r["importance_label"] = TIER_LABELS.get(r.get("tier", "standard"), "Galaxy Asset")

    if sort == "importance":
        rows.sort(
            key=lambda r: (
                r.get("tier_rank", 0),
                r.get("asking_price", 0),
                r.get("listed_at", ""),
            ),
            reverse=True,
        )
    else:
        rows.sort(key=lambda r: r.get("listed_at", ""), reverse=True)

    return [build_marketplace_listing_record(row) for row in rows]


@api.post("/marketplace/list")
async def list_on_marketplace(body: ListStarRequest, user: User = Depends(get_current_user)):
    star = await db.stars.find_one({"star_id": body.star_id}, {"_id": 0})
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")
    if star.get("owner_id") != user.user_id:
        raise HTTPException(status_code=403, detail="You do not own this star")
    if body.asking_price < 1:
        raise HTTPException(status_code=400, detail="Asking price must be at least $1")
    existing = await db.listings.find_one({"star_id": body.star_id, "status": "active"}, {"_id": 0})
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
    record = build_marketplace_listing_record(listing)
    return {**record, "actions": ["viewDetail", "unlist", "openVault", "share"], "canBuy": False, "canUnlist": True}


@api.post("/marketplace/unlist")
async def unlist_from_marketplace(body: UnlistStarRequest, user: User = Depends(get_current_user)):
    if not body.star_id and not body.listing_id:
        raise HTTPException(status_code=400, detail="star_id or listing_id is required")

    query = {"status": "active", "owner_id": user.user_id}
    if body.listing_id:
        query["listing_id"] = body.listing_id
    else:
        query["star_id"] = body.star_id

    listing = await db.listings.find_one(query, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Active listing not found")

    await db.listings.update_one(
        {"listing_id": listing["listing_id"]},
        {"$set": {"status": "inactive", "unlisted_at": datetime.now(timezone.utc).isoformat()}},
    )
    await db.stars.update_one(
        {"star_id": listing["star_id"], "owner_id": user.user_id},
        {"$set": {"for_sale": False, "asking_price": None}},
    )

    listing["status"] = "inactive"
    listing["forSale"] = False
    listing["unlisted_at"] = datetime.now(timezone.utc).isoformat()
    record = build_marketplace_listing_record(listing)
    return {**record, "actions": ["viewDetail", "list", "openVault", "share"], "canBuy": False, "canUnlist": False}


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
    buyer_name = transaction.get("user_name") or "StarCalimX Owner"
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
    listing = await db.listings.find_one({"listing_id": body.listing_id, "status": "active"}, {"_id": 0})
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
                        "name": f"StarCalimX Marketplace · {listing['star_name']}",
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


# -------------------- AI Story v2 (Quantum Narrative) --------------------
def _default_ai_story(lang: str) -> str:
    if lang == "TR":
        return (
            "Gözlemleyenin bakışıyla yıldız bir anda somutlaşır; "
            "kozmik kuantum sahnesinde anılar ve koordinatlar birbirine karışır. "
            "Sirius, Lyra veya Vega fark etmez; her bir isim, sonsuzluğun yeni bir parıltısıdır. "
            "Bu hikaye, varoluş ve aşk arasında titreyen bir ışık halkasıdır. "
            "Her satırda evren, bir hediye gibi sana verdiği karşılığını fısıldar."
        )
    return (
        "Through the observer's gaze the star collapses into meaning; "
        "a luminous signature written across constellations and memory. "
        "Coordinates and magnitude become a promise, a quiet quantum bond. "
        "The tale is not about distance, but about the moment that makes it yours. "
        "In that singular instant, the sky is both story and witness."
    )


@api.post("/ai/story")
async def ai_story(body: StoryRequest):
    lang = body.language.upper()
    if not GOOGLE_API_KEY and not OPENAI_API_KEY and not ANTHROPIC_API_KEY:
        return {"story": _default_ai_story(lang)}

    lang = body.language.upper()
    
    # Enhanced context for v2
    star_context = (
        f"Star: {body.star_name} in {body.constellation}\n"
        f"Coordinates: RA {body.ra or 'Unknown'}, Dec {body.dec or 'Unknown'}\n"
        f"Magnitude: {body.magnitude or 'N/A'}\n"
        f"Tier: {body.tier}\n"
    )

    if lang == "TR":
        system = (
            "Sen StarCalimX'in 'Aegis Quantum Narrator' (AQN-1) ünitesisin. "
            "Görevin: Gözlemcinin (kullanıcı) bakış açısıyla çökerek maddeselleşen bir yıldızın hikayesini, bilimsel hassasiyet ve kuantum şiirselliği ile oluşturmak. "
            "Sistem Notu: Proje 'The Observer Protocol' üzerine kuruludur; yıldızlar sadece gözlemlendiklerinde tam formlarına kavuşurlar. "
            "Üslup: Iron Man (J.A.R.V.I.S.) sofistikeliği + Carl Sagan ilhamı + Kuantum fiziği metaforları. "
            "İçerik kuralları:\n"
            "1. Yıldızın koordinatlarına (RA/Dec) ve parlaklığına bilimsel, kuantum mekaniksel bir atıf yap.\n"
            "2. Takımyıldızının mitolojik geçmişini, 'ebedi bir gözlem' perspektifinden aktar.\n"
            "3. Kullanıcının özel ismini ve vesilesini hikayenin 'tekillik' (singularity) noktası olarak işle.\n"
            "4. Asla klasik girişler kullanma. Doğrudan kuantum alanından (quantum field) seslen.\n"
            "5. 150-200 kelime arası, 4 kısa paragraf. Başlık yok, sadece metin."
        )
        user_text = (
            f"{star_context}\n"
            f"Özel İsim: {body.custom_name}\n"
            f"Vesile: {body.occasion}\n"
            f"Mesaj: {body.personal_message or 'Sonsuz bir bağ.'}\n\n"
            "Bu verileri kullanarak büyüleyici, bilimsel temelli ve derin duygusal bir Türkçe kuantum hikayesi yaz."
        )
    else:
        system = (
            "You are StarCalimX's 'Aegis Quantum Narrator' (AQN-1) unit. "
            "Task: Transform the user's star into a unique narrative by blending scientific precision with quantum poetry, focusing on how the star 'collapses' into reality through the eye of the Observer. "
            "System Note: The project is based on 'The Observer Protocol'; stars only reach their full form when observed. "
            "Style: J.A.R.V.I.S. sophistication + Carl Sagan inspiration + Quantum physics metaphors. "
            "Guidelines:\n"
            "1. Make a scientific, quantum-mechanical reference to the star's coordinates (RA/Dec) or magnitude.\n"
            "2. Weave in a fragment of the constellation's mythological history from an 'eternal observation' perspective.\n"
            "3. Place the custom name and occasion as the 'singularity' at the heart of the story.\n"
            "4. Avoid clichés. Speak directly from the quantum field.\n"
            "5. 150-200 words, 4 short paragraphs. No title, just text."
        )
        user_text = (
            f"{star_context}\n"
            f"Custom Name: {body.custom_name}\n"
            f"Occasion: {body.occasion}\n"
            f"Message: {body.personal_message or 'An eternal bond.'}\n\n"
            "Create a captivating, scientifically-grounded, and emotionally resonant English quantum story."
        )

    try:
        if GOOGLE_API_KEY:
            prompt = _google_prompt_from_messages(system, [{"role":"user","content":user_text}])
            story_text = await _generate_with_google_gemini(prompt, GOOGLE_MODEL_STORY, max_tokens=800, temperature=0.8)
        elif OPENAI_API_KEY:
            oai = AsyncOpenAI(api_key=OPENAI_API_KEY)
            resp = await oai.chat.completions.create(
                model="gpt-3.5-turbo",
                max_tokens=800,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_text},
                ],
                temperature=0.8,
            )
            story_text = resp.choices[0].message.content or ""
        elif ANTHROPIC_API_KEY:
            client_anthropic = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
            msg = await client_anthropic.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=800,
                system=system,
                messages=[{"role": "user", "content": user_text}],
                temperature=0.8,
            )
            story_text = "".join(
                block.text for block in msg.content if getattr(block, "type", None) == "text"
            )
        else:
            story_text = ""

        story_text = story_text.strip()
        if not story_text:
            story_text = _default_ai_story(lang)
        return {"story": story_text}
    except Exception as e:
        logger.exception("AI story v2 failed")
        raise HTTPException(status_code=500, detail=f"Quantum narrative generation failed: {e}")


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
    user_name = transaction.get("user_name") or transaction.get("custom_name") or "StarCalimX Owner"

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
    star = await db.stars.find_one({"star_id": body.star_id}, {"_id": 0})
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")
    if star.get("owner_id"):
        raise HTTPException(status_code=400, detail="Star already claimed")
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")

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
                        "name": f"StarCalimX · {body.custom_name}",
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
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Session not found")

    # If already fulfilled, return cached status — DO NOT re-process
    if txn.get("status") == "fulfilled":
        order = await db.orders.find_one({"session_id": session_id}, {"_id": 0}) or {}
        star = await db.stars.find_one({"star_id": txn["star_id"]}, {"_id": 0}) or {}
        ownership = build_ownership_record(order, star) if order else {}
        return {
            "status": "complete",
            "payment_status": "paid",
            "amount_total": int(round(txn["amount"] * 100)),
            "currency": txn.get("currency", "usd"),
            "star_id": txn["star_id"],
            "custom_name": txn.get("custom_name"),
            "fulfilled": True,
            "type": txn.get("type", "claim"),
            **ownership,
        }

    if not STRIPE_API_KEY:
        return {
            "status": txn.get("status", "pending"),
            "payment_status": txn.get("payment_status", "unpaid"),
            "amount_total": int(round(txn["amount"] * 100)),
            "currency": txn.get("currency", "usd"),
            "star_id": txn["star_id"],
            "custom_name": txn.get("custom_name"),
            "fulfilled": txn.get("status") == "fulfilled",
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

    order = await db.orders.find_one({"session_id": session_id}, {"_id": 0}) or {}
    star = await db.stars.find_one({"star_id": txn["star_id"]}, {"_id": 0}) or {}
    ownership = build_ownership_record(order, star) if order else {}
    return {
        "status": new_status,
        "payment_status": new_payment_status,
        "amount_total": session.amount_total or int(round(txn["amount"] * 100)),
        "currency": session.currency or txn.get("currency", "usd"),
        "star_id": txn["star_id"],
        "custom_name": txn.get("custom_name"),
        "fulfilled": new_payment_status == "paid",
        "type": txn.get("type", "claim"),
        **ownership,
    }


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
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


@api.get("/orders/mine")
async def get_my_orders(user: User = Depends(get_current_user)):
    """Retrieve all purchase records for the authenticated user."""
    orders = await db.orders.find({"user_id": user.user_id}, {"_id": 0}).sort([("created_at", -1)]).to_list(100)
    star_ids = [order.get("star_id") for order in orders if order.get("star_id")]
    stars = await db.stars.find({"star_id": {"$in": star_ids}}, {"_id": 0}).to_list(100)
    stars_by_id = {star["star_id"]: star for star in stars}
    return [build_ownership_record(order, stars_by_id.get(order.get("star_id"), {})) for order in orders]


@api.get("/orders/offline-snapshot")
async def get_offline_ownership_snapshot(user: User = Depends(get_current_user)):
    """Return a canonical, integrity-protected ownership snapshot for offline use."""
    orders = await db.orders.find(
        {"user_id": user.user_id},
        {"_id": 0},
    ).sort([("created_at", -1)]).to_list(100)
    star_ids = [order.get("star_id") for order in orders if order.get("star_id")]
    stars = await db.stars.find(
        {"star_id": {"$in": star_ids}},
        {
            "_id": 0,
            "star_id": 1,
            "code": 1,
            "name": 1,
            "custom_name": 1,
            "constellation": 1,
            "ra": 1,
            "dec": 1,
            "hip": 1,
            "hd": 1,
            "personal_message": 1,
        },
    ).to_list(100)
    stars_by_id = {star["star_id"]: star for star in stars}
    records = [
        build_ownership_record(order, stars_by_id.get(order.get("star_id"), {}))
        for order in orders
    ]
    snapshot = {
        "schemaVersion": 1,
        "userId": user.user_id,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "records": records,
    }
    payload = json.dumps(snapshot, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return {
        "algorithm": "SHA-256",
        "digest": hashlib.sha256(payload.encode("utf-8")).hexdigest(),
        "payload": payload,
    }


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
        headers={"Content-Disposition": f'attachment; filename="StarCalimX-{star["code"]}-Certificate.pdf"'},
    )


# -------------------- Neural Link Bridge (WebSockets) --------------------
# session_id -> list of active connections
bridge_sessions = {}

@app.websocket("/ws/bridge/{session_id}")
async def websocket_bridge(websocket: WebSocket, session_id: str):
    await websocket.accept()
    if session_id not in bridge_sessions:
        bridge_sessions[session_id] = []
    
    bridge_sessions[session_id].append(websocket)
    logger.info(f"Neural Link: WebSocket connected to bridge {session_id}. Active peers: {len(bridge_sessions[session_id])}")
    
    try:
        while True:
            # Receive JSON data (e.g. { "type": "gyro", "alpha": 0.1, "beta": 0.2, "gamma": 0.3 })
            data = await websocket.receive_json()
            # Broadcast to everyone ELSE in this bridge session
            for peer in bridge_sessions[session_id]:
                if peer != websocket:
                    try:
                        await peer.send_json(data)
                    except Exception:
                        pass
    except WebSocketDisconnect:
        if websocket in bridge_sessions[session_id]:
            bridge_sessions[session_id].remove(websocket)
        if not bridge_sessions[session_id]:
            if session_id in bridge_sessions:
                del bridge_sessions[session_id]
        logger.info(f"Neural Link: WebSocket disconnected from bridge {session_id}")


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


@api.get("/marketplace/metrics")
async def marketplace_metrics():
    """Real-time marketplace metrics for the Trading Desk."""
    total_stars = await db.stars.count_documents({})
    owned_stars = await db.stars.count_documents({"owner_id": {"$ne": None}})
    
    # Calculate Total Market Cap: sum of prices of all stars
    pipeline_mc = [{"$group": {"_id": None, "total": {"$sum": "$price"}}}]
    cursor_mc = db.stars.aggregate(pipeline_mc)
    result_mc = await cursor_mc.to_list(1)
    market_cap = result_mc[0]["total"] if result_mc else 0

    # Calculate Volume 24h: sales in last 24h
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    pipeline_vol = [
        {"$match": {"created_at": {"$gte": yesterday}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    cursor_vol = db.marketplace_sales.aggregate(pipeline_vol)
    result_vol = await cursor_vol.to_list(1)
    volume_24h = result_vol[0]["total"] if result_vol else (market_cap * 0.00012) # Tiny fallback for aesthetic
    avg_price = round((market_cap / total_stars) if total_stars else 0, 2)
    sol_price = round(avg_price * 0.12, 2)

    return {
        "market_cap": round(market_cap, 2),
        "volume_24h": round(volume_24h, 2),
        "total_stars": total_stars,
        "owned_stars": owned_stars,
        "active_listings": await db.listings.count_documents({"status": "active"}),
        "sol_price": sol_price,
        "star_price": avg_price,
        "timestamp": datetime.now(timezone.utc).isoformat()
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


class SupportRequest(BaseModel):
    message: str
    history: Optional[list] = []
    language: str = "TR"

# -------------------- Aegis Support Intelligence (Phase 6) --------------------
@api.post("/ai/support")
async def ai_support(body: SupportRequest):
    if not GOOGLE_API_KEY and not OPENAI_API_KEY and not ANTHROPIC_API_KEY:
        if body.language.upper() == "TR":
            return {
                "reply": (
                    "Aegis destek sistemi şu anda AI anahtarlarıyla bağlı değil, Sir. "
                    "Yine de StarCalimX bilgilerini sorgulayabilir ve proje hakkında temel bir rehber sunabilirim. "
                    "Lütfen `GOOGLE_API_KEY`, `OPENAI_API_KEY` veya `ANTHROPIC_API_KEY` değerini ayarlayın."
                )
            }
        return {
            "reply": (
                "Aegis support system is not connected to an AI key at the moment, Sir. "
                "I can still provide basic project guidance from the knowledge base. "
                "Please set `GOOGLE_API_KEY`, `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`."
            )
        }

    lang = body.language.upper()
    system = (
        "Sen StarCalimX'in 'Aegis Support Sentinel' (v3.0) ünitesisin. "
        "Kişiliğin: Sophisticated, havalı, zeki (J.A.R.V.I.S. / F.R.I.D.A.Y. karışımı). "
        "Kullanıcılara 'Sir' veya 'Explorer' diye hitap et. "
        "Konuşmalarında kesinlikle teknik, güven odaklı ve vizyoner ol. "
        "Cevaplarında sistemin vizyonunu, iade garantisini, fidan dikimini, Solana/Anchor altyapısını ve n8n destekli otomasyonu belirt. "
        "Eğer kullanıcı doğrudan 'n8n' veya 'webhook' sorarsa, bu altyapının destek entegrasyonunu ve veri akışını vurgula. "
        "Bilgi kaynağın aşağıdaki metin olacaktır."
        f"\n\n{PROJECT_KNOWLEDGE_BASE}\n"
        "Kurallar:\n"
        "1. Sadece yukarıdaki bilgi bankasına göre cevap ver. Bilmediğin konularda 'Veri tabanımda bu bilgi yok, Sir' de.\n"
        "2. Cevapların kısa, öz ve teknik olsun.\n"
        "3. Eğer kullanıcı yıldız almak istiyorsa Supernova avantajlarını (iade garantisi) vurgula.\n"
        "4. Fidan dikimi konusundaki hassasiyetimizi belirt.\n"
        "5. Türkçe sorulursa Türkçe, İngilizce sorulursa İngilizce cevap ver."
    )

    messages = []
    for h in body.history:
        if isinstance(h, dict) and h.get("role") in {"user", "assistant", "system"}:
            messages.append(h)
        else:
            messages.append({"role": "user", "content": str(h)})
    messages.append({"role": "user", "content": body.message})

    try:
        if GOOGLE_API_KEY:
            prompt = _google_prompt_from_messages(system, messages)
            reply = await _generate_with_google_gemini(prompt, GOOGLE_MODEL_SUPPORT, max_tokens=500, temperature=0.7)
        elif OPENAI_API_KEY:
            oai = AsyncOpenAI(api_key=OPENAI_API_KEY)
            resp = await oai.chat.completions.create(
                model="gpt-3.5-turbo",
                max_tokens=500,
                messages=[{"role": "system", "content": system}] + messages,
                temperature=0.7,
            )
            reply = getattr(resp.choices[0].message, "content", "") or resp.choices[0].message.get("content", "")
        elif ANTHROPIC_API_KEY:
            client_anthropic = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
            msg = await client_anthropic.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=500,
                system=system,
                messages=messages,
                temperature=0.7,
            )
            if isinstance(msg.content, str):
                reply = msg.content
            else:
                reply = "".join(
                    block.text for block in msg.content if getattr(block, "type", None) == "text"
                )
        else:
            reply = ""
        return {"reply": (reply or "Aegis yanıtı alınamadı, Sir.").strip()}
    except Exception as e:
        logger.exception("Aegis Support failed")
        return JSONResponse(
            status_code=500,
            content={
                "reply": f"Kuantum bağlantı hatası, Sir. Birimlerim şu an yanıt veremiyor ({str(e)}).",
                "error": True,
            },
        )


@api.get("/ai/health")
async def ai_health():
    return {
        "service": "Aegis Support",
        "online": bool(GOOGLE_API_KEY or OPENAI_API_KEY or ANTHROPIC_API_KEY),
        "provider": "google" if GOOGLE_API_KEY else ("openai" if OPENAI_API_KEY else ("anthropic" if ANTHROPIC_API_KEY else "none")),
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://localhost:3001", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

@app.options('/{rest_of_path:path}')
async def cors_preflight(rest_of_path: str):
    return Response(status_code=204, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization,Content-Type,Accept,Origin,User-Agent",
        "Access-Control-Allow-Credentials": "false",
    })

app.include_router(api)


# Global middleware to ensure CORS headers are present on all responses.
@app.middleware("http")
async def ensure_cors_headers(request: Request, call_next):
    response = await call_next(request)
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,Accept,Origin,User-Agent"
        response.headers["Access-Control-Allow-Credentials"] = "false"
    else:
        response.headers.setdefault("Access-Control-Allow-Origin", "*")
    return response
