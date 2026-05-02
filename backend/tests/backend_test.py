"""
StarClaim backend API regression tests.
Covers: health, stars catalog + filters, constellations, single star,
marketplace listings, stats overview, live activities, newsletter,
AI story (TR & EN), auth-protected endpoints (mock session via Mongo).
"""
import os
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path("/app/backend/.env"))

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL",
                          "https://cosmic-marketplace-5.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

mongo = MongoClient(MONGO_URL)
db = mongo[DB_NAME]


# --------- fixtures ---------
@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def mock_session():
    """Create a test user + session directly in Mongo."""
    user_id = f"test-user-{uuid.uuid4().hex[:8]}"
    session_token = f"test_session_{uuid.uuid4().hex}"
    db.users.insert_one({
        "user_id": user_id,
        "email": f"TEST_{user_id}@example.com",
        "name": "TEST User One",
        "picture": "https://via.placeholder.com/150",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    yield {"user_id": user_id, "token": session_token}
    # cleanup
    db.user_sessions.delete_many({"user_id": user_id})
    db.users.delete_many({"user_id": user_id})
    db.stars.update_many({"owner_id": user_id},
                         {"$set": {"owner_id": None, "owner_name": None,
                                   "custom_name": None, "personal_message": None,
                                   "occasion": None, "claimed_at": None}})
    db.orders.delete_many({"user_id": user_id})


@pytest.fixture(scope="session")
def auth_headers(mock_session):
    return {"Authorization": f"Bearer {mock_session['token']}",
            "Content-Type": "application/json"}


# --------- health ---------
class TestHealth:
    def test_root(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"
        assert data.get("service") == "StarClaim API"


# --------- stars catalog ---------
class TestStars:
    def test_list_all_stars_seeded(self, api_client):
        r = api_client.get(f"{API}/stars", params={"limit": 500})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 53, f"expected >=53 seeded stars, got {len(data)}"
        star = data[0]
        for k in ["star_id", "code", "name", "constellation", "tier", "price"]:
            assert k in star
        assert "_id" not in star

    def test_filter_by_tier(self, api_client):
        r = api_client.get(f"{API}/stars", params={"tier": "legendary"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(s["tier"] == "legendary" for s in data)

    def test_filter_by_constellation(self, api_client):
        # first get list of constellations
        c = api_client.get(f"{API}/stars/constellations").json()
        assert len(c) > 0
        target = c[0]
        r = api_client.get(f"{API}/stars", params={"constellation": target})
        assert r.status_code == 200
        assert all(s["constellation"] == target for s in r.json())

    def test_filter_available(self, api_client):
        r = api_client.get(f"{API}/stars", params={"available": "true"})
        assert r.status_code == 200
        assert all(s.get("owner_id") is None for s in r.json())

    def test_filter_price_range(self, api_client):
        r = api_client.get(f"{API}/stars", params={"min_price": 100, "max_price": 500})
        assert r.status_code == 200
        for s in r.json():
            assert 100 <= s["price"] <= 500

    def test_sort_price_desc(self, api_client):
        r = api_client.get(f"{API}/stars", params={"sort": "price_desc", "limit": 20})
        assert r.status_code == 200
        prices = [s["price"] for s in r.json()]
        assert prices == sorted(prices, reverse=True)

    def test_constellations_endpoint(self, api_client):
        r = api_client.get(f"{API}/stars/constellations")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data == sorted(data)

    def test_get_single_star(self, api_client):
        lst = api_client.get(f"{API}/stars", params={"limit": 1}).json()
        sid = lst[0]["star_id"]
        r = api_client.get(f"{API}/stars/{sid}")
        assert r.status_code == 200
        assert r.json()["star_id"] == sid

    def test_get_star_not_found(self, api_client):
        r = api_client.get(f"{API}/stars/nonexistent_id")
        assert r.status_code == 404


# --------- marketplace ---------
class TestMarketplace:
    def test_listings_seeded(self, api_client):
        r = api_client.get(f"{API}/marketplace/listings")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 6
        for l in data:
            assert "percent_increase" in l
            assert l["asking_price"] >= 0
            assert "_id" not in l


# --------- stats / activities ---------
class TestStatsAndActivities:
    def test_stats_overview(self, api_client):
        r = api_client.get(f"{API}/stats/overview")
        assert r.status_code == 200
        d = r.json()
        for k in ["total_stars", "owned", "available", "claimed_today", "marketplace_listings"]:
            assert k in d
        assert d["total_stars"] == d["owned"] + d["available"]
        assert d["claimed_today"] >= 24

    def test_live_activities(self, api_client):
        r = api_client.get(f"{API}/activities/live")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 10
        assert "_id" not in data[0]


# --------- newsletter ---------
class TestNewsletter:
    def test_subscribe(self, api_client):
        email = f"TEST_news_{uuid.uuid4().hex[:8]}@example.com"
        r = api_client.post(f"{API}/newsletter", json={"email": email})
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True
        assert d["email"] == email
        # cleanup
        db.newsletter.delete_one({"email": email})

    def test_subscribe_invalid_email(self, api_client):
        r = api_client.post(f"{API}/newsletter", json={"email": "not-an-email"})
        assert r.status_code in (400, 422)


# --------- auth ---------
class TestAuthProtection:
    def test_me_without_session(self, api_client):
        r = requests.get(f"{API}/auth/me")  # no session
        assert r.status_code == 401

    def test_claim_without_auth(self, api_client):
        r = requests.post(f"{API}/stars/claim",
                          json={"star_id": "x", "custom_name": "y"})
        assert r.status_code == 401

    def test_my_stars_without_auth(self, api_client):
        r = requests.get(f"{API}/stars/mine/list")
        assert r.status_code == 401

    def test_me_with_valid_session(self, auth_headers, mock_session):
        r = requests.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["user_id"] == mock_session["user_id"]
        assert "_id" not in d


# --------- claim flow ---------
class TestClaimFlow:
    def test_claim_and_mine_list(self, api_client, auth_headers, mock_session):
        # pick an available star
        avail = api_client.get(f"{API}/stars", params={"available": "true", "limit": 5}).json()
        assert avail, "no available stars"
        star_id = avail[0]["star_id"]

        payload = {
            "star_id": star_id,
            "custom_name": "TEST Cosmic Heart",
            "personal_message": "TEST message",
            "occasion": "anniversary",
            "package": "standard",
            "gift": False,
        }
        r = requests.post(f"{API}/stars/claim", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "order_id" in d
        assert d["star"]["owner_id"] == mock_session["user_id"]
        assert d["star"]["custom_name"] == "TEST Cosmic Heart"

        # mine list
        r2 = requests.get(f"{API}/stars/mine/list", headers=auth_headers)
        assert r2.status_code == 200
        mine = r2.json()
        assert any(s["star_id"] == star_id for s in mine)

        # claim again -> 400
        r3 = requests.post(f"{API}/stars/claim", headers=auth_headers, json=payload)
        assert r3.status_code == 400


# --------- AI story ---------
class TestAIStory:
    def test_story_tr(self, api_client):
        payload = {
            "star_name": "Sirius",
            "constellation": "Canis Major",
            "custom_name": "Ebedi Işık",
            "personal_message": "Seninle her an özel.",
            "occasion": "anniversary",
            "language": "TR",
        }
        r = api_client.post(f"{API}/ai/story", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "story" in d
        assert len(d["story"]) > 100

    def test_story_en(self, api_client):
        payload = {
            "star_name": "Vega",
            "constellation": "Lyra",
            "custom_name": "Eternal Light",
            "personal_message": "Every moment with you is special.",
            "occasion": "birthday",
            "language": "EN",
        }
        r = api_client.post(f"{API}/ai/story", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "story" in d
        assert len(d["story"]) > 100


# --------- certificate PDF module ---------
class TestCertificateModule:
    def test_generate_certificate_returns_pdf_bytes(self):
        import sys
        sys.path.insert(0, "/app/backend")
        from certificate import generate_certificate
        pdf = generate_certificate(
            star_name="Sirius",
            constellation="Canis Major",
            custom_name="TEST Star",
            personal_message="A bright eternal flame.",
            occasion="anniversary",
            ra="06h 45m",
            dec="-16° 42'",
            owner_name="TEST Owner",
            story="Beneath the cosmos, a memory glimmers forever.",
            language="TR",
        )
        assert isinstance(pdf, bytes)
        assert pdf.startswith(b"%PDF"), "Output is not a PDF"
        assert len(pdf) > 20_000, f"PDF too small: {len(pdf)} bytes"


# --------- emails module (graceful no-op without RESEND_API_KEY) ---------
class TestEmailsModule:
    def test_send_certificate_email_noop_without_key(self):
        import sys, asyncio
        sys.path.insert(0, "/app/backend")
        # Force key empty
        os.environ["RESEND_API_KEY"] = ""
        # Reimport fresh to reread env
        import importlib
        import emails as emails_mod
        importlib.reload(emails_mod)
        result = asyncio.run(emails_mod.send_certificate_email(
            to_email="test@example.com",
            custom_name="TEST",
            star_name="Sirius",
            constellation="Canis Major",
            personal_message="hi",
            owner_name="TEST Owner",
            pdf_bytes=b"%PDF-1.4 fake",
            language="TR",
            is_gift=False,
        ))
        assert result is None


# --------- Stripe checkout / status / webhook ---------
class TestCheckout:
    def _pick_available_star(self, api_client):
        r = api_client.get(f"{API}/stars", params={"available": "true", "limit": 5})
        assert r.status_code == 200
        data = r.json()
        assert data, "no available stars"
        return data[0]

    def test_create_session_validation_required_fields(self, api_client):
        # missing star_id, custom_name, origin_url -> 422
        r = api_client.post(f"{API}/checkout/session", json={})
        assert r.status_code == 422

    def test_create_session_with_placeholder_key_returns_stripe_error(self, api_client):
        star = self._pick_available_star(api_client)
        payload = {
            "star_id": star["star_id"],
            "custom_name": "TEST Cosmos",
            "personal_message": "TEST msg",
            "occasion": "general",
            "package": "standard",
            "gift": False,
            "ai_story": "",
            "language": "TR",
            "origin_url": "https://example.com",
        }
        r = api_client.post(f"{API}/checkout/session", json=payload)
        # Placeholder key -> 500 with 'Stripe' in detail
        assert r.status_code == 500, r.text
        detail = r.json().get("detail", "")
        assert "Stripe" in detail or "stripe" in detail.lower()

    def test_create_session_no_payment_transaction_on_stripe_failure(self, api_client):
        # Verify code path: when Stripe rejects, no payment_transactions doc is inserted.
        star = self._pick_available_star(api_client)
        before = db.payment_transactions.count_documents({"star_id": star["star_id"]})
        payload = {
            "star_id": star["star_id"],
            "custom_name": "TEST_NoTxn",
            "origin_url": "https://example.com",
        }
        api_client.post(f"{API}/checkout/session", json=payload)
        after = db.payment_transactions.count_documents({"star_id": star["star_id"]})
        assert after == before, "payment_transaction should NOT be inserted on Stripe failure"

    def test_create_session_already_claimed_returns_400(self, api_client, auth_headers, mock_session):
        # claim a star first via /stars/claim (auth path)
        avail = api_client.get(f"{API}/stars", params={"available": "true", "limit": 5}).json()
        assert avail
        star_id = avail[0]["star_id"]
        cr = requests.post(f"{API}/stars/claim", headers=auth_headers, json={
            "star_id": star_id, "custom_name": "TEST claimed", "package": "standard"
        })
        assert cr.status_code == 200
        # try checkout for now-owned star
        r = api_client.post(f"{API}/checkout/session", json={
            "star_id": star_id, "custom_name": "TEST", "origin_url": "https://example.com",
        })
        assert r.status_code == 400
        assert "already" in r.json().get("detail", "").lower()

    def test_checkout_status_unknown_session_returns_404(self, api_client):
        r = api_client.get(f"{API}/checkout/status/cs_test_does_not_exist_xyz")
        assert r.status_code == 404

    def test_certificate_endpoint_requires_auth(self, api_client):
        r = requests.get(f"{API}/orders/certificate/ord_anything")
        assert r.status_code == 401


# --------- Webhook (dev mode without secret) ---------
class TestStripeWebhook:
    def test_webhook_accepts_json_dev_mode(self, api_client):
        # No STRIPE_WEBHOOK_SECRET -> backend parses JSON
        body = {"type": "ping", "data": {"object": {}}}
        r = api_client.post(f"{API}/webhook/stripe", json=body)
        assert r.status_code == 200, r.text
        assert r.json().get("received") is True


# --------- Idempotency of _process_paid_claim ---------
class TestFulfillmentIdempotency:
    def test_process_paid_claim_idempotent(self, api_client):
        import asyncio
        import sys
        sys.path.insert(0, "/app/backend")
        from server import _process_paid_claim

        # pick available star
        avail = api_client.get(f"{API}/stars", params={"available": "true", "limit": 5}).json()
        assert avail
        star = avail[0]
        session_id = f"cs_test_idem_{uuid.uuid4().hex[:10]}"
        user_id = f"test-user-{uuid.uuid4().hex[:6]}"
        txn = {
            "session_id": session_id,
            "status": "pending",
            "payment_status": "paid",
            "amount": star["price"],
            "currency": "usd",
            "star_id": star["star_id"],
            "user_id": user_id,
            "user_email": "TEST_idem@example.com",
            "user_name": "TEST Idem",
            "custom_name": "TEST_IdemStar",
            "personal_message": "",
            "occasion": "general",
            "package": "standard",
            "gift": False,
            "ai_story": "",
            "language": "TR",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        db.payment_transactions.insert_one(dict(txn))

        async def run_twice():
            await _process_paid_claim(txn)
            await _process_paid_claim(txn)

        asyncio.run(run_twice())

        orders = list(db.orders.find({"session_id": session_id}))
        assert len(orders) == 1, f"Expected exactly 1 order, got {len(orders)}"
        final_txn = db.payment_transactions.find_one({"session_id": session_id})
        assert final_txn["status"] == "fulfilled"

        # cleanup
        db.payment_transactions.delete_many({"session_id": session_id})
        db.orders.delete_many({"session_id": session_id})
        db.stars.update_many(
            {"star_id": star["star_id"], "owner_id": user_id},
            {"$set": {"owner_id": None, "owner_name": None, "custom_name": None,
                      "personal_message": None, "occasion": None, "claimed_at": None,
                      "ai_story": None}},
        )
        db.activities.delete_many({"star_name": star["name"], "user_name": "TEST"})
