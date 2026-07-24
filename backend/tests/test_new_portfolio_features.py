"""Tests for portfolio homepage upgrade (iter4): /api/analytics/live and github_username persistence."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "admin@abhinandan.dev"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def auth_headers():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ---------------- /api/analytics/live ----------------
def test_analytics_live_public_no_auth():
    r = requests.get(f"{BASE_URL}/api/analytics/live", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    for k in ["views", "online_now", "last_updated"]:
        assert k in data, f"missing {k} in analytics/live"
    assert isinstance(data["views"], int)
    assert isinstance(data["online_now"], int)
    assert isinstance(data["last_updated"], str)
    assert data["views"] >= 0
    assert data["online_now"] >= 0


def test_analytics_live_reflects_views():
    r0 = requests.get(f"{BASE_URL}/api/analytics/live", timeout=15).json()
    # bump views via /api/profile
    for _ in range(2):
        requests.get(f"{BASE_URL}/api/profile", timeout=15)
    r1 = requests.get(f"{BASE_URL}/api/analytics/live", timeout=15).json()
    assert r1["views"] >= r0["views"], "views should be non-decreasing"


# ---------------- github_username via /api/admin/profile ----------------
def test_admin_profile_accepts_github_username(auth_headers):
    # get current
    cur = requests.get(f"{BASE_URL}/api/profile", timeout=15).json()
    original_gh = cur.get("github_username", "")

    try:
        payload = dict(cur)
        payload["github_username"] = "torvalds"
        # Remove non-updatable fields if server rejects them (server accepts dict-based)
        payload.pop("_id", None)

        r = requests.put(f"{BASE_URL}/api/admin/profile", json=payload,
                         headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        updated = requests.get(f"{BASE_URL}/api/profile", timeout=15).json()
        assert updated.get("github_username") == "torvalds", updated
    finally:
        # restore
        restore = dict(cur)
        restore["github_username"] = original_gh
        restore.pop("_id", None)
        requests.put(f"{BASE_URL}/api/admin/profile", json=restore,
                     headers=auth_headers, timeout=15)
        final = requests.get(f"{BASE_URL}/api/profile", timeout=15).json()
        assert final.get("github_username", "") == original_gh


# ---------------- Regression: core public endpoints ----------------
@pytest.mark.parametrize("path", [
    "/api/", "/api/profile", "/api/skills", "/api/projects",
    "/api/social-links", "/api/testimonials", "/api/experience",
    "/api/counters", "/api/theme", "/api/sections", "/api/seo",
])
def test_public_endpoints_ok(path):
    r = requests.get(f"{BASE_URL}{path}", timeout=15)
    assert r.status_code == 200, f"{path} -> {r.status_code}"
