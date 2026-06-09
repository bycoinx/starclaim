"""
Seed data for StarClaim: upgrading to real Hipparcos (HYG) catalog.
This module handles downloading, parsing, and formatting real stellar data.
"""

import os
import random
import csv
import io
import uuid
import httpx
from datetime import datetime, timezone

HYG_CSV_URL = "https://raw.githubusercontent.com/astronexus/HYG-Database/master/hyg/v3/hyg.csv"
LOCAL_HYG_PATH = os.path.join(os.path.dirname(__file__), "hyg.csv")

def _star(code, name, constellation, tier, price, ra, dec, ra_deg=None, dec_deg=None, magnitude=None, spect=None, hip=None, owner=None):
    star = {
        "code": code,
        "name": name,
        "constellation": constellation,
        "tier": tier,
        "price": price,
        "ra": ra,
        "dec": dec,
        "ra_deg": ra_deg,
        "dec_deg": dec_deg,
        "magnitude": magnitude,
        "spect": spect,
        "hip": hip,
        "owner_id": None,
        "owner_name": None,
        "custom_name": None,
        "personal_message": None,
        "occasion": None,
        "ai_story": None,
        "claimed_at": None,
        "for_sale": False,
        "asking_price": None,
    }
    if owner:
        star["owner_name"] = owner
        star["claimed_at"] = datetime.now(timezone.utc).isoformat()
    return star

# Brightest stars manual list (High quality entries)
MANUAL_CATALOG = [
    _star("sirius", "Sirius", "Canis Major", "legendary", 2999, "06h 45m", "-16° 42'", ra_deg=101.28, dec_deg=-16.71, magnitude=-1.46, spect="A1V", hip="32349", owner="Ali K."),
    _star("canopus", "Canopus", "Carina", "legendary", 2499, "06h 23m", "-52° 41'", ra_deg=95.98, dec_deg=-52.69, magnitude=-0.74, spect="F0II", hip="30438"),
    _star("arcturus", "Arcturus", "Bootes", "legendary", 1999, "14h 15m", "+19° 10'", ra_deg=213.91, dec_deg=19.18, magnitude=-0.05, spect="K1.5III", hip="69673", owner="Zeynep A."),
    _star("vega", "Vega", "Lyra", "legendary", 1499, "18h 36m", "+38° 47'", ra_deg=279.23, dec_deg=38.78, magnitude=0.03, spect="A0V", hip="91262"),
    _star("rigel", "Rigel", "Orion", "legendary", 1299, "05h 14m", "-08° 12'", ra_deg=78.63, dec_deg=-8.20, magnitude=0.13, spect="B8Iab", hip="24436"),
    _star("betelgeuse", "Betelgeuse", "Orion", "legendary", 1199, "05h 55m", "+07° 24'", ra_deg=88.79, dec_deg=7.41, magnitude=0.50, spect="M2Iab", hip="27989", owner="Mert T."),
    _star("polaris", "Polaris", "Ursa Minor", "legendary", 2999, "02h 31m", "+89° 15'", ra_deg=37.95, dec_deg=89.26, magnitude=1.97, spect="F7Ib", hip="11767"),
    _star("antares", "Antares", "Scorpius", "legendary", 1399, "16h 29m", "-26° 25'", ra_deg=247.35, dec_deg=-26.43, magnitude=1.09, spect="M1.5Iab", hip="80763"),
]

def fetch_hyg_database():
    """Download HYG database if not present locally."""
    if os.path.exists(LOCAL_HYG_PATH):
        print(f"Loading local HYG database from {LOCAL_HYG_PATH}")
        with open(LOCAL_HYG_PATH, "r", encoding="utf-8") as f:
            return f.read()
    
    print(f"Downloading HYG database from {HYG_CSV_URL}...")
    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.get(HYG_CSV_URL)
            resp.raise_for_status()
            content = resp.text
            with open(LOCAL_HYG_PATH, "w", encoding="utf-8") as f:
                f.write(content)
            return content
    except Exception as e:
        print(f"Failed to download HYG database: {e}")
        return None

