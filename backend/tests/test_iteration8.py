"""Iteration 8: Draft/Publish + Forgot Password flow tests."""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kumar-software-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@abhinandan.dev"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------------- Draft/Publish for 6 content types ----------------

CONTENT_TYPES = {
    "skills": {"name": f"TEST_Skill_{uuid.uuid4().hex[:6]}", "category": "Testing", "level": 50, "icon": "code"},
    "projects": {"title": f"TEST_Proj_{uuid.uuid4().hex[:6]}", "description": "d", "tech_stack": ["x"], "category": "web", "featured": False},
    "certificates": {"name": f"TEST_Cert_{uuid.uuid4().hex[:6]}", "title": f"TEST_Cert_{uuid.uuid4().hex[:6]}", "issuer": "iss", "date": "2024-01-01", "credential_id": "c1"},
    "education": {"institution": f"TEST_Edu_{uuid.uuid4().hex[:6]}", "degree": "BSc", "field_of_study": "CS", "start_date": "2020", "end_date": "2024"},
    "experience": {"company": f"TEST_Exp_{uuid.uuid4().hex[:6]}", "role": "Dev", "start_date": "2024-01", "end_date": "Present", "description": "d", "technologies": ["x"]},
    "testimonials": {"name": f"TEST_Tst_{uuid.uuid4().hex[:6]}", "role": "CEO", "company": "co", "content": "great", "review": "great", "rating": 5},
}


@pytest.mark.parametrize("ctype,payload", list(CONTENT_TYPES.items()))
def test_draft_publish_lifecycle(ctype, payload, auth_headers):
    body = {**payload, "status": "draft"}
    # CREATE draft
    r = requests.post(f"{API}/admin/{ctype}", json=body, headers=auth_headers)
    assert r.status_code in (200, 201), f"create {ctype}: {r.status_code} {r.text}"
    item = r.json()
    item_id = item.get("id")
    assert item.get("status") == "draft"

    # public GET must NOT contain the draft
    pub = requests.get(f"{API}/{ctype}").json()
    assert not any(x.get("id") == item_id for x in pub), f"draft leaked to public {ctype}"

    # admin GET must contain it
    adm = requests.get(f"{API}/{ctype}", headers=auth_headers).json()
    assert any(x.get("id") == item_id for x in adm), f"admin can't see draft {ctype}"

    # PUBLISH
    r = requests.put(f"{API}/admin/{ctype}/{item_id}", json={"status": "published"}, headers=auth_headers)
    assert r.status_code == 200, r.text
    pub = requests.get(f"{API}/{ctype}").json()
    assert any(x.get("id") == item_id for x in pub), f"published not in public {ctype}"

    # UNPUBLISH (back to draft)
    r = requests.put(f"{API}/admin/{ctype}/{item_id}", json={"status": "draft"}, headers=auth_headers)
    assert r.status_code == 200
    pub = requests.get(f"{API}/{ctype}").json()
    assert not any(x.get("id") == item_id for x in pub)

    # cleanup
    requests.delete(f"{API}/admin/{ctype}/{item_id}", headers=auth_headers)


# ---------------- Forgot Password ----------------

def test_forgot_password_returns_debug_url_for_known_email():
    r = requests.post(f"{API}/auth/forgot-password", json={"email": ADMIN_EMAIL})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("success") is True
    assert "debug_reset_url" in data, "expected debug_reset_url when RESEND is placeholder"
    assert "/admin/reset/" in data["debug_reset_url"]


def test_forgot_password_unknown_email_no_enumeration():
    r = requests.post(f"{API}/auth/forgot-password", json={"email": "nobody@example.com"})
    assert r.status_code == 200
    data = r.json()
    assert data.get("success") is True
    assert "debug_reset_url" not in data


def _get_reset_token():
    r = requests.post(f"{API}/auth/forgot-password", json={"email": ADMIN_EMAIL})
    url = r.json()["debug_reset_url"]
    return url.rstrip("/").split("/admin/reset/")[-1]


def test_validate_reset_token_valid_and_invalid():
    token = _get_reset_token()
    r = requests.get(f"{API}/auth/reset/{token}")
    assert r.status_code == 200
    data = r.json()
    assert data.get("valid") is True
    assert data.get("email") == ADMIN_EMAIL

    r2 = requests.get(f"{API}/auth/reset/bogus_token_xyz_123")
    assert r2.status_code == 400


def test_reset_password_happy_path_and_reuse_and_token_invalidation():
    """Reset password, ensure old JWT invalidated, then restore."""
    # capture old token
    login = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    old_token = login.json()["token"]

    token = _get_reset_token()
    new_pw = "TempPass@999"

    # short pw fails
    r = requests.post(f"{API}/auth/reset-password", json={"token": token, "new_password": "short"})
    assert r.status_code == 400

    r = requests.post(f"{API}/auth/reset-password", json={"token": token, "new_password": new_pw})
    assert r.status_code == 200, r.text

    # Second use should fail
    r2 = requests.post(f"{API}/auth/reset-password", json={"token": token, "new_password": new_pw})
    assert r2.status_code == 400

    # old JWT invalidated
    me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {old_token}"})
    assert me.status_code in (401, 403), f"old token still valid: {me.status_code}"

    # old password no longer works
    bad = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert bad.status_code != 200

    # new password works
    good = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": new_pw})
    assert good.status_code == 200

    # Restore via forgot flow
    token2 = _get_reset_token()
    r = requests.post(f"{API}/auth/reset-password", json={"token": token2, "new_password": ADMIN_PASSWORD})
    assert r.status_code == 200
    final = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert final.status_code == 200, "failed to restore admin password"
