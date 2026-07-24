"""Backend API tests for admin dashboard extended features."""
import os
import io
import json
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback read from frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "admin@abhinandan.dev"
ADMIN_PASSWORD = "Admin@123"


def login(email=ADMIN_EMAIL, password=ADMIN_PASSWORD):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    return r


@pytest.fixture(scope="module")
def token():
    r = login()
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Basic ----------------
def test_root():
    r = requests.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200

def test_login_wrong():
    r = login(password="wrong-pass")
    assert r.status_code == 401

def test_me(auth_headers):
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


# ---------------- Theme ----------------
def test_theme_public_get():
    r = requests.get(f"{BASE_URL}/api/theme", timeout=15)
    assert r.status_code == 200
    data = r.json()
    for f in ["primary", "secondary", "accent", "background", "text", "mode", "button_style", "radius"]:
        assert f in data, f"missing field {f} in theme"

def test_theme_update(auth_headers):
    payload = {
        "primary": "#1E88E5", "secondary": "#111111", "accent": "#64B5F6",
        "background": "#FFFFFF", "text": "#111111", "text_secondary": "#555555",
        "mode": "light", "button_style": "rounded", "radius": 10, "preset": "blue",
    }
    r = requests.put(f"{BASE_URL}/api/admin/theme", json=payload, headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["primary"] == "#1E88E5"
    assert data["preset"] == "blue"
    # public reflects
    r2 = requests.get(f"{BASE_URL}/api/theme", timeout=15).json()
    assert r2["primary"] == "#1E88E5"
    assert r2["preset"] == "blue"


# ---------------- Stats ----------------
def test_stats(auth_headers):
    # increment views
    requests.get(f"{BASE_URL}/api/profile", timeout=15)
    before = requests.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers, timeout=15)
    assert before.status_code == 200
    b = before.json()
    for k in ["projects", "skills", "certificates", "education", "messages",
              "unread_messages", "views", "resume_downloads", "last_updated"]:
        assert k in b, f"missing stat: {k}"
    requests.get(f"{BASE_URL}/api/profile", timeout=15)
    after = requests.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers, timeout=15).json()
    assert after["views"] >= b["views"] + 1, f"views did not increment: {b['views']} -> {after['views']}"

def test_stats_unauth():
    r = requests.get(f"{BASE_URL}/api/admin/stats", timeout=15)
    assert r.status_code in (401, 403)


