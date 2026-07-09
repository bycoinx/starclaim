import json
import sys
try:
    from pymongo import MongoClient
except Exception as e:
    print('PYMONGO_IMPORT_ERROR', e)
    sys.exit(2)
client = MongoClient('mongodb://localhost:27017')
db = client['starclaim_db']
try:
    idx = list(db.stars.index_information().items())
    print(json.dumps({'indexes': [{ 'name': k, 'info': v } for k,v in idx]}, default=str))
except Exception as e:
    print('INDEX_ERROR', str(e))
    sys.exit(3)
try:
    # Use database command explain to avoid pymongo cursor API differences
    ex = client['starclaim_db'].command('explain', {
        'find': 'stars',
        'filter': {'constellation': 'Orion', 'magnitude': {'$lt': 4.5}},
        'limit': 100
    }, verbosity='executionStats')
    print('\n---EXPLAIN---')
    print(json.dumps(ex, default=str))
except Exception as e:
    print('EXPLAIN_ERROR', str(e))
    sys.exit(4)
