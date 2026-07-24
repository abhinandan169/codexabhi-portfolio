"""Backend tests for widgets, github sync, live_info (iteration 5)."""
import os
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kumar-software-hub.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": "admin@abhinandan.dev", "password": "Admin@123"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_widgets_public_returns_defaults():
    r = requests.get(f"{API}/widgets")
    assert r.status_code == 200
    d = r.json()
    assert "github" in d
    assert "live_info" in d
    assert "enabled" in d["github"]
    assert "position" in d["live_info"]


def test_put_widgets_requires_auth():
    r = requests.put(f"{API}/admin/widgets", json={"github": {"enabled": True}})
    assert r.status_code in (401, 403)


def test_put_widgets_persists(auth_headers):
    # Load current
    cur = requests.get(f"{API}/widgets").json()
    payload = {
        "github": {**cur.get("github", {}), "enabled": False},
        "live_info": {**cur.get("live_info", {}), "position": "left"},
    }
    r = requests.put(f"{API}/admin/widgets", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    after = requests.get(f"{API}/widgets").json()
    assert after["github"]["enabled"] is False
    assert after["live_info"]["position"] == "left"

    # Restore
    restore = {
        "github": {**cur.get("github", {}), "enabled": True},
        "live_info": {**cur.get("live_info", {}), "position": "right"},
    }
    r2 = requests.put(f"{API}/admin/widgets", json=restore, headers=auth_headers)
    assert r2.status_code == 200
    after2 = requests.get(f"{API}/widgets").json()
    assert after2["github"]["enabled"] is True
    assert after2["live_info"]["position"] == "right"


def test_github_sync_requires_auth():
    r = requests.post(f"{API}/admin/github/sync")
    assert r.status_code in (401, 403)


def test_github_sync_updates_timestamp(auth_headers):
    r = requests.post(f"{API}/admin/github/sync", headers=auth_headers)
    assert r.status_code == 200
    ts = r.json().get("last_sync")
    assert ts and "T" in ts
    # Verify persisted
    after = requests.get(f"{API}/widgets").json()
    assert after["github"].get("last_sync") == ts