# ---------------- Activity Logs ----------------
def test_activity_crud_creates_logs(auth_headers):
    # Create skill
    r = requests.post(f"{BASE_URL}/api/admin/skills",
                      json={"name": "TEST_Skill_X", "level": 50, "category": "Test", "order": 999},
                      headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    sid = r.json()["id"]

    # Update skill
    r2 = requests.put(f"{BASE_URL}/api/admin/skills/{sid}", json={"level": 60},
                      headers=auth_headers, timeout=15)
    assert r2.status_code == 200

    # Delete skill
    r3 = requests.delete(f"{BASE_URL}/api/admin/skills/{sid}", headers=auth_headers, timeout=15)
    assert r3.status_code == 200

    # Create+delete project
    rp = requests.post(f"{BASE_URL}/api/admin/projects",
                       json={"title": "TEST_Proj_X"}, headers=auth_headers, timeout=15)
    assert rp.status_code == 200
    pid = rp.json()["id"]
    requests.delete(f"{BASE_URL}/api/admin/projects/{pid}", headers=auth_headers, timeout=15)

    # Submit contact (public)
    rc = requests.post(f"{BASE_URL}/api/contact",
                       json={"name": "TEST_User", "email": "t@t.com", "subject": "s", "message": "m"},
                       timeout=15)
    assert rc.status_code == 200

    # Check activity contains recent entries with expected actions
    time.sleep(0.5)
    ra = requests.get(f"{BASE_URL}/api/admin/activity?page=1&page_size=30",
                      headers=auth_headers, timeout=15)
    assert ra.status_code == 200
    data = ra.json()
    assert "items" in data and "total" in data
    actions = [i.get("action") for i in data["items"]]
    for a in ["Skill Added", "Skill Updated", "Skill Deleted",
              "Project Added", "Project Deleted", "Message Received"]:
        assert a in actions, f"activity missing: {a}. got: {actions[:15]}"


def test_activity_clear(auth_headers):
    r = requests.delete(f"{BASE_URL}/api/admin/activity", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    assert "deleted" in r.json()
    ra = requests.get(f"{BASE_URL}/api/admin/activity", headers=auth_headers, timeout=15).json()
    assert ra["total"] == 0


# ---------------- Backup / Restore ----------------
def test_backup_and_restore(auth_headers):
    r = requests.get(f"{BASE_URL}/api/admin/backup", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    data = r.json()
    for c in ["profile", "skills", "projects", "certificates", "education",
              "social_links", "resume", "theme"]:
        assert c in data and isinstance(data[c], list), f"{c} missing/invalid"

    # Restore with the same data
    rr = requests.post(f"{BASE_URL}/api/admin/restore",
                       json={"data": {k: data[k] for k in ["profile", "skills", "projects",
                                                            "certificates", "education",
                                                            "social_links", "resume", "theme"]},
                             "replace": True},
                       headers=auth_headers, timeout=60)
    assert rr.status_code == 200, rr.text
    out = rr.json()
    assert "restored" in out
    assert out["restored"]["skills"] == len(data["skills"])


# ---------------- Account: password & email (do last to preserve creds) ----------------
def test_password_change_flow():
    # Fresh login (isolated from module fixture to allow re-login later)
    r = login()
    assert r.status_code == 200
    tok = r.json()["token"]
    h = {"Authorization": f"Bearer {tok}"}

    # Wrong current password
    rw = requests.put(f"{BASE_URL}/api/admin/account/password",
                      json={"current_password": "WRONG", "new_password": "NewPass@123"},
                      headers=h, timeout=15)
    assert rw.status_code == 401

    # Too short
    rs = requests.put(f"{BASE_URL}/api/admin/account/password",
                      json={"current_password": ADMIN_PASSWORD, "new_password": "abc"},
                      headers=h, timeout=15)
    assert rs.status_code == 400

    NEW_PASS = "Admin@123!New"
    ok = requests.put(f"{BASE_URL}/api/admin/account/password",
                      json={"current_password": ADMIN_PASSWORD, "new_password": NEW_PASS},
                      headers=h, timeout=15)
    assert ok.status_code == 200, ok.text

    # Old token invalidated
    me = requests.get(f"{BASE_URL}/api/auth/me", headers=h, timeout=15)
    assert me.status_code == 401

    # Old login fails
    ol = login(password=ADMIN_PASSWORD)
    assert ol.status_code == 401
    # New login works
    nl = login(password=NEW_PASS)
    assert nl.status_code == 200

    # Restore original password
    h2 = {"Authorization": f"Bearer {nl.json()['token']}"}
    restore = requests.put(f"{BASE_URL}/api/admin/account/password",
                           json={"current_password": NEW_PASS, "new_password": ADMIN_PASSWORD},
                           headers=h2, timeout=15)
    assert restore.status_code == 200

    # Confirm admin credentials restored
    final = login()
    assert final.status_code == 200


def test_email_change_wrong_password():
    r = login()
    tok = r.json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    rw = requests.put(f"{BASE_URL}/api/admin/account/email",
                      json={"current_password": "WRONG", "new_email": "other@x.com"},
                      headers=h, timeout=15)
    assert rw.status_code == 401


def test_email_change_and_revert():
    r = login()
    tok = r.json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    NEW_EMAIL = "admin-temp@abhinandan.dev"
    ok = requests.put(f"{BASE_URL}/api/admin/account/email",
                      json={"current_password": ADMIN_PASSWORD, "new_email": NEW_EMAIL},
                      headers=h, timeout=15)
    assert ok.status_code == 200, ok.text
    assert ok.json().get("new_email") == NEW_EMAIL

    # Old token invalid
    me = requests.get(f"{BASE_URL}/api/auth/me", headers=h, timeout=15)
    assert me.status_code == 401

    # Login with new email
    nl = login(email=NEW_EMAIL)
    assert nl.status_code == 200
    h2 = {"Authorization": f"Bearer {nl.json()['token']}"}

    # Revert email to original
    rv = requests.put(f"{BASE_URL}/api/admin/account/email",
                      json={"current_password": ADMIN_PASSWORD, "new_email": ADMIN_EMAIL},
                      headers=h2, timeout=15)
    assert rv.status_code == 200

    # original email login works
    final = login()
    assert final.status_code == 200
