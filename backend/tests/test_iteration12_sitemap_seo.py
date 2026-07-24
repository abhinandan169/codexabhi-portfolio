"""Iteration 12 narrow retest: sitemap fallback + SEO doc cleanliness."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kumar-software-hub.preview.emergentagent.com").rstrip("/")
PUBLIC_APP_URL = "https://kumar-software-hub.preview.emergentagent.com"
ADMIN_EMAIL = "admin@abhinandan.dev"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def original_seo(auth_headers):
    r = requests.get(f"{BASE_URL}/api/seo", timeout=10)
    assert r.status_code == 200
    return r.json()


def _put_seo(auth_headers, seo_doc):
    payload = {k: v for k, v in seo_doc.items() if k not in ("_id",)}
    r = requests.put(f"{BASE_URL}/api/admin/seo", headers=auth_headers, json=payload, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


# ---------------- Robots.txt ----------------
def test_robots_txt_healthy():
    r = requests.get(f"{BASE_URL}/api/robots.txt", timeout=10)
    assert r.status_code == 200
    body = r.text
    assert body.startswith("User-agent: *"), body
    assert ("Allow:" in body) or ("Disallow:" in body), body


# ---------------- SEO doc cleanliness ----------------
def test_seo_doc_production_values(original_seo):
    s = original_seo
    assert s.get("meta_description") != "TEST_desc", f"meta_description still TEST_desc: {s}"
    assert s.get("og_title") != "OG", f"og_title still OG: {s}"
    assert s.get("canonical_url") != "https://example.com", f"canonical_url still example.com: {s}"
    # It should be the production URL now
    assert s.get("canonical_url") == PUBLIC_APP_URL, f"canonical_url unexpected: {s.get('canonical_url')}"


# ---------------- Sitemap correctness (baseline) ----------------
def test_sitemap_baseline_uses_production_url():
    r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=10)
    assert r.status_code == 200
    ct = r.headers.get("content-type", "")
    assert "application/xml" in ct, ct
    body = r.text
    assert "example.com" not in body, body
    assert PUBLIC_APP_URL in body, body
    # Well-formed urlset with at least one <url><loc>...</loc></url>
    assert "<urlset" in body and "</urlset>" in body
    assert re.search(r"<url><loc>[^<]+</loc></url>", body), body


# ---------------- Sitemap fallback tests ----------------
def test_sitemap_fallback_when_example_com(auth_headers, original_seo):
    # Set canonical_url to example.com
    seo_copy = dict(original_seo)
    seo_copy["canonical_url"] = "https://example.com"
    _put_seo(auth_headers, seo_copy)

    r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=10)
    assert r.status_code == 200
    body = r.text
    assert "example.com" not in body, f"sitemap did not fallback: {body}"
    assert "kumar-software-hub.preview.emergentagent.com" in body, body


def test_sitemap_fallback_when_empty(auth_headers, original_seo):
    seo_copy = dict(original_seo)
    seo_copy["canonical_url"] = ""
    _put_seo(auth_headers, seo_copy)

    r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=10)
    assert r.status_code == 200
    body = r.text
    assert "example.com" not in body, body
    assert "kumar-software-hub.preview.emergentagent.com" in body, body


# ---------------- Restore ----------------
def test_zz_restore_canonical_url(auth_headers, original_seo):
    seo_copy = dict(original_seo)
    seo_copy["canonical_url"] = PUBLIC_APP_URL
    _put_seo(auth_headers, seo_copy)

    r = requests.get(f"{BASE_URL}/api/seo", timeout=10)
    assert r.status_code == 200
    assert r.json().get("canonical_url") == PUBLIC_APP_URL

    r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=10)
    assert PUBLIC_APP_URL in r.text
    assert "example.com" not in r.text
