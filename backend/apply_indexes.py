from pymongo import MongoClient
import json
client=MongoClient('mongodb://localhost:27017')
db=client['starclaim_db']
coll=db.stars
created=[]
try:
    created.append(coll.create_index([('constellation',1),('magnitude',1)], name='constellation_1_magnitude_1'))
except Exception as e:
    print('ERR1', e)
try:
    created.append(coll.create_index([('tier',1),('price',1)], name='tier_1_price_1'))
except Exception as e:
    print('ERR2', e)
try:
    created.append(coll.create_index([('magnitude',1)], name='magnitude_1'))
except Exception as e:
    print('ERR3', e)
print('CREATED:', created)
print('ALL INDEXES:')
for k,v in coll.index_information().items():
    print(k, v.get('key'))
