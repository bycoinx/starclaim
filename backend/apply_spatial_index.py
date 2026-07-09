from pymongo import MongoClient, GEOSPHERE
import math

client = MongoClient('mongodb://localhost:27017')
db = client['starclaim_db']
coll = db.stars

print('Updating documents with loc where ra_deg and dec_deg exist...')
count=0
for doc in coll.find({'ra_deg': {'$ne': None}, 'dec_deg': {'$ne': None}}):
    try:
        ra = doc.get('ra_deg')
        dec = doc.get('dec_deg')
        if ra is None or dec is None:
            continue
        # Ensure numeric
        ra_f = float(ra)
        dec_f = float(dec)
        # Convert RA (0..360) to longitude (-180..180) for GeoJSON
        lon = ra_f if ra_f <= 180.0 else (ra_f - 360.0)
        loc = {'type': 'Point', 'coordinates': [lon, dec_f]}
        coll.update_one({'_id': doc['_id']}, {'$set': {'loc': loc}})
        count += 1
    except Exception as e:
        print('skip', doc.get('code'), e)

print('Updated', count, 'documents with loc')
print('Dropping existing loc_2dsphere index if present...')
try:
    coll.drop_index('loc_2dsphere')
    print('Dropped existing loc_2dsphere')
except Exception:
    pass
print('Creating 2dsphere index on loc...')
idx = coll.create_index([('loc', GEOSPHERE)], name='loc_2dsphere')
print('Created index', idx)
