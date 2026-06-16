import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('backend/.env')
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

client = MongoClient(mongo_url)
db = client[db_name]

emails = ['bycoinx10@gmail.com', 'ogz.ozy@gmail.com']

for email in emails:
    user = db.users.find_one({"email": email})
    if user:
        print(f"FOUND: {email} (is_admin: {user.get('is_admin', False)})")
    else:
        print(f"NOT FOUND: {email}")
