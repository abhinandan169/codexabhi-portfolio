"""Test extended appearance fields persistence on PUT /api/admin/theme and GET /api/theme."""
import os
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
def auth_headers():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


EXTENDED_FIELDS = {
    "font_family": "Poppins",
    "animations_enabled": True,
    "animation_speed": "fast",
    "cursor_style": "glow",
    "scrollbar_style": "colored",
    "background_style": "grid",
    "glass_effect": True,
    "shadow_intensity": "strong",
    "card_style": "glass",
    "container_width": 1600,
    "navbar_style": "transparent",
    "loader_enabled": False,
    "background_override": "#282A36",
    "text_override": "#F8F8F2",
}


def test_theme_extended_fields_persist(auth_headers):
    # Fetch existing to preserve baseline
    prev = requests.get(f"{BASE_URL}/api/theme", timeout=15).json()
    payload = {**prev, **EXTENDED_FIELDS,
               "primary": "#FF79C6", "accent": "#BD93F9",
               "mode": "dark", "preset": "dark:Dracula"}
    r = requests.put(f"{BASE_URL}/api/admin/theme", json=payload,
                     headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    for k, v in EXTENDED_FIELDS.items():
        assert data.get(k) == v, f"PUT response missing/wrong field {k}: expected {v}, got {data.get(k)}"

    # Public GET reflects
    pub = requests.get(f"{BASE_URL}/api/theme", timeout=15).json()
    for k, v in EXTENDED_FIELDS.items():
        assert pub.get(k) == v, f"public GET missing/wrong field {k}: expected {v}, got {pub.get(k)}"
    assert pub.get("preset") == "dark:Dracula"


def test_restore_modern_light_theme(auth_headers):
    """Restore theme to a Modern light preset so portfolio stays presentable."""
    payload = {
        "primary": "#E53935", "secondary": "#111111", "accent": "#FF7A70",
        "background": "#FFFFFF", "background_alt": "#FAFAFA",
        "text": "#111111", "text_secondary": "#555555",
        "mode": "light", "button_style": "pill", "radius": 12,
        "preset": "light:Modern",
        "font_family": "DM Sans",
        "animations_enabled": True, "animation_speed": "normal",
        "cursor_style": "default", "scrollbar_style": "default",
        "background_style": "solid", "glass_effect": False,
        "shadow_intensity": "medium", "card_style": "filled",
        "container_width": 1280, "navbar_style": "blur",
        "loader_enabled": True,
        "background_override": None, "text_override": None,
    }
    r = requests.put(f"{BASE_URL}/api/admin/theme", json=payload,
                     headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    pub = requests.get(f"{BASE_URL}/api/theme", timeout=15).json()
    assert pub["mode"] == "light"
    assert pub["preset"] == "light:Modern"
