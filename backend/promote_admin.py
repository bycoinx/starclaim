import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Çevresel değişkenleri yükle
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "starclaim_db")

async def promote_to_admin(email):
    print(f"Connecting to {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Kullanıcıyı bul ve güncelle
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"is_admin": True}}
    )
    
    if result.matched_count > 0:
        print(f"SUCCESS: {email} user is now an ADMIN.")
    else:
        print(f"ERROR: User with email '{email}' not found. Please log in to the website once first.")
    
    client.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <your_email>")
    else:
        target_email = sys.argv[1]
        asyncio.run(promote_to_admin(target_email))
