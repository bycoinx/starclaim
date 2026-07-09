import time
from pymongo import MongoClient
client=MongoClient('mongodb://localhost:27017')
db=client['starclaim_db']
coll=db.stars
queries = [
    ("constellation_brightest", {'constellation':'Orion'}, [('magnitude',1)]),
    ("nearest", {}, [('distance',1)]),
    ("tier_price_desc", {'tier':'named'}, [('price',-1)])
]
for name, filt, sort in queries:
    t0=time.perf_counter()
    cursor=coll.find(filt).sort(sort).limit(200)
    docs=list(cursor)
    t1=time.perf_counter()
    print(name, 'count', len(docs), 'time_ms', (t1-t0)*1000)
