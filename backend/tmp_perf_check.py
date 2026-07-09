import json
import sys
import time
import requests
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['starclaim_db']
coll = db.stars

queries = [
    {
        'name': 'constellation_brightest',
        'filter': {'constellation': 'Orion'},
        'sort': [('magnitude', 1)],
        'api': 'http://127.0.0.1:8000/api/stars?constellation=Orion&sort=brightest&limit=200'
    },
    {
        'name': 'nearest',
        'filter': {},
        'sort': [('distance', 1)],
        'api': 'http://127.0.0.1:8000/api/stars?sort=nearest&limit=200'
    },
    {
        'name': 'tier_price_desc',
        'filter': {'tier': 'named'},
        'sort': [('price', -1)],
        'api': 'http://127.0.0.1:8000/api/stars?tier=named&sort=price_desc&limit=200'
    }
]

results = []
for q in queries:
    name = q['name']
    filt = q['filter']
    sort = q['sort']
    # explain via command
    try:
        explain_cmd = {
            'find': 'stars',
            'filter': filt,
            'limit': 200,
            'sort': {k: v for k, v in sort}
        }
        ex = client['starclaim_db'].command('explain', explain_cmd, verbosity='executionStats')
        exec_time = ex.get('executionStats', {}).get('executionTimeMillis', None)
    except Exception as e:
        ex = {'error': str(e)}
        exec_time = None
    # api timing
    try:
        t0 = time.perf_counter()
        r = requests.get(q['api'], timeout=20)
        t1 = time.perf_counter()
        api_time = (t1 - t0) * 1000
        api_status = r.status_code
        sample_count = len(r.json()) if r.status_code == 200 else 0
    except Exception as e:
        api_time = None
        api_status = None
        sample_count = 0
        r = None
    results.append({
        'name': name,
        'explain': ex,
        'exec_time_ms': exec_time,
        'api_time_ms': api_time,
        'api_status': api_status,
        'sample_count': sample_count
    })

print(json.dumps(results, default=str, indent=2))
