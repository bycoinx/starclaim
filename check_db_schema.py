import pymongo
import json

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['starclaim']

# Check first star's fields
star = db.stars.find_one()
if star:
    print('Sample star fields:')
    for key in list(star.keys())[:20]:
        print(f'  - {key}: {type(star[key]).__name__}')
    
    if 'properName' in star:
        print(f'\nFirst star: {star.get("properName")}')
    
    # Search for Sirius
    sirius = db.stars.find_one({'properName': {'$regex': 'Sirius', '$options': 'i'}})
    if sirius:
        print(f'\nSirius found!')
        print(f'  Fields: {list(sirius.keys())[:15]}')
        for field in ['hip', 'hd', 'HD', 'HIP', 'properName']:
            if field in sirius:
                print(f'  {field}: {sirius[field]}')