def parse_hyg_to_stars(csv_content, limit=120000):
    """Parse HYG CSV content into Star objects."""
    if not csv_content:
        return []
    
    stars = []
    # Use existing manual catalog codes to avoid duplicates
    existing_hips = {s["hip"] for s in MANUAL_CATALOG if s.get("hip")}
    
    f = io.StringIO(csv_content)
    reader = csv.DictReader(f)
    
    for row in reader:
        hip = row.get("hip")
        if hip in existing_hips:
            continue
            
        try:
            mag = float(row.get("mag", 10.0))
        except (ValueError, TypeError):
            mag = 10.0

        # Filter: only keep stars up to mag 9.0 for the main catalog to keep it manageable but high quality
        if mag > 9.0 and len(stars) > 20000:
            continue
            
        proper = row.get("proper", "")
        name = proper if proper else f"HIP {hip}" if hip else f"HD {row.get('hd')}"
        
        # Format RA (Decimal to 00h 00m)
        try:
            ra_dec = float(row.get("ra", 0))
            ra_deg = ra_dec * 15.0 # RA is usually in hours (0-24), convert to degrees (0-360)
            ra_h = int(ra_dec)
            ra_m = int((ra_dec - ra_h) * 60)
            ra_str = f"{ra_h:02d}h {ra_m:02d}m"
            
            dec_deg = float(row.get("dec", 0))
            dec_d = int(dec_deg)
            dec_m = abs(int((dec_deg - dec_d) * 60))
            dec_str = f"{dec_d:+03d}° {dec_m:02d}'"
        except (ValueError, TypeError):
            continue

        # Tier logic based on magnitude and proper name
        if proper and mag < 2.0:
            tier = "legendary"
            price = round(random.uniform(1000, 3000), 2)
        elif proper:
            tier = "named"
            price = round(random.uniform(200, 800), 2)
        elif mag < 4.5:
            tier = "constellation"
            price = round(random.uniform(50, 150), 2)
        else:
            tier = "standard"
            price = round(random.uniform(9.99, 49.99), 2)

        code = f"hip-{hip}" if hip else f"sc-{uuid.uuid4().hex[:8]}"
        
        stars.append(_star(
            code=code,
            name=name,
            constellation=row.get("con", "Unknown"),
            tier=tier,
            price=price,
            ra=ra_str,
            dec=dec_str,
            ra_deg=ra_deg,
            dec_deg=dec_deg,
            magnitude=mag,
            spect=row.get("spect", ""),
            hip=hip
        ))
        
        if len(stars) >= limit:
            break
            
    return stars

# Initialize catalog
print("Initializing Star Catalog...")
_hyg_content = fetch_hyg_database()
if _hyg_content:
    REAL_STARS = parse_hyg_to_stars(_hyg_content)
    STAR_CATALOG = list(MANUAL_CATALOG) + REAL_STARS
    print(f"Catalog initialized with {len(STAR_CATALOG)} real stars.")
else:
    print("Warning: Could not load HYG database. Using fallback catalog.")
    # Fallback to a generated catalog if download fails
    def generate_fallback_stars(count=5000):
        stars = list(MANUAL_CATALOG)
        for i in range(len(stars), count):
            code = f"sc-{i+1:05d}"
            ra = f"{random.randint(0, 23):02d}h {random.randint(0, 59):02d}m"
            dec = f"{random.randint(-89, 89):+03d}° {random.randint(0, 59):02d}'"
            stars.append(_star(code, f"Star {i}", "Unknown", "standard", 19.99, ra, dec, 6.0))
        return stars
    STAR_CATALOG = generate_fallback_stars()

SAMPLE_LISTINGS = [
    {"code": "vega", "original": 1499, "asking": 2200, "owner": "Kaan B.", "days_ago": 45, "hops": 2},
]

SAMPLE_ACTIVITIES = [
    {"activity_id": "act_1", "type": "claim", "user_name": "Ali K.", "star_name": "Sirius", "constellation": "Canis Major"},
    {"activity_id": "act_2", "type": "claim", "user_name": "Zeynep A.", "star_name": "Arcturus", "constellation": "Bootes"},
]
