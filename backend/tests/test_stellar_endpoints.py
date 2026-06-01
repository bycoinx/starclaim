import pytest
import requests
import subprocess
import time
import os

BASE = 'http://127.0.0.1:8000'


def server_up():
    try:
        r = requests.get(BASE, timeout=3)
        return r.status_code < 600
    except Exception:
        return False


@pytest.mark.skipif(not server_up(), reason="Server not running on localhost:8000")
def test_create_accounts_and_transfer():
    # create source account
    r1 = requests.post(BASE + '/api/stellar/testnet/create-account', timeout=30)
    assert r1.status_code == 200
    src = r1.json()
    assert 'account' in src and 'public_key' in src['account'] and 'secret' in src['account']

    # create dest account
    r2 = requests.post(BASE + '/api/stellar/testnet/create-account', timeout=30)
    assert r2.status_code == 200
    dst = r2.json()
    assert 'account' in dst and 'public_key' in dst['account']

    # transfer without auth should be rejected
    payload = {
        'destination': dst['account']['public_key'],
        'amount': '0.1',
        'source_secret': src['account']['secret'],
    }
    r3 = requests.post(BASE + '/api/stellar/testnet/transfer', json=payload, timeout=30)
    assert r3.status_code in (401, 403)

    # create a test user session (script prints token)
    tests_dir = os.path.dirname(__file__)
    backend_dir = os.path.abspath(os.path.join(tests_dir, '..'))
    p = subprocess.run(['python', 'insert_test_user.py'], cwd=backend_dir, capture_output=True, text=True)
    assert p.returncode == 0
    out = p.stdout.strip()
    assert out
    token = out.split()[0]

    # attempt transfer with auth
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    r4 = requests.post(BASE + '/api/stellar/testnet/transfer', json=payload, headers=headers, timeout=60)
    assert r4.status_code == 200
    j = r4.json()
    assert 'transaction' in j or 'hash' in j
