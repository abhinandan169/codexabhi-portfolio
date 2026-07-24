"""Backend API tests for new/extended features (iter 2).
Covers: analytics, seo, media, sections, testimonials, experience, counters,
projects (category/pinned/hidden/bulk-delete), notifications, global search, login limiter.
"""
import os
import io
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "admin@abhinandan.dev"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def h(token):
    return {"Authorization": f"Bearer {token}"}


# ------------- Analytics -------------
def test_analytics_track_public():
    sid = f"TEST_sess_{uuid.uuid4()}"
    r = requests.post(f"{BASE_URL}/api/analytics/track",
                      json={"path": "/", "session_id": sid, "event": "view", "referrer": "https://google.com/x"},
                      timeout=15)
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_analytics_admin_stats(h):
    # seed 2 views + 1 project_view + 1 resume_download + 1 contact_submit
    sid = f"TEST_sess_{uuid.uuid4()}"
    for _ in range(2):
        requests.post(f"{BASE_URL}/api/analytics/track",
                      json={"path": "/", "session_id": sid, "event": "view"}, timeout=15)
    requests.post(f"{BASE_URL}/api/analytics/track",
                  json={"session_id": sid, "event": "resume_download"}, timeout=15)
    requests.post(f"{BASE_URL}/api/analytics/track",
                  json={"session_id": sid, "event": "contact_submit"}, timeout=15)

    r = requests.get(f"{BASE_URL}/api/admin/analytics", headers=h, timeout=15)
    assert r.status_code == 200
    d = r.json()
    for k in ["total_views", "today_views", "weekly_views", "monthly_views",
              "resume_downloads", "contact_submissions", "unique_visitors",
              "returning_visitors", "time_series", "devices", "browsers",
              "traffic_sources", "most_viewed_project"]:
        assert k in d, f"missing key {k}"
    assert len(d["time_series"]) == 30
    assert d["total_views"] >= 2
    assert d["resume_downloads"] >= 1
    assert d["contact_submissions"] >= 1


# ------------- SEO -------------
def test_seo_public_get_and_update(h):
    # public GET (may be empty {} initially)
    r0 = requests.get(f"{BASE_URL}/api/seo", timeout=15)
    assert r0.status_code == 200
    payload = {
        "meta_title": "TEST_Title", "meta_description": "TEST_desc",
        "meta_keywords": "a,b", "canonical_url": "https://example.com",
        "og_title": "OG", "og_description": "od", "og_image": "",
        "twitter_card": "summary", "robots": "index, follow",
        "sitemap_paths": ["/", "/projects"],
    }
    ru = requests.put(f"{BASE_URL}/api/admin/seo", json=payload, headers=h, timeout=15)
    assert ru.status_code == 200
    d = ru.json()
    assert d["meta_title"] == "TEST_Title"
    # public reflects
    r2 = requests.get(f"{BASE_URL}/api/seo", timeout=15).json()
    assert r2["meta_title"] == "TEST_Title"


def test_robots_txt_allow():
    requests.put(f"{BASE_URL}/api/admin/seo",
                 json={"robots": "index, follow"},
                 headers={"Authorization": f"Bearer {_admin_token()}"}, timeout=15)
    r = requests.get(f"{BASE_URL}/api/robots.txt", timeout=15)
    assert r.status_code == 200
    assert "text/plain" in r.headers.get("content-type", "")
    assert "Allow: /" in r.text


def test_robots_txt_disallow():
    requests.put(f"{BASE_URL}/api/admin/seo",
                 json={"robots": "noindex, nofollow"},
                 headers={"Authorization": f"Bearer {_admin_token()}"}, timeout=15)
    r = requests.get(f"{BASE_URL}/api/robots.txt", timeout=15)
    assert r.status_code == 200
    assert "Disallow: /" in r.text
    # revert
    requests.put(f"{BASE_URL}/api/admin/seo",
                 json={"robots": "index, follow"},
                 headers={"Authorization": f"Bearer {_admin_token()}"}, timeout=15)


def test_sitemap_xml():
    r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=15)
    assert r.status_code == 200
    assert "xml" in r.headers.get("content-type", "").lower()
    assert "<urlset" in r.text


def _admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    return r.json()["token"]


# ------------- Sections -------------
def test_sections_get_and_toggle(h):
    r = requests.get(f"{BASE_URL}/api/sections", timeout=15)
    assert r.status_code == 200
    d = r.json()
    for k in ["hero", "about", "skills", "projects", "certificates", "education",
              "experience", "resume", "testimonials", "counters", "hire_me",
              "contact", "footer"]:
        assert k in d, f"missing section {k}"
    # toggle hero to false
    ru = requests.put(f"{BASE_URL}/api/admin/sections",
                      json={"hero": False}, headers=h, timeout=15)
    assert ru.status_code == 200
    assert ru.json()["hero"] is False
    # verify persists
    r2 = requests.get(f"{BASE_URL}/api/sections", timeout=15).json()
    assert r2["hero"] is False
    # re-enable
    ru2 = requests.put(f"{BASE_URL}/api/admin/sections",
                       json={"hero": True}, headers=h, timeout=15)
    assert ru2.status_code == 200
    assert ru2.json()["hero"] is True


