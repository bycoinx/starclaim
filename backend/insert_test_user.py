from dotenv import load_dotenv
import os
import uuid
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')
if not MONGO_URL:
    raise SystemExit('MONGO_URL not set in backend/.env')

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

user_id = f"user_test_{uuid.uuid4().hex[:8]}"
session_token = f"testsession_{uuid.uuid4().hex}"
now = datetime.now(timezone.utc)

user = {
    'user_id': user_id,
    'email': f'{user_id}@example.local',
    'name': 'Test User',
    'picture': None,
    'wallet_address': None,
    'stellar_address': None,
    'referral_code': f'REF{uuid.uuid4().hex[:8].upper()}',
    'daily_streak': 0,
    'last_checkin_at': None,
    'points': 0,
    'created_at': now.isoformat(),
}

session = {
    'session_token': session_token,
    'user_id': user_id,
    'expires_at': (now + timedelta(days=7)).isoformat(),
    'created_at': now.isoformat(),
}

# Insert or replace
existing = db.users.find_one({'user_id': user_id})
if not existing:
    db.users.insert_one(user)
else:
    db.users.update_one({'user_id': user_id}, {'$set': user}, upsert=True)

db.user_sessions.insert_one(session)
print(session_token, user_id)
