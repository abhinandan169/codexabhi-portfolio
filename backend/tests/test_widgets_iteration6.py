"""Iteration 6 backend regression: widgets endpoints for GitHub + LiveInfo."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kumar-software-hub.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@abhinandan.dev"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def test_get_widgets_returns_github_and_live_info():
    r = requests.get(f"{BASE_URL}/api/widgets", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "github" in data
    assert "live_info" in data
    gh = data["github"]
    for k in ["enabled", "show_calendar", "show_stats", "show_langs"]:
        assert k in gh, f"github missing {k}"
    li = data["live_info"]
    for k in ["enabled", "position", "show_online", "show_visitors", "show_views",
              "show_updated", "refresh_interval", "pulse_animation"]:
        assert k in li, f"live_info missing {k}"


def test_put_widgets_persists_new_keys(auth_headers):
    # fetch existing
    current = requests.get(f"{BASE_URL}/api/widgets", timeout=30).json()
    payload = {
        "github": current.get("github", {}),
        "live_info": {
            **current.get("live_info", {}),
            "show_on_mobile": True,
            "dismissible": False,
        },
    }
    r = requests.put(f"{BASE_URL}/api/admin/widgets", json=payload, headers=auth_headers, timeout=30)
    assert r.status_code == 200, r.text
    got = requests.get(f"{BASE_URL}/api/widgets", timeout=30).json()
    assert got["live_info"]["show_on_mobile"] is True
    assert got["live_info"]["dismissible"] is False

    # restore
    payload["live_info"]["show_on_mobile"] = False
    payload["live_info"]["dismissible"] = True
    r2 = requests.put(f"{BASE_URL}/api/admin/widgets", json=payload, headers=auth_headers, timeout=30)
    assert r2.status_code == 200
    got2 = requests.get(f"{BASE_URL}/api/widgets", timeout=30).json()
    assert got2["live_info"]["show_on_mobile"] is False
    assert got2["live_info"]["dismissible"] is True


def test_admin_tabs_related_endpoints(auth_headers):
    # Sections, profile, projects, appearance still work
    for ep in ["/api/sections", "/api/profile", "/api/projects", "/api/theme"]:
        r = requests.get(f"{BASE_URL}{ep}", timeout=30)
        assert r.status_code == 200, f"{ep} -> {r.status_code}"
