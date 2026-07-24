"""Iteration 11 - Production validation: admin CRUD, global search, sitemap/robots, SEO/appearance/visibility."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kumar-software-hub.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@abhinandan.dev"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    return d.get("access_token") or d.get("token")


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Public endpoints ----------
class TestPublic:
    def test_sitemap_xml(self):
        r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=10)
        assert r.status_code == 200
        assert "<urlset" in r.text
        assert len(r.text) > 50

    def test_robots_txt(self):
        r = requests.get(f"{BASE_URL}/api/robots.txt", timeout=10)
        assert r.status_code == 200
        assert "User-agent" in r.text

    @pytest.mark.parametrize("path", ["skills", "projects", "certificates", "education", "experience", "testimonials", "seo", "sections"])
    def test_public_list(self, path):
        r = requests.get(f"{BASE_URL}/api/{path}", timeout=10)
        assert r.status_code == 200


# ---------- Admin Search ----------
class TestAdminSearch:
    def test_search_admin(self, auth):
        r = requests.get(f"{BASE_URL}/api/admin/search", params={"q": "admin"}, headers=auth, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, (list, dict))

    def test_search_min_chars(self, auth):
        r = requests.get(f"{BASE_URL}/api/admin/search", params={"q": "a"}, headers=auth, timeout=10)
        assert r.status_code in (200, 400)

    def test_search_common_term(self, auth):
        r = requests.get(f"{BASE_URL}/api/admin/search", params={"q": "portfolio"}, headers=auth, timeout=10)
        assert r.status_code == 200


# ---------- CRUD lifecycle per resource ----------
RESOURCES = {
    "skills": {"name": f"PROD_QA_{uuid.uuid4().hex[:6]}", "level": 50, "category": "Test"},
    "projects": {"title": f"PROD_QA_{uuid.uuid4().hex[:6]}", "description": "test", "tech_stack": ["x"], "link": "", "github_link": ""},
    "certificates": {"name": f"PROD_QA_{uuid.uuid4().hex[:6]}", "organization": "Test", "date": "2025"},
    "education": {"degree": f"PROD_QA_{uuid.uuid4().hex[:6]}", "institution": "Test", "year": "2025", "description": "t"},
    "experience": {"role": f"PROD_QA_{uuid.uuid4().hex[:6]}", "company": "Test", "duration": "2025", "description": "t"},
    "testimonials": {"name": f"PROD_QA_{uuid.uuid4().hex[:6]}", "role": "Tester", "review": "great"},
}


@pytest.mark.parametrize("resource,payload", list(RESOURCES.items()))
def test_crud_publish_unpublish(auth, resource, payload):
    # CREATE
    r = requests.post(f"{BASE_URL}/api/admin/{resource}", json=payload, headers=auth, timeout=15)
    assert r.status_code in (200, 201), f"{resource} create failed: {r.status_code} {r.text}"
    item = r.json()
    item_id = item.get("id")
    assert item_id, f"{resource} no id returned"

    try:
        # LIST (public with admin bearer sees all)
        r2 = requests.get(f"{BASE_URL}/api/{resource}", headers=auth, timeout=10)
        assert r2.status_code == 200
        assert any(x.get("id") == item_id for x in r2.json())

        # UPDATE with status draft (unpublish via PUT)
        upd = {**payload, "status": "draft"}
        r3 = requests.put(f"{BASE_URL}/api/admin/{resource}/{item_id}", json=upd, headers=auth, timeout=15)
        assert r3.status_code in (200, 204), f"{resource} update->draft failed: {r3.status_code} {r3.text}"

        # Public (no auth) should NOT include draft
        pub = requests.get(f"{BASE_URL}/api/{resource}", timeout=10).json()
        assert not any(x.get("id") == item_id for x in pub), f"{resource} draft leaked to public"

        # Re-publish
        upd2 = {**payload, "status": "published"}
        r5 = requests.put(f"{BASE_URL}/api/admin/{resource}/{item_id}", json=upd2, headers=auth, timeout=15)
        assert r5.status_code in (200, 204)
        pub2 = requests.get(f"{BASE_URL}/api/{resource}", timeout=10).json()
        assert any(x.get("id") == item_id for x in pub2)

    finally:
        # CLEANUP
        rd = requests.delete(f"{BASE_URL}/api/admin/{resource}/{item_id}", headers=auth, timeout=10)
        assert rd.status_code in (200, 204), f"{resource} delete failed"


# ---------- Widget/Manager Tabs ----------
class TestManagers:
    def test_widgets_get(self):
        r = requests.get(f"{BASE_URL}/api/widgets", timeout=10)
        assert r.status_code == 200

    def test_media_list(self, auth):
        r = requests.get(f"{BASE_URL}/api/admin/media", headers=auth, timeout=10)
        assert r.status_code == 200

    def test_backup_export(self, auth):
        r = requests.get(f"{BASE_URL}/api/admin/backup", headers=auth, timeout=30)
        assert r.status_code == 200
        assert len(r.content) > 50

    def test_theme_get(self):
        r = requests.get(f"{BASE_URL}/api/theme", timeout=10)
        assert r.status_code == 200

    def test_seo_get_and_save(self, auth):
        r = requests.get(f"{BASE_URL}/api/seo", timeout=10)
        assert r.status_code == 200
        current = r.json()
        # save same values back (no-op)
        r2 = requests.put(f"{BASE_URL}/api/admin/seo", json=current, headers=auth, timeout=10)
        assert r2.status_code in (200, 204)

    def test_sections_toggle(self, auth):
        r = requests.get(f"{BASE_URL}/api/sections", timeout=10)
        assert r.status_code == 200
        secs = r.json()
        original = secs.get("skills", True)
        # toggle
        r2 = requests.put(f"{BASE_URL}/api/admin/sections", json={**secs, "skills": not original}, headers=auth, timeout=10)
        assert r2.status_code in (200, 204)
        after = requests.get(f"{BASE_URL}/api/sections", timeout=10).json()
        assert after.get("skills") == (not original)
        # restore
        r3 = requests.put(f"{BASE_URL}/api/admin/sections", json={**after, "skills": original}, headers=auth, timeout=10)
        assert r3.status_code in (200, 204)
