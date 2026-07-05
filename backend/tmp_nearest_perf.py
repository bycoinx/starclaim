import time, requests, json
from pymongo import MongoClient

client=MongoClient('mongodb://localhost:27017')
db=client['starclaim_db']

coords=[
    (213.91,19.18,'Arcturus'),
    (279.23,38.78,'Vega'),
    (0.0,0.0,'Zero'),
    (180.0,0.0,'Opposite')
]

results=[]
for ra,dec,label in coords:
    # API call (viewer_ra uses RA degrees)
    url=f'http://127.0.0.1:8000/api/stars?sort=nearest&viewer_ra={ra}&viewer_dec={dec}&limit=50'
    t0=time.perf_counter(); r=requests.get(url, timeout=30); t1=time.perf_counter()
    api_ms=(t1-t0)*1000
    api_ok = r.status_code==200
    try:
        api_json = r.json()
    except Exception:
        api_json = None
    api_count = len(api_json) if api_ok and isinstance(api_json, list) else 0

    # DB aggregation explain
    # convert RA to lon same as server (ra>180 -> ra-360)
    lon = ra if ra <=180.0 else (ra-360.0)
    pipeline = [{'$geoNear': {'near': {'type':'Point','coordinates':[lon,dec]}, 'distanceField':'dist.calculated','spherical':True}}, {'$limit': 50}]
    try:
        ex = client['starclaim_db'].command('explain', {'aggregate':'stars','pipeline':pipeline,'cursor':{}}, verbosity='executionStats')
        db_exec_ms = ex.get('executionStats',{}).get('executionTimeMillis')
    except Exception as e:
        ex = {'error': str(e)}
        db_exec_ms = None

    # direct aggregate timing
    t0=time.perf_counter(); docs=list(db.stars.aggregate(pipeline)); t1=time.perf_counter(); agg_ms=(t1-t0)*1000
    results.append({'label':label,'ra':ra,'dec':dec,'api_ms':api_ms,'api_count':api_count,'api_status': r.status_code, 'api_text': r.text[:1000], 'db_explain_ms':db_exec_ms,'db_agg_ms':agg_ms,'example_first': (api_json[0] if api_ok and api_count>0 else None)})

print(json.dumps(results, indent=2, default=str))
