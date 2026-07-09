import re
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['starclaim_db']
coll = db.stars

ra_re = re.compile(r"^(\d{1,2})h\s*(\d{1,2})(?:m|')?$")
dec_re = re.compile(r"^([+-]?\d{1,3})°\s*(\d{1,2})'?")

updated = 0
for doc in coll.find({"$or": [{"ra_deg": {"$exists": False}}, {"dec_deg": {"$exists": False}}, {"loc": {"$exists": False}}]}):
    ra = doc.get('ra')
    dec = doc.get('dec')
    ra_deg = doc.get('ra_deg')
    dec_deg = doc.get('dec_deg')
    set_ops = {}
    try:
        if (ra_deg is None or ra_deg == '') and ra:
            m = ra_re.search(ra.strip())
            if m:
                h = int(m.group(1))
                mmin = int(m.group(2))
                ra_deg_val = (h + mmin/60.0) * 15.0
                set_ops['ra_deg'] = round(ra_deg_val, 6)
        if (dec_deg is None or dec_deg == '') and dec:
            m = dec_re.search(dec.strip())
            if m:
                d = int(m.group(1))
                dmin = int(m.group(2))
                sign = -1 if str(d).startswith('-') else 1
                dec_val = sign * (abs(d) + dmin/60.0)
                set_ops['dec_deg'] = round(dec_val, 6)
        if ('ra_deg' in set_ops or 'dec_deg' in set_ops) or ('loc' not in doc):
            ra_f = set_ops.get('ra_deg', ra_deg)
            dec_f = set_ops.get('dec_deg', dec_deg)
            if ra_f is None or dec_f is None:
                # skip if missing either
                if 'loc' not in doc and ra_f is not None and dec_f is not None:
                    pass
                else:
                    # cannot form loc yet
                    if set_ops:
                        coll.update_one({'_id': doc['_id']}, {'$set': set_ops})
                        updated += 1
                    continue
            # normalize lon
            lon = ra_f if ra_f <= 180.0 else (ra_f - 360.0)
            loc = {'type': 'Point', 'coordinates': [lon, dec_f]}
            set_ops['loc'] = loc
            coll.update_one({'_id': doc['_id']}, {'$set': set_ops})
            updated += 1
    except Exception as e:
        print('error updating', doc.get('code'), e)

print('Updated documents:', updated)