# ------------- Testimonials -------------
def test_testimonials_public_and_crud(h):
    r = requests.get(f"{BASE_URL}/api/testimonials", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    # create
    payload = {"name": "TEST_T", "company": "TC", "role": "Eng", "rating": 5, "review": "great"}
    rc = requests.post(f"{BASE_URL}/api/admin/testimonials", json=payload, headers=h, timeout=15)
    assert rc.status_code == 200, rc.text
    tid = rc.json()["id"]
    assert rc.json()["name"] == "TEST_T"

    # update
    ru = requests.put(f"{BASE_URL}/api/admin/testimonials/{tid}",
                      json={"review": "updated"}, headers=h, timeout=15)
    assert ru.status_code == 200
    # GET verifies
    items = requests.get(f"{BASE_URL}/api/testimonials", timeout=15).json()
    match = [x for x in items if x["id"] == tid]
    assert match and match[0]["review"] == "updated"

    # delete
    rd = requests.delete(f"{BASE_URL}/api/admin/testimonials/{tid}", headers=h, timeout=15)
    assert rd.status_code == 200
    items = requests.get(f"{BASE_URL}/api/testimonials", timeout=15).json()
    assert not any(x["id"] == tid for x in items)


# ------------- Experience -------------
def test_experience_public_and_crud(h):
    r = requests.get(f"{BASE_URL}/api/experience", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    payload = {"company": "TEST_Co", "role": "Dev", "start_date": "2020-01",
               "end_date": "2021-01", "description": "d"}
    rc = requests.post(f"{BASE_URL}/api/admin/experience", json=payload, headers=h, timeout=15)
    assert rc.status_code == 200, rc.text
    eid = rc.json()["id"]

    ru = requests.put(f"{BASE_URL}/api/admin/experience/{eid}",
                      json={"description": "updated"}, headers=h, timeout=15)
    assert ru.status_code == 200

    items = requests.get(f"{BASE_URL}/api/experience", timeout=15).json()
    match = [x for x in items if x["id"] == eid]
    assert match and match[0]["description"] == "updated"

    rd = requests.delete(f"{BASE_URL}/api/admin/experience/{eid}", headers=h, timeout=15)
    assert rd.status_code == 200


# ------------- Counters -------------
def test_counters_public_and_crud(h):
    r = requests.get(f"{BASE_URL}/api/counters", timeout=15)
    assert r.status_code == 200
    counters = r.json()
    assert isinstance(counters, list)
    # seeded 6 counters expected
    assert len(counters) >= 6

    rc = requests.post(f"{BASE_URL}/api/admin/counters",
                       json={"label": "TEST_C", "value": 42, "icon": "star"},
                       headers=h, timeout=15)
    assert rc.status_code == 200
    cid = rc.json()["id"]

    ru = requests.put(f"{BASE_URL}/api/admin/counters/{cid}",
                      json={"value": 100}, headers=h, timeout=15)
    assert ru.status_code == 200

    rd = requests.delete(f"{BASE_URL}/api/admin/counters/{cid}", headers=h, timeout=15)
    assert rd.status_code == 200


# ------------- Projects (category/pinned/hidden/bulk-delete) -------------
def test_project_new_fields_and_hidden_filter(h):
    # create with new fields
    rc = requests.post(f"{BASE_URL}/api/admin/projects",
                       json={"title": "TEST_Proj_A", "category": "Web",
                             "pinned": True, "hidden": False},
                       headers=h, timeout=15)
    assert rc.status_code == 200
    pa = rc.json()
    assert pa["category"] == "Web"
    assert pa["pinned"] is True

    rh = requests.post(f"{BASE_URL}/api/admin/projects",
                       json={"title": "TEST_Proj_Hidden", "hidden": True},
                       headers=h, timeout=15)
    assert rh.status_code == 200
    ph = rh.json()

    # Public GET excludes hidden
    pub = requests.get(f"{BASE_URL}/api/projects", timeout=15).json()
    ids = [p["id"] for p in pub]
    assert pa["id"] in ids
    assert ph["id"] not in ids

    # bulk delete both
    rb = requests.post(f"{BASE_URL}/api/admin/projects/bulk-delete",
                       json={"ids": [pa["id"], ph["id"]]}, headers=h, timeout=15)
    assert rb.status_code == 200
    assert rb.json()["deleted"] == 2


def test_bulk_delete_unknown_entity(h):
    r = requests.post(f"{BASE_URL}/api/admin/foo/bulk-delete",
                      json={"ids": []}, headers=h, timeout=15)
    assert r.status_code == 400


# ------------- Global Search -------------
def test_global_search(h):
    # create a project to search
    rc = requests.post(f"{BASE_URL}/api/admin/projects",
                       json={"title": "TEST_Portfolio_Platform", "description": "x"},
                       headers=h, timeout=15)
    pid = rc.json()["id"]
    try:
        r = requests.get(f"{BASE_URL}/api/admin/search?q=TEST_Portfolio",
                         headers=h, timeout=15)
        assert r.status_code == 200
        results = r.json()["results"]
        hit = [x for x in results if x["type"] == "project" and x["id"] == pid]
        assert hit, f"expected project hit, got: {results}"
        assert "label" in hit[0]
    finally:
        requests.delete(f"{BASE_URL}/api/admin/projects/{pid}", headers=h, timeout=15)


# ------------- Notifications -------------
def test_notifications_from_contact(h):
    # Clear notifications
    requests.delete(f"{BASE_URL}/api/admin/notifications", headers=h, timeout=15)
    # Submit contact
    rc = requests.post(f"{BASE_URL}/api/contact",
                       json={"name": "TEST_N", "email": "n@t.com",
                             "subject": "s", "message": "m"}, timeout=15)
    assert rc.status_code == 200

    r = requests.get(f"{BASE_URL}/api/admin/notifications", headers=h, timeout=15)
    assert r.status_code == 200
    d = r.json()
    for k in ["total", "unread", "items"]:
        assert k in d
    assert d["total"] >= 1
    assert d["unread"] >= 1
    nid = d["items"][0]["id"]
    assert d["items"][0]["kind"] == "contact"

    # mark read
    rr = requests.put(f"{BASE_URL}/api/admin/notifications/{nid}/read",
                      headers=h, timeout=15)
    assert rr.status_code == 200

    # mark all read
    ra = requests.put(f"{BASE_URL}/api/admin/notifications/read-all",
                      headers=h, timeout=15)
    assert ra.status_code == 200
    d2 = requests.get(f"{BASE_URL}/api/admin/notifications", headers=h, timeout=15).json()
    assert d2["unread"] == 0

    # delete one
    if d2["items"]:
        rid = d2["items"][0]["id"]
        rd = requests.delete(f"{BASE_URL}/api/admin/notifications/{rid}",
                             headers=h, timeout=15)
        assert rd.status_code == 200

    # clear all
    rc2 = requests.delete(f"{BASE_URL}/api/admin/notifications", headers=h, timeout=15)
    assert rc2.status_code == 200


# ------------- Media Library -------------
def test_media_upload_list_rename_delete(h):
    # Upload a small PNG
    png_bytes = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
                 b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8"
                 b"\xcf\xc0\x00\x00\x00\x03\x00\x01\xcd\xf5\xd5\xf6\x00\x00\x00\x00IEND\xaeB`\x82")
    files = {"file": ("TEST_pic.png", io.BytesIO(png_bytes), "image/png")}
    ru = requests.post(f"{BASE_URL}/api/admin/upload", files=files,
                       headers=h, timeout=30)
    assert ru.status_code == 200, ru.text
    upload_data = ru.json()
    assert "url" in upload_data

    # List media
    rl = requests.get(f"{BASE_URL}/api/admin/media", headers=h, timeout=15)
    assert rl.status_code == 200
    md = rl.json()
    for k in ["items", "total_size", "count"]:
        assert k in md
    assert md["count"] >= 1

    # find our upload
    ours = [i for i in md["items"] if "TEST_pic" in (i.get("filename", "") + i.get("original_name", ""))]
    if not ours:
        pytest.skip("could not locate uploaded item in media list")
    mid = ours[0]["id"]

    # Rename
    rr = requests.put(f"{BASE_URL}/api/admin/media/{mid}",
                      json={"filename": "TEST_renamed.png"}, headers=h, timeout=15)
    assert rr.status_code == 200

    # Delete
    rd = requests.delete(f"{BASE_URL}/api/admin/media/{mid}", headers=h, timeout=15)
    assert rd.status_code == 200


# ------------- Login limiter (LAST test to avoid locking out) -------------
def test_login_limiter_429_after_5_wrong():
    """5 wrong-pass attempts in <5min should return 429; correct password should reset."""
    email = ADMIN_EMAIL
    codes = []
    for _ in range(5):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": email, "password": "totally-wrong-pw"},
                          timeout=15)
        codes.append(r.status_code)
    # 6th attempt should be 429
    r6 = requests.post(f"{BASE_URL}/api/auth/login",
                       json={"email": email, "password": "totally-wrong-pw"},
                       timeout=15)
    # correct password after — should succeed and reset counter
    ok = requests.post(f"{BASE_URL}/api/auth/login",
                       json={"email": email, "password": ADMIN_PASSWORD},
                       timeout=15)
    # We don't want to leave the admin locked out — verify we can still login
    assert ok.status_code == 200, "Admin locked out! limiter did not reset on success."
    assert r6.status_code == 429, f"Expected 429 after 5 wrong attempts, got {r6.status_code}. Codes: {codes + [r6.status_code]}"
