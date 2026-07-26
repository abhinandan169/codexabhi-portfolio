from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import json as _json
import logging
import uuid
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
import aiofiles

import cloudinary
import cloudinary.uploader
import cloudinary.api

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

cloudinary.config(
    cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
    api_key=os.environ["CLOUDINARY_API_KEY"],
    api_secret=os.environ["CLOUDINARY_API_SECRET"],
    secure=True
)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Auth
SECRET_KEY = os.environ.get('JWT_SECRET', 'change-me-in-prod-abhi-portfolio-2026')
ALGORITHM = 'HS256'
TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Uploads
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Abhinandan Kumar Portfolio API")
api_router = APIRouter(prefix="/api")

# ------------------ Models ------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()

class Profile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Abhinandan Kumar"
    title: str = "Software Engineer"
    tagline: str = "Building scalable software with clean code."
    intro: str = ""
    about: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    profile_image: str = ""
    typing_texts: List[str] = []
    updated_at: str = Field(default_factory=now_iso)

class Skill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    level: int = 80  # 0-100
    category: str = "General"
    order: int = 0
    status: str = "published"  # published | draft

class SkillCreate(BaseModel):
    name: str
    level: int = 80
    category: str = "General"
    order: int = 0
    status: str = "published"

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    technologies: List[str] = []
    github_link: str = ""
    live_demo: str = ""
    cover_image: str = ""
    screenshots: List[str] = []
    featured: bool = False
    pinned: bool = False
    category: str = "Other"
    hidden: bool = False
    order: int = 0
    status: str = "published"  # published | draft
    created_at: str = Field(default_factory=now_iso)

class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    technologies: List[str] = []
    github_link: str = ""
    live_demo: str = ""
    cover_image: str = ""
    screenshots: List[str] = []
    featured: bool = False
    pinned: bool = False
    category: str = "Other"
    hidden: bool = False
    order: int = 0
    status: str = "published"

class Certificate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    organization: str = ""
    date: str = ""
    image: str = ""
    credential_link: str = ""
    order: int = 0
    status: str = "published"

class CertificateCreate(BaseModel):
    name: str
    organization: str = ""
    date: str = ""
    image: str = ""
    credential_link: str = ""
    order: int = 0
    status: str = "published"

class Education(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    degree: str
    college: str = ""
    university: str = ""
    cgpa: str = ""
    passing_year: str = ""
    order: int = 0
    status: str = "published"

class EducationCreate(BaseModel):
    degree: str
    college: str = ""
    university: str = ""
    cgpa: str = ""
    passing_year: str = ""
    order: int = 0
    status: str = "published"

class SocialLink(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: str  # github, linkedin, twitter, whatsapp, instagram, email
    url: str
    order: int = 0

class SocialLinkCreate(BaseModel):
    platform: str
    url: str
    order: int = 0

class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    subject: str = ""
    message: str
    read: bool = False
    created_at: str = Field(default_factory=now_iso)

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str = ""
    message: str

class Resume(BaseModel):
    id: str = "resume-doc"
    file_url: str = ""
    file_name: str = ""
    updated_at: str = Field(default_factory=now_iso)

class LoginRequest(BaseModel):
    email: str
    password: str

class AdminUser(BaseModel):
    email: str
    password_hash: str

# ------------------ Auth ------------------
def create_token(email: str, token_version: int = 0) -> str:
    payload = {
        "sub": email,
        "tv": token_version,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def verify_token(creds: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        tv = payload.get("tv", 0)
        if not email:
            raise HTTPException(401, "Invalid token")
        # Enforce token version (invalidates on password/email change)
        user = await db.admin_users.find_one({"email": email})
        if not user or int(user.get("token_version", 0)) != int(tv):
            raise HTTPException(401, "Session expired. Please login again.")
        return email
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

async def is_admin_request(request: Request) -> bool:
    """Non-raising check: returns True if the request carries a valid admin JWT."""
    auth = request.headers.get("authorization") or request.headers.get("Authorization") or ""
    if not auth.lower().startswith("bearer "):
        return False
    token = auth.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub"); tv = payload.get("tv", 0)
        user = await db.admin_users.find_one({"email": email})
        return bool(user and int(user.get("token_version", 0)) == int(tv))
    except Exception:
        return False

async def seed_admin():
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@abhinandan.dev')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'Admin@123')
    existing = await db.admin_users.find_one({"email": admin_email})
    if not existing:
        await db.admin_users.insert_one({
            "email": admin_email,
            "password_hash": pwd_context.hash(admin_password),
            "token_version": 0,
        })
        logger.info(f"Seeded admin: {admin_email}")

async def log_activity(action: str, entity: str = "", details: str = ""):
    await db.activity_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": action,
        "entity": entity,
        "details": details,
        "created_at": now_iso(),
    })

async def seed_defaults():
    # Profile
    if not await db.profile.find_one({"id": "main"}):
        p = Profile(
            id="main",
            name="Abhinandan Kumar",
            title="Software Engineer",
            tagline="Turning ideas into elegant, scalable software.",
            intro="I'm a passionate Software Engineer specializing in Python, SQL, DSA, and OOP. I build robust backend systems and modern web applications with a focus on clean architecture and performance.",
            about="I'm a Software Engineer with a strong foundation in computer science fundamentals — Data Structures, Algorithms, Object-Oriented Programming, and Databases. I love solving complex problems, designing scalable systems, and crafting delightful user experiences. My work spans backend engineering, API design, and full-stack development. I'm always learning, always shipping.",
            email="abhinandan@example.com",
            phone="+91 90000 00000",
            location="India",
            profile_image="https://images.unsplash.com/photo-1770058428099-f2d64ab34006?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBzb2Z0d2FyZSUyMGVuZ2luZWVyJTIwcG9ydHJhaXQlMjBzdHVkaW8lMjBsaWdodHxlbnwwfHx8fDE3ODM1MDk2MjV8MA&ixlib=rb-4.1.0&q=85",
            typing_texts=["Software Engineer", "Python Developer", "Backend Engineer", "Problem Solver", "DSA Enthusiast"],
        )
        await db.profile.insert_one(p.model_dump())

    # Skills
    if await db.skills.count_documents({}) == 0:
        defaults = [
            {"name": "Python", "level": 92, "category": "Language", "order": 1},
            {"name": "SQL", "level": 88, "category": "Database", "order": 2},
            {"name": "DSA", "level": 85, "category": "Core CS", "order": 3},
            {"name": "OOPs", "level": 90, "category": "Core CS", "order": 4},
        ]
        for s in defaults:
            await db.skills.insert_one(Skill(**s).model_dump())

    # Projects
    if await db.projects.count_documents({}) == 0:
        samples = [
            {
                "title": "Portfolio Platform",
                "description": "A modern, admin-managed portfolio built with React and FastAPI featuring animated skills, CRUD dashboard, and file uploads.",
                "technologies": ["React", "FastAPI", "MongoDB", "TailwindCSS"],
                "github_link": "https://github.com/abhinandan",
                "live_demo": "",
                "cover_image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjbGVhbiUyMGRhc2hib2FyZCUyMHNvZnR3YXJlJTIwd2ViJTIwYXBwJTIwaW50ZXJmYWNlfGVufDB8fHx8MTc4MzUwOTYyNXww&ixlib=rb-4.1.0&q=85",
                "screenshots": [],
                "featured": True,
                "order": 1,
            },
            {
                "title": "Analytics Dashboard",
                "description": "Real-time analytics dashboard with beautiful charts and role-based access control.",
                "technologies": ["Python", "SQL", "React", "Recharts"],
                "github_link": "https://github.com/abhinandan",
                "live_demo": "",
                "cover_image": "https://images.unsplash.com/photo-1686061592689-312bbfb5c055?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBjbGVhbiUyMGRhc2hib2FyZCUyMHNvZnR3YXJlJTIwd2ViJTIwYXBwJTIwaW50ZXJmYWNlfGVufDB8fHx8MTc4MzUwOTYyNXww&ixlib=rb-4.1.0&q=85",
                "screenshots": [],
                "featured": False,
                "order": 2,
            },
            {
                "title": "Algorithm Visualizer",
                "description": "Interactive tool to visualize sorting, graph, and pathfinding algorithms in real-time.",
                "technologies": ["JavaScript", "DSA", "Canvas"],
                "github_link": "https://github.com/abhinandan",
                "live_demo": "",
                "cover_image": "",
                "screenshots": [],
                "featured": False,
                "order": 3,
            },
        ]
        for s in samples:
            await db.projects.insert_one(Project(**s).model_dump())

    # Certificates
    if await db.certificates.count_documents({}) == 0:
        samples = [
            {"name": "Python for Everybody", "organization": "Coursera", "date": "2024", "credential_link": "https://coursera.org", "order": 1},
            {"name": "SQL Advanced", "organization": "HackerRank", "date": "2024", "credential_link": "https://hackerrank.com", "order": 2},
            {"name": "Data Structures & Algorithms", "organization": "GeeksforGeeks", "date": "2023", "credential_link": "https://geeksforgeeks.org", "order": 3},
        ]
        for s in samples:
            await db.certificates.insert_one(Certificate(**s).model_dump())

    # Education
    if await db.education.count_documents({}) == 0:
        samples = [
            {"degree": "B.Tech in Computer Science", "college": "Your Engineering College", "university": "Your University", "cgpa": "8.5", "passing_year": "2024", "order": 1},
            {"degree": "12th (Science)", "college": "Your Senior Secondary School", "university": "CBSE", "cgpa": "90%", "passing_year": "2020", "order": 2},
        ]
        for s in samples:
            await db.education.insert_one(Education(**s).model_dump())

    # Social Links
    if await db.social_links.count_documents({}) == 0:
        samples = [
            {"platform": "github", "url": "https://github.com/abhinandan", "order": 1},
            {"platform": "linkedin", "url": "https://linkedin.com/in/abhinandan", "order": 2},
            {"platform": "twitter", "url": "https://twitter.com/abhinandan", "order": 3},
            {"platform": "whatsapp", "url": "https://wa.me/919000000000", "order": 4},
            {"platform": "email", "url": "mailto:abhinandan@example.com", "order": 5},
            {"platform": "instagram", "url": "https://instagram.com/abhinandan", "order": 6},
        ]
        for s in samples:
            await db.social_links.insert_one(SocialLink(**s).model_dump())

    # Resume placeholder
    if not await db.resume.find_one({"id": "resume-doc"}):
        await db.resume.insert_one(Resume().model_dump())

    # Theme defaults
    if not await db.theme.find_one({"id": "site-theme"}):
        await db.theme.insert_one({**DEFAULT_THEME, "updated_at": now_iso()})

    # SEO defaults
    if not await db.seo.find_one({"id": "site-seo"}):
        await db.seo.insert_one({**DEFAULT_SEO, "updated_at": now_iso()})

    # Sections defaults
    if not await db.sections.find_one({"id": "site-sections"}):
        await db.sections.insert_one(DEFAULT_SECTIONS.copy())

    # Counters defaults
    if await db.counters.count_documents({}) == 0:
        for c in DEFAULT_COUNTERS:
            await db.counters.insert_one(c.copy())

    # Testimonials defaults
    if await db.testimonials.count_documents({}) == 0:
        samples = [
            {"name": "Jane Doe", "company": "TechCorp", "role": "Engineering Manager", "rating": 5,
             "review": "Abhinandan delivered clean, well-tested code on time. His grasp of DSA and system design impressed our whole team.",
             "photo": "", "linkedin": "https://linkedin.com/in/jane", "order": 1, "featured": True},
            {"name": "Rahul Verma", "company": "StartupX", "role": "CTO", "rating": 5,
             "review": "One of the sharpest engineers I've worked with — great communicator and always focused on quality.",
             "photo": "", "linkedin": "", "order": 2, "featured": True},
            {"name": "Priya Sharma", "company": "DataLabs", "role": "Senior Engineer", "rating": 5,
             "review": "Solid backend fundamentals, thoughtful reviews, and shipped features fast. Would hire again in a heartbeat.",
             "photo": "", "linkedin": "", "order": 3, "featured": False},
        ]
        for s in samples:
            await db.testimonials.insert_one(Testimonial(**s).model_dump())

    # Experience defaults
    if await db.experience.count_documents({}) == 0:
        samples = [
            {"company": "Freelance Projects", "role": "Software Engineer",
             "employment_type": "Freelance", "location": "Remote",
             "start_date": "2023", "end_date": "", "currently_working": True,
             "description": "Building web applications, APIs, and automation tools for early-stage founders and small teams.",
             "technologies": ["Python", "React", "FastAPI", "MongoDB"], "company_logo": "", "order": 1, "featured": True},
            {"company": "College Coding Club", "role": "Backend Lead",
             "employment_type": "Volunteer", "location": "On-site",
             "start_date": "2022", "end_date": "2024", "currently_working": False,
             "description": "Led backend workshops, mentored juniors on DSA, and organized coding contests.",
             "technologies": ["Python", "SQL", "DSA"], "company_logo": "", "order": 2, "featured": False},
        ]
        for s in samples:
            await db.experience.insert_one(Experience(**s).model_dump())

def clean(doc):
    if doc is None:
        return None
    doc.pop("_id", None)
    return doc

# ------------------ Public Endpoints ------------------
@api_router.get("/")
async def root():
    return {"message": "Portfolio API", "status": "ok"}

@api_router.get("/profile")
async def get_profile():
    p = await db.profile.find_one({"id": "main"})
    # increment view counter (best effort, non-blocking style)
    try:
        await db.stats.update_one({"id": "views"}, {"$inc": {"count": 1}}, upsert=True)
    except Exception:
        pass
    return clean(p) or {}

@api_router.get("/skills")
async def get_skills(request: Request):
    q = {} if await is_admin_request(request) else {"status": {"$ne": "draft"}}
    items = await db.skills.find(q).sort("order", 1).to_list(1000)
    return [clean(i) for i in items]

@api_router.get("/projects")
async def get_projects(request: Request):
    base = {"hidden": {"$ne": True}}
    if not await is_admin_request(request):
        base["status"] = {"$ne": "draft"}
    else:
        base = {}  # admin sees everything (drafts + hidden)
    items = await db.projects.find(base).sort([("pinned", -1), ("order", 1)]).to_list(1000)
    return [clean(i) for i in items]

@api_router.get("/certificates")
async def get_certificates(request: Request):
    q = {} if await is_admin_request(request) else {"status": {"$ne": "draft"}}
    items = await db.certificates.find(q).sort("order", 1).to_list(1000)
    return [clean(i) for i in items]

@api_router.get("/education")
async def get_education(request: Request):
    q = {} if await is_admin_request(request) else {"status": {"$ne": "draft"}}
    items = await db.education.find(q).sort("order", 1).to_list(1000)
    return [clean(i) for i in items]

@api_router.get("/social-links")
async def get_social_links():
    items = await db.social_links.find().sort("order", 1).to_list(1000)
    return [clean(i) for i in items]

@api_router.get("/resume")
async def get_resume():
    r = await db.resume.find_one({"id": "resume-doc"})
    return clean(r) or {"file_url": "", "file_name": ""}

# Public: theme config for the site
@api_router.get("/theme")
async def get_theme_public():
    t = await db.theme.find_one({"id": "site-theme"})
    return clean(t) or {}

# Public: increment resume download counter
@api_router.post("/resume/track-download")
async def track_resume_download():
    await db.stats.update_one({"id": "resume_downloads"}, {"$inc": {"count": 1}}, upsert=True)
    await db.analytics.insert_one({
        "id": str(uuid.uuid4()), "event": "resume_download", "path": "/resume",
        "session_id": "", "referrer": "", "device": "", "browser": "",
        "ip": "", "created_at": now_iso(),
    })
    await add_notification("resume_download", "Resume Downloaded", "Someone downloaded your resume")
    return {"ok": True}

@api_router.post("/contact")
async def submit_contact(msg: ContactMessageCreate):
    m = ContactMessage(**msg.model_dump())
    await db.contact_messages.insert_one(m.model_dump())
    await log_activity("Message Received", "contact", f"{m.name} <{m.email}>")
    await add_notification("contact", "New Contact Message", f"From {m.name} <{m.email}>")
    return {"success": True, "id": m.id}

# ------------------ Auth ------------------
@api_router.post("/auth/login")
async def login(body: LoginRequest):
    now = datetime.now(timezone.utc).timestamp()
    arr = LOGIN_ATTEMPTS.get(body.email, [])
    arr = [t for t in arr if now - t < WINDOW_SECONDS]
    if len(arr) >= MAX_ATTEMPTS:
        raise HTTPException(429, f"Too many failed attempts. Try again in {WINDOW_SECONDS // 60} minutes.")
    user = await db.admin_users.find_one({"email": body.email})
    if not user or not pwd_context.verify(body.password, user["password_hash"]):
        arr.append(now)
        LOGIN_ATTEMPTS[body.email] = arr
        remaining = MAX_ATTEMPTS - len(arr)
        raise HTTPException(401, f"Invalid credentials. {remaining} attempt(s) remaining.")
    LOGIN_ATTEMPTS[body.email] = []
    tv = int(user.get("token_version", 0))
    token = create_token(body.email, tv)
    return {"token": token, "email": body.email}

@api_router.get("/auth/me")
async def me(email: str = Depends(verify_token)):
    return {"email": email}

# ------------------ Password Reset ------------------
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

def _send_reset_email(to_email: str, reset_url: str) -> tuple[bool, str]:
    """Send the reset email via Resend. Returns (ok, provider_id_or_error)."""
    api_key = os.environ.get('RESEND_API_KEY', '').strip()
    sender = os.environ.get('SENDER_EMAIL', '').strip()
    if not api_key or not sender or api_key.startswith('re_xxxx'):
        return False, "email_not_configured"
    try:
        import resend as _resend
        _resend.api_key = api_key
        html = (
            f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px'>"
            f"<h2 style='color:#E53935;margin:0 0 12px 0'>Password Reset Request</h2>"
            f"<p>We received a request to reset the password for your admin account.</p>"
            f"<p style='margin:24px 0'>"
            f"<a href='{reset_url}' style='background:#E53935;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block'>Reset Password</a>"
            f"</p>"
            f"<p style='color:#666;font-size:13px'>Or copy this link: <br><span style='word-break:break-all'>{reset_url}</span></p>"
            f"<p style='color:#999;font-size:12px;margin-top:32px'>This link expires in {os.environ.get('RESET_TOKEN_TTL_MINUTES','30')} minutes. If you did not request this, you can safely ignore this email.</p>"
            f"</div>"
        )
        params = {"from": sender, "to": [to_email], "subject": "Reset your admin password", "html": html}
        res = _resend.Emails.send(params)
        return True, str(res.get("id", ""))
    except Exception as e:
        logger.warning(f"Resend send failed: {e}")
        return False, str(e)

@api_router.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """Generate a reset token and email a reset link. Always returns 200 to avoid email enumeration."""
    user = await db.admin_users.find_one({"email": body.email})
    resp = {"success": True, "message": "If that email is registered, a reset link has been sent."}
    if not user:
        # Silent: don't reveal existence.
        return resp
    ttl = int(os.environ.get('RESET_TOKEN_TTL_MINUTES', '30'))
    token = uuid.uuid4().hex + uuid.uuid4().hex  # 64-char opaque token
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=ttl)
    await db.password_resets.insert_one({
        "id": str(uuid.uuid4()),
        "token": token,
        "email": body.email,
        "created_at": now.isoformat(),
        "expires_at": expires.isoformat(),
        "used": False,
    })
    base = (os.environ.get('PUBLIC_APP_URL') or '').rstrip('/')
    reset_url = f"{base}/admin/reset/{token}"
    ok, provider_info = await asyncio.to_thread(_send_reset_email, body.email, reset_url)
    await log_activity(
        "Password Reset Requested",
        "auth",
        f"{body.email} · {'email sent' if ok else 'email skipped ('+provider_info+')'} · {reset_url}",
    )
    # If email was not configured, expose the URL to help admin recovery (still requires knowing the admin email).
    if not ok:
        resp["debug_reset_url"] = reset_url
    return resp

@api_router.get("/auth/reset/{token}")
async def validate_reset_token(token: str):
    doc = await db.password_resets.find_one({"token": token})
    if not doc or doc.get("used"):
        raise HTTPException(400, "Invalid or already-used reset link.")
    try:
        exp = datetime.fromisoformat(doc["expires_at"].replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(400, "Invalid reset link.")
    if datetime.now(timezone.utc) > exp:
        raise HTTPException(400, "This reset link has expired. Please request a new one.")
    return {"valid": True, "email": doc["email"]}

@api_router.post("/auth/reset-password")
async def reset_password(body: ResetPasswordRequest):
    if not body.new_password or len(body.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters.")
    doc = await db.password_resets.find_one({"token": body.token})
    if not doc or doc.get("used"):
        raise HTTPException(400, "Invalid or already-used reset link.")
    try:
        exp = datetime.fromisoformat(doc["expires_at"].replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(400, "Invalid reset link.")
    if datetime.now(timezone.utc) > exp:
        raise HTTPException(400, "This reset link has expired. Please request a new one.")
    email = doc["email"]
    new_hash = pwd_context.hash(body.new_password)
    # Update password + bump token_version to invalidate all existing sessions.
    await db.admin_users.update_one(
        {"email": email},
        {"$set": {"password_hash": new_hash}, "$inc": {"token_version": 1}},
    )
    await db.password_resets.update_one({"token": body.token}, {"$set": {"used": True, "used_at": now_iso()}})
    # Invalidate all pending resets for this email so unused old links stop working.
    await db.password_resets.update_many({"email": email, "used": False}, {"$set": {"used": True, "used_at": now_iso()}})
    LOGIN_ATTEMPTS[email] = []  # clear any brute-force lockout
    await log_activity("Password Reset Completed", "auth", email)
    await add_notification("security", "Password Reset", f"Password for {email} was reset via the forgot-password flow.")
    return {"success": True, "message": "Password updated. You can now log in."}

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ChangeEmailRequest(BaseModel):
    current_password: str
    new_email: EmailStr

@api_router.put("/admin/account/password")
async def change_password(body: ChangePasswordRequest, email: str = Depends(verify_token)):
    user = await db.admin_users.find_one({"email": email})
    if not user or not pwd_context.verify(body.current_password, user["password_hash"]):
        raise HTTPException(401, "Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(400, "New password must be at least 6 characters")
    new_tv = int(user.get("token_version", 0)) + 1
    await db.admin_users.update_one(
        {"email": email},
        {"$set": {"password_hash": pwd_context.hash(body.new_password), "token_version": new_tv}},
    )
    await log_activity("Password Changed", "account", email)
    return {"ok": True, "message": "Password changed. Please login again."}

@api_router.put("/admin/account/email")
async def change_email(body: ChangeEmailRequest, email: str = Depends(verify_token)):
    user = await db.admin_users.find_one({"email": email})
    if not user or not pwd_context.verify(body.current_password, user["password_hash"]):
        raise HTTPException(401, "Current password is incorrect")
    existing = await db.admin_users.find_one({"email": body.new_email})
    if existing and existing.get("email") != email:
        raise HTTPException(400, "Email already in use")
    new_tv = int(user.get("token_version", 0)) + 1
    await db.admin_users.update_one(
        {"email": email},
        {"$set": {"email": body.new_email, "token_version": new_tv}},
    )
    await log_activity("Email Changed", "account", f"{email} -> {body.new_email}")
    return {"ok": True, "message": "Email updated. Please login again.", "new_email": body.new_email}

# ------------------ Admin: Profile ------------------
@api_router.put("/admin/profile")
async def update_profile(body: dict, _=Depends(verify_token)):
    body["updated_at"] = now_iso()
    body["id"] = "main"
    await db.profile.update_one({"id": "main"}, {"$set": body}, upsert=True)
    p = await db.profile.find_one({"id": "main"})
    await log_activity("Profile Updated", "profile", body.get("name", ""))
    return clean(p)

# ------------------ Admin: Skills ------------------
@api_router.post("/admin/skills")
async def create_skill(body: SkillCreate, _=Depends(verify_token)):
    s = Skill(**body.model_dump())
    await db.skills.insert_one(s.model_dump())
    await log_activity("Skill Added", "skill", s.name)
    return s.model_dump()

@api_router.put("/admin/skills/{sid}")
async def update_skill(sid: str, body: dict, _=Depends(verify_token)):
    body.pop("id", None)
    await db.skills.update_one({"id": sid}, {"$set": body})
    s = await db.skills.find_one({"id": sid})
    if not s:
        raise HTTPException(404, "Not found")
    await log_activity("Skill Updated", "skill", s.get("name", ""))
    return clean(s)

@api_router.delete("/admin/skills/{sid}")
async def delete_skill(sid: str, _=Depends(verify_token)):
    s = await db.skills.find_one({"id": sid})
    res = await db.skills.delete_one({"id": sid})
    if res.deleted_count:
        await log_activity("Skill Deleted", "skill", (s or {}).get("name", sid))
    return {"deleted": res.deleted_count}

# ------------------ Admin: Projects ------------------
@api_router.post("/admin/projects")
async def create_project(body: ProjectCreate, _=Depends(verify_token)):
    p = Project(**body.model_dump())
    await db.projects.insert_one(p.model_dump())
    await log_activity("Project Added", "project", p.title)
    return p.model_dump()

@api_router.put("/admin/projects/{pid}")
async def update_project(pid: str, body: dict, _=Depends(verify_token)):
    body.pop("id", None)
    await db.projects.update_one({"id": pid}, {"$set": body})
    p = await db.projects.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Not found")
    await log_activity("Project Updated", "project", p.get("title", ""))
    return clean(p)

@api_router.delete("/admin/projects/{pid}")
async def delete_project(pid: str, _=Depends(verify_token)):
    p = await db.projects.find_one({"id": pid})
    res = await db.projects.delete_one({"id": pid})
    if res.deleted_count:
        await log_activity("Project Deleted", "project", (p or {}).get("title", pid))
    return {"deleted": res.deleted_count}

# ------------------ Admin: Certificates ------------------
@api_router.post("/admin/certificates")
async def create_cert(body: CertificateCreate, _=Depends(verify_token)):
    c = Certificate(**body.model_dump())
    await db.certificates.insert_one(c.model_dump())
    await log_activity("Certificate Added", "certificate", c.name)
    return c.model_dump()

@api_router.put("/admin/certificates/{cid}")
async def update_cert(cid: str, body: dict, _=Depends(verify_token)):
    body.pop("id", None)
    await db.certificates.update_one({"id": cid}, {"$set": body})
    c = await db.certificates.find_one({"id": cid})
    if not c:
        raise HTTPException(404, "Not found")
    await log_activity("Certificate Updated", "certificate", c.get("name", ""))
    return clean(c)

@api_router.delete("/admin/certificates/{cid}")
async def delete_cert(cid: str, _=Depends(verify_token)):
    c = await db.certificates.find_one({"id": cid})
    res = await db.certificates.delete_one({"id": cid})
    if res.deleted_count:
        await log_activity("Certificate Deleted", "certificate", (c or {}).get("name", cid))
    return {"deleted": res.deleted_count}

# ------------------ Admin: Education ------------------
@api_router.post("/admin/education")
async def create_edu(body: EducationCreate, _=Depends(verify_token)):
    e = Education(**body.model_dump())
    await db.education.insert_one(e.model_dump())
    await log_activity("Education Added", "education", e.degree)
    return e.model_dump()

@api_router.put("/admin/education/{eid}")
async def update_edu(eid: str, body: dict, _=Depends(verify_token)):
    body.pop("id", None)
    await db.education.update_one({"id": eid}, {"$set": body})
    e = await db.education.find_one({"id": eid})
    if not e:
        raise HTTPException(404, "Not found")
    await log_activity("Education Updated", "education", e.get("degree", ""))
    return clean(e)

@api_router.delete("/admin/education/{eid}")
async def delete_edu(eid: str, _=Depends(verify_token)):
    e = await db.education.find_one({"id": eid})
    res = await db.education.delete_one({"id": eid})
    if res.deleted_count:
        await log_activity("Education Deleted", "education", (e or {}).get("degree", eid))
    return {"deleted": res.deleted_count}

# ------------------ Admin: Social Links ------------------
@api_router.post("/admin/social-links")
async def create_social(body: SocialLinkCreate, _=Depends(verify_token)):
    s = SocialLink(**body.model_dump())
    await db.social_links.insert_one(s.model_dump())
    await log_activity("Social Link Added", "social", s.platform)
    return s.model_dump()

@api_router.put("/admin/social-links/{sid}")
async def update_social(sid: str, body: dict, _=Depends(verify_token)):
    body.pop("id", None)
    await db.social_links.update_one({"id": sid}, {"$set": body})
    s = await db.social_links.find_one({"id": sid})
    if not s:
        raise HTTPException(404, "Not found")
    await log_activity("Social Link Updated", "social", s.get("platform", ""))
    return clean(s)

@api_router.delete("/admin/social-links/{sid}")
async def delete_social(sid: str, _=Depends(verify_token)):
    s = await db.social_links.find_one({"id": sid})
    res = await db.social_links.delete_one({"id": sid})
    if res.deleted_count:
        await log_activity("Social Link Deleted", "social", (s or {}).get("platform", sid))
    return {"deleted": res.deleted_count}

# ------------------ Admin: Contact Messages ------------------
@api_router.get("/admin/messages")
async def get_messages(_=Depends(verify_token), q: Optional[str] = None, page: int = 1, page_size: int = 20):
    query = {}
    if q:
        query = {"$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"message": {"$regex": q, "$options": "i"}},
        ]}
    total = await db.contact_messages.count_documents(query)
    skip = (page - 1) * page_size
    items = await db.contact_messages.find(query).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    return {"total": total, "page": page, "page_size": page_size, "items": [clean(i) for i in items]}

@api_router.delete("/admin/messages/{mid}")
async def delete_message(mid: str, _=Depends(verify_token)):
    res = await db.contact_messages.delete_one({"id": mid})
    return {"deleted": res.deleted_count}

@api_router.put("/admin/messages/{mid}/read")
async def mark_read(mid: str, _=Depends(verify_token)):
    await db.contact_messages.update_one({"id": mid}, {"$set": {"read": True}})
    return {"ok": True}

# ------------------ Admin: Resume ------------------
@api_router.put("/admin/resume")
async def update_resume(body: dict, _=Depends(verify_token)):
    body["id"] = "resume-doc"
    body["updated_at"] = now_iso()
    await db.resume.update_one({"id": "resume-doc"}, {"$set": body}, upsert=True)
    r = await db.resume.find_one({"id": "resume-doc"})
    await log_activity("Resume Updated", "resume", body.get("file_name", ""))
    return clean(r)

# ------------------ Admin: Theme ------------------
DEFAULT_THEME = {
    "id": "site-theme",
    "primary": "#E53935",
    "secondary": "#111111",
    "accent": "#FF7A70",
    "background": "#FFFFFF",
    "background_alt": "#FAFAFA",
    "text": "#111111",
    "text_secondary": "#555555",
    "border": "#E5E7EB",
    "button_style": "pill",   # pill | rounded | square
    "radius": 12,              # px
    "mode": "light",           # light | dark
    "preset": "red",
    "updated_at": "",
}

@api_router.put("/admin/theme")
async def update_theme(body: dict, _=Depends(verify_token)):
    body["id"] = "site-theme"
    body["updated_at"] = now_iso()
    await db.theme.update_one({"id": "site-theme"}, {"$set": body}, upsert=True)
    t = await db.theme.find_one({"id": "site-theme"})
    await log_activity("Theme Changed", "theme", body.get("preset", body.get("primary", "")))
    return clean(t)

# ------------------ Admin: Dashboard Stats ------------------
@api_router.get("/admin/stats")
async def get_stats(_=Depends(verify_token)):
    counts = {}
    counts["projects"] = await db.projects.count_documents({})
    counts["skills"] = await db.skills.count_documents({})
    counts["certificates"] = await db.certificates.count_documents({})
    counts["education"] = await db.education.count_documents({})
    counts["messages"] = await db.contact_messages.count_documents({})
    counts["unread_messages"] = await db.contact_messages.count_documents({"read": False})
    views = await db.stats.find_one({"id": "views"})
    downloads = await db.stats.find_one({"id": "resume_downloads"})
    counts["views"] = int((views or {}).get("count", 0))
    counts["resume_downloads"] = int((downloads or {}).get("count", 0))
    profile = await db.profile.find_one({"id": "main"})
    counts["last_updated"] = (profile or {}).get("updated_at", "")
    return counts

# ------------------ Admin: Activity Logs ------------------
@api_router.get("/admin/activity")
async def get_activity(_=Depends(verify_token), page: int = 1, page_size: int = 30):
    total = await db.activity_logs.count_documents({})
    skip = (page - 1) * page_size
    items = await db.activity_logs.find().sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    return {"total": total, "page": page, "page_size": page_size, "items": [clean(i) for i in items]}

@api_router.delete("/admin/activity")
async def clear_activity(_=Depends(verify_token)):
    res = await db.activity_logs.delete_many({})
    return {"deleted": res.deleted_count}

# ------------------ Admin: Backup & Restore ------------------
BACKUP_COLLECTIONS = ["profile", "skills", "projects", "certificates", "education", "social_links", "resume", "theme", "seo", "sections", "counters", "testimonials", "experience"]

@api_router.get("/admin/backup")
async def export_backup(_=Depends(verify_token)):
    data = {}
    for c in BACKUP_COLLECTIONS:
        items = await db[c].find({}, {"_id": 0}).to_list(10000)
        data[c] = items
    data["_meta"] = {"exported_at": now_iso(), "version": "1.0"}
    await log_activity("Backup Exported", "backup", "")
    return data

class RestoreRequest(BaseModel):
    data: Dict[str, Any]
    replace: bool = True

@api_router.post("/admin/restore")
async def restore_backup(body: RestoreRequest, _=Depends(verify_token)):
    data = body.data or {}
    restored = {}
    for c in BACKUP_COLLECTIONS:
        if c not in data or not isinstance(data[c], list):
            continue
        if body.replace:
            await db[c].delete_many({})
        if data[c]:
            # Ensure ids present
            for item in data[c]:
                item.pop("_id", None)
                if "id" not in item:
                    item["id"] = str(uuid.uuid4())
            await db[c].insert_many(data[c])
        restored[c] = len(data[c])
    await log_activity("Backup Restored", "backup", str(restored))
    return {"ok": True, "restored": restored}

# ------------------ File Upload ------------------
@api_router.post("/admin/upload")
async def upload_file(file: UploadFile = File(...), _=Depends(verify_token)):
    content = await file.read()

    result = cloudinary.uploader.upload(
        content,
        folder="codexabhi-portfolio",
        resource_type="auto"
    )

    await db.media.insert_one({
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "stored_name": result["public_id"],
        "url": result["secure_url"],
        "size": len(content),
        "content_type": file.content_type or "",
        "created_at": now_iso(),
    })

    return {
        "url": result["secure_url"],
        "filename": file.filename
    }

@api_router.get("/uploads/{fname}")
async def get_upload(fname: str):
    from fastapi.responses import FileResponse
    fpath = UPLOAD_DIR / fname
    if not fpath.exists():
        raise HTTPException(404, "File not found")
    # Serve inline so PDFs open in the browser's built-in viewer.
    # The frontend forces a download via <a download> when the user clicks Download.
    return FileResponse(fpath, headers={"Content-Disposition": f'inline; filename="{fname}"'})

# ------------------ Media Library ------------------
@api_router.get("/admin/media")
async def list_media(_=Depends(verify_token), q: Optional[str] = None):
    query = {}
    if q:
        query = {"filename": {"$regex": q, "$options": "i"}}
    items = await db.media.find(query).sort("created_at", -1).to_list(1000)
    total_size = sum(int(i.get("size", 0)) for i in items)
    return {"items": [clean(i) for i in items], "total_size": total_size, "count": len(items)}

@api_router.delete("/admin/media/{mid}")
async def delete_media(mid: str, _=Depends(verify_token)):
    m = await db.media.find_one({"id": mid})
    if not m:
        raise HTTPException(404, "Not found")
    # Delete file
    fpath = UPLOAD_DIR / m.get("stored_name", "")
    if fpath.exists():
        try:
            fpath.unlink()
        except Exception:
            pass
    await db.media.delete_one({"id": mid})
    await log_activity("Media Deleted", "media", m.get("filename", ""))
    return {"ok": True}

@api_router.put("/admin/media/{mid}")
async def rename_media(mid: str, body: dict, _=Depends(verify_token)):
    new_name = body.get("filename", "").strip()
    if not new_name:
        raise HTTPException(400, "Filename required")
    await db.media.update_one({"id": mid}, {"$set": {"filename": new_name}})
    return {"ok": True}

# ------------------ SEO ------------------
DEFAULT_SEO = {
    "id": "site-seo",
    "site_title": "Abhinandan Kumar — Software Engineer",
    "meta_title": "Abhinandan Kumar — Software Engineer",
    "meta_description": "Passionate Software Engineer specializing in Python, SQL, DSA, and OOP. Portfolio of projects, certifications, and more.",
    "keywords": "Abhinandan Kumar, Software Engineer, Python Developer, Portfolio, DSA, SQL, Full Stack",
    "canonical_url": "",
    "og_title": "Abhinandan Kumar — Software Engineer",
    "og_description": "Premium Software Engineer portfolio.",
    "og_image": "",
    "twitter_card": "summary_large_image",
    "robots": "index, follow",
    "google_verification": "",
    "bing_verification": "",
    "favicon": "",
    "sitemap_paths": ["/"],
    "updated_at": "",
}

@api_router.get("/seo")
async def get_seo_public():
    s = await db.seo.find_one({"id": "site-seo"})
    return clean(s) or {}

@api_router.put("/admin/seo")
async def update_seo(body: dict, _=Depends(verify_token)):
    body["id"] = "site-seo"
    body["updated_at"] = now_iso()
    await db.seo.update_one({"id": "site-seo"}, {"$set": body}, upsert=True)
    s = await db.seo.find_one({"id": "site-seo"})
    await log_activity("SEO Updated", "seo", body.get("meta_title", ""))
    return clean(s)

@api_router.get("/robots.txt")
async def robots_txt():
    from fastapi.responses import PlainTextResponse
    s = await db.seo.find_one({"id": "site-seo"}) or {}
    robots = s.get("robots", "index, follow")
    txt = f"User-agent: *\n"
    if "noindex" in robots.lower():
        txt += "Disallow: /\n"
    else:
        txt += "Allow: /\n"
    return PlainTextResponse(txt)

@api_router.get("/sitemap.xml")
async def sitemap_xml():
    from fastapi.responses import Response
    s = await db.seo.find_one({"id": "site-seo"}) or {}
    base = (s.get("canonical_url") or "").rstrip("/")
    # Fallback to the deployed app URL when canonical_url is missing or a placeholder.
    if not base or "example.com" in base:
        base = (os.environ.get("PUBLIC_APP_URL") or "").rstrip("/")
    paths = s.get("sitemap_paths", ["/"])
    urls = "".join([f"<url><loc>{base}{p}</loc></url>" for p in paths])
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>'
    return Response(content=xml, media_type="application/xml")

# ------------------ Section Visibility ------------------
DEFAULT_SECTIONS = {
    "id": "site-sections",
    "hero": True, "about": True, "skills": True, "projects": True,
    "certificates": True, "education": True, "experience": True, "resume": True,
    "testimonials": True, "counters": True, "hire_me": True, "contact": True, "footer": True,
}

@api_router.get("/sections")
async def get_sections_public():
    s = await db.sections.find_one({"id": "site-sections"})
    return clean(s) or DEFAULT_SECTIONS

@api_router.put("/admin/sections")
async def update_sections(body: dict, _=Depends(verify_token)):
    body["id"] = "site-sections"
    await db.sections.update_one({"id": "site-sections"}, {"$set": body}, upsert=True)
    s = await db.sections.find_one({"id": "site-sections"})
    await log_activity("Sections Updated", "sections", "")
    return clean(s)

# ------------------ Testimonials ------------------
class Testimonial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    company: str = ""
    role: str = ""
    rating: int = 5
    review: str
    photo: str = ""
    linkedin: str = ""
    order: int = 0
    featured: bool = False
    status: str = "published"

class TestimonialCreate(BaseModel):
    name: str
    company: str = ""
    role: str = ""
    rating: int = 5
    review: str
    photo: str = ""
    linkedin: str = ""
    order: int = 0
    featured: bool = False
    status: str = "published"

@api_router.get("/testimonials")
async def get_testimonials(request: Request):
    q = {} if await is_admin_request(request) else {"status": {"$ne": "draft"}}
    items = await db.testimonials.find(q).sort("order", 1).to_list(1000)
    return [clean(i) for i in items]

@api_router.post("/admin/testimonials")
async def create_testimonial(body: TestimonialCreate, _=Depends(verify_token)):
    t = Testimonial(**body.model_dump())
    await db.testimonials.insert_one(t.model_dump())
    await log_activity("Testimonial Added", "testimonial", t.name)
    return t.model_dump()

@api_router.put("/admin/testimonials/{tid}")
async def update_testimonial(tid: str, body: dict, _=Depends(verify_token)):
    body.pop("id", None)
    await db.testimonials.update_one({"id": tid}, {"$set": body})
    t = await db.testimonials.find_one({"id": tid})
    if not t:
        raise HTTPException(404, "Not found")
    await log_activity("Testimonial Updated", "testimonial", t.get("name", ""))
    return clean(t)

@api_router.delete("/admin/testimonials/{tid}")
async def delete_testimonial(tid: str, _=Depends(verify_token)):
    t = await db.testimonials.find_one({"id": tid})
    res = await db.testimonials.delete_one({"id": tid})
    if res.deleted_count:
        await log_activity("Testimonial Deleted", "testimonial", (t or {}).get("name", tid))
    return {"deleted": res.deleted_count}

# ------------------ Experience ------------------
class Experience(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company: str
    role: str
    employment_type: str = "Full-time"
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    currently_working: bool = False
    description: str = ""
    technologies: List[str] = []
    company_logo: str = ""
    order: int = 0
    featured: bool = False
    status: str = "published"

class ExperienceCreate(BaseModel):
    company: str
    role: str
    employment_type: str = "Full-time"
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    currently_working: bool = False
    description: str = ""
    technologies: List[str] = []
    company_logo: str = ""
    order: int = 0
    featured: bool = False
    status: str = "published"

@api_router.get("/experience")
async def get_experience(request: Request):
    q = {} if await is_admin_request(request) else {"status": {"$ne": "draft"}}
    items = await db.experience.find(q).sort("order", 1).to_list(1000)
    return [clean(i) for i in items]

@api_router.post("/admin/experience")
async def create_experience(body: ExperienceCreate, _=Depends(verify_token)):
    e = Experience(**body.model_dump())
    await db.experience.insert_one(e.model_dump())
    await log_activity("Experience Added", "experience", f"{e.role} @ {e.company}")
    return e.model_dump()

@api_router.put("/admin/experience/{eid}")
async def update_experience(eid: str, body: dict, _=Depends(verify_token)):
    body.pop("id", None)
    await db.experience.update_one({"id": eid}, {"$set": body})
    e = await db.experience.find_one({"id": eid})
    if not e:
        raise HTTPException(404, "Not found")
    await log_activity("Experience Updated", "experience", e.get("company", ""))
    return clean(e)

@api_router.delete("/admin/experience/{eid}")
async def delete_experience(eid: str, _=Depends(verify_token)):
    e = await db.experience.find_one({"id": eid})
    res = await db.experience.delete_one({"id": eid})
    if res.deleted_count:
        await log_activity("Experience Deleted", "experience", (e or {}).get("company", eid))
    return {"deleted": res.deleted_count}

# ------------------ Counters ------------------
DEFAULT_COUNTERS = [
    {"id": "counter-projects", "label": "Projects Completed", "value": 15, "suffix": "+", "icon": "briefcase", "order": 1},
    {"id": "counter-certificates", "label": "Certificates", "value": 8, "suffix": "+", "icon": "award", "order": 2},
    {"id": "counter-github", "label": "GitHub Repositories", "value": 30, "suffix": "+", "icon": "github", "order": 3},
    {"id": "counter-problems", "label": "Coding Problems Solved", "value": 500, "suffix": "+", "icon": "code", "order": 4},
    {"id": "counter-tech", "label": "Technologies", "value": 20, "suffix": "+", "icon": "layers", "order": 5},
    {"id": "counter-years", "label": "Years of Experience", "value": 3, "suffix": "+", "icon": "clock", "order": 6},
]

@api_router.get("/counters")
async def get_counters_public():
    items = await db.counters.find().sort("order", 1).to_list(1000)
    return [clean(i) for i in items]

@api_router.post("/admin/counters")
async def create_counter(body: dict, _=Depends(verify_token)):
    body["id"] = body.get("id") or str(uuid.uuid4())
    await db.counters.insert_one(body)
    await log_activity("Counter Added", "counter", body.get("label", ""))
    return clean(body)

@api_router.put("/admin/counters/{cid}")
async def update_counter(cid: str, body: dict, _=Depends(verify_token)):
    body.pop("id", None)
    await db.counters.update_one({"id": cid}, {"$set": body})
    c = await db.counters.find_one({"id": cid})
    if not c:
        raise HTTPException(404, "Not found")
    return clean(c)

@api_router.delete("/admin/counters/{cid}")
async def delete_counter(cid: str, _=Depends(verify_token)):
    c = await db.counters.find_one({"id": cid})
    res = await db.counters.delete_one({"id": cid})
    if res.deleted_count:
        await log_activity("Counter Deleted", "counter", (c or {}).get("label", cid))
    return {"deleted": res.deleted_count}

# ------------------ Analytics ------------------
def parse_ua(ua: str):
    ua = (ua or "").lower()
    device = "desktop"
    if any(k in ua for k in ["mobi", "android", "iphone"]):
        device = "mobile"
    elif "ipad" in ua or "tablet" in ua:
        device = "tablet"
    browser = "other"
    if "edg/" in ua: browser = "Edge"
    elif "chrome/" in ua and "chromium" not in ua: browser = "Chrome"
    elif "safari/" in ua and "chrome" not in ua: browser = "Safari"
    elif "firefox/" in ua: browser = "Firefox"
    elif "opr/" in ua or "opera" in ua: browser = "Opera"
    return device, browser

class TrackRequest(BaseModel):
    path: str = "/"
    session_id: str = ""
    referrer: str = ""
    project_id: Optional[str] = None
    event: str = "view"  # view | project_view | resume_download | contact_submit

@api_router.post("/analytics/track")
async def track(body: TrackRequest, request: Request):
    ua = request.headers.get("user-agent", "")
    device, browser = parse_ua(ua)
    ip = request.client.host if request.client else ""
    doc = {
        "id": str(uuid.uuid4()),
        "path": body.path,
        "event": body.event,
        "project_id": body.project_id,
        "session_id": body.session_id,
        "referrer": body.referrer,
        "device": device,
        "browser": browser,
        "ip": ip,
        "created_at": now_iso(),
    }
    await db.analytics.insert_one(doc)
    return {"ok": True}

@api_router.get("/analytics/live")
async def analytics_live():
    """Public lightweight endpoint for live visitor stats on portfolio."""
    now = datetime.now(timezone.utc)
    five_min_ago = (now - timedelta(minutes=5)).isoformat()
    online_sessions = await db.analytics.distinct("session_id", {"created_at": {"$gte": five_min_ago}, "event": "view"})
    online_now = len([s for s in online_sessions if s])
    views_doc = await db.stats.find_one({"id": "views"})
    total_views = int((views_doc or {}).get("count", 0))
    profile = await db.profile.find_one({"id": "main"})
    last_updated = (profile or {}).get("updated_at", "")
    return {"views": total_views, "online_now": online_now, "last_updated": last_updated}

# ------------------ Widgets (GitHub Activity + LiveInfo settings) ------------------
DEFAULT_WIDGETS = {
    "id": "site-widgets",
    "github": {
        "enabled": True,
        "show_calendar": True,
        "show_stats": True,
        "show_streak": True,
        "show_langs": True,
        "auto_refresh": False,
        "last_sync": "",
    },
    "live_info": {
        "enabled": True,
        "position": "right",   # right | left
        "show_online": True,
        "show_visitors": True,
        "show_views": True,
        "show_updated": True,
        "refresh_interval": 15,
        "pulse_animation": True,
        "show_on_mobile": False,
        "dismissible": True,
    },
}

@api_router.get("/widgets")
async def get_widgets_public():
    w = await db.widgets.find_one({"id": "site-widgets"})
    return clean(w) or DEFAULT_WIDGETS

@api_router.put("/admin/widgets")
async def update_widgets(body: dict, _=Depends(verify_token)):
    body["id"] = "site-widgets"
    await db.widgets.update_one({"id": "site-widgets"}, {"$set": body}, upsert=True)
    w = await db.widgets.find_one({"id": "site-widgets"})
    await log_activity("Widgets Updated", "widgets", "")
    return clean(w)

@api_router.post("/admin/github/sync")
async def github_sync(_=Depends(verify_token)):
    """Records the timestamp of the last manual GitHub refresh."""
    ts = now_iso()
    await db.widgets.update_one(
        {"id": "site-widgets"},
        {"$set": {"github.last_sync": ts, "id": "site-widgets"}},
        upsert=True,
    )
    await log_activity("GitHub Synced", "github", ts)
    return {"ok": True, "last_sync": ts}

@api_router.get("/admin/analytics")
async def get_analytics(_=Depends(verify_token)):
    from collections import Counter as Ctr
    all_events = await db.analytics.find({}, {"_id": 0}).to_list(50000)
    now = datetime.now(timezone.utc)
    def parse(dt):
        try:
            return datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except Exception:
            return now
    views = [e for e in all_events if e.get("event") == "view"]
    downloads = [e for e in all_events if e.get("event") == "resume_download"]
    submits = [e for e in all_events if e.get("event") == "contact_submit"]
    project_views = [e for e in all_events if e.get("event") == "project_view"]

    def within(events, days):
        cutoff = now - timedelta(days=days)
        return [e for e in events if parse(e["created_at"]) >= cutoff]
    def today(events):
        cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return [e for e in events if parse(e["created_at"]) >= cutoff]

    # Time series (last 30 days daily views)
    daily = {}
    for i in range(29, -1, -1):
        d = (now - timedelta(days=i)).date().isoformat()
        daily[d] = 0
    for e in within(views, 30):
        d = parse(e["created_at"]).date().isoformat()
        if d in daily:
            daily[d] += 1
    time_series = [{"date": d, "views": daily[d]} for d in daily]

    # Aggregations
    devices = Ctr(e.get("device", "desktop") for e in views)
    browsers = Ctr(e.get("browser", "other") for e in views)
    referrers = Ctr((e.get("referrer") or "direct").split("/")[2] if e.get("referrer","").startswith("http") else "direct" for e in views)

    # Unique/returning
    sessions = [e.get("session_id") for e in views if e.get("session_id")]
    session_counts = Ctr(sessions)
    unique = len(session_counts)
    returning = sum(1 for c in session_counts.values() if c > 1)

    # Most viewed project
    proj_ctr = Ctr(e.get("project_id") for e in project_views if e.get("project_id"))
    most_viewed_id, most_viewed_count = (proj_ctr.most_common(1) or [(None, 0)])[0]
    most_viewed_title = ""
    if most_viewed_id:
        p = await db.projects.find_one({"id": most_viewed_id})
        most_viewed_title = (p or {}).get("title", "")

    return {
        "total_views": len(views),
        "today_views": len(today(views)),
        "weekly_views": len(within(views, 7)),
        "monthly_views": len(within(views, 30)),
        "resume_downloads": len(downloads),
        "contact_submissions": len(submits),
        "unique_visitors": unique,
        "returning_visitors": returning,
        "time_series": time_series,
        "devices": [{"name": k, "value": v} for k, v in devices.most_common()],
        "browsers": [{"name": k, "value": v} for k, v in browsers.most_common()],
        "traffic_sources": [{"name": k, "value": v} for k, v in referrers.most_common(6)],
        "most_viewed_project": {"id": most_viewed_id, "title": most_viewed_title, "count": most_viewed_count},
    }

# ------------------ Notifications ------------------
async def add_notification(kind: str, title: str, body: str = ""):
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "kind": kind,
        "title": title,
        "body": body,
        "read": False,
        "created_at": now_iso(),
    })

@api_router.get("/admin/notifications")
async def get_notifications(_=Depends(verify_token), page: int = 1, page_size: int = 30):
    total = await db.notifications.count_documents({})
    unread = await db.notifications.count_documents({"read": False})
    skip = (page - 1) * page_size
    items = await db.notifications.find().sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    return {"total": total, "unread": unread, "items": [clean(i) for i in items]}

@api_router.put("/admin/notifications/{nid}/read")
async def mark_notif_read(nid: str, _=Depends(verify_token)):
    await db.notifications.update_one({"id": nid}, {"$set": {"read": True}})
    return {"ok": True}

@api_router.put("/admin/notifications/read-all")
async def mark_all_read(_=Depends(verify_token)):
    await db.notifications.update_many({"read": False}, {"$set": {"read": True}})
    return {"ok": True}

@api_router.delete("/admin/notifications/{nid}")
async def delete_notification(nid: str, _=Depends(verify_token)):
    res = await db.notifications.delete_one({"id": nid})
    return {"deleted": res.deleted_count}

@api_router.delete("/admin/notifications")
async def clear_notifications(_=Depends(verify_token)):
    res = await db.notifications.delete_many({})
    return {"deleted": res.deleted_count}

# ------------------ Global Search ------------------
@api_router.get("/admin/search")
async def global_search(_=Depends(verify_token), q: str = ""):
    if not q or len(q) < 1:
        return {"results": []}
    rx = {"$regex": q, "$options": "i"}
    results = []
    for coll, fields, kind, label_field in [
        ("projects", ["title", "description"], "project", "title"),
        ("skills", ["name", "category"], "skill", "name"),
        ("certificates", ["name", "organization"], "certificate", "name"),
        ("education", ["degree", "college", "university"], "education", "degree"),
        ("experience", ["company", "role"], "experience", "company"),
        ("testimonials", ["name", "review", "company"], "testimonial", "name"),
        ("social_links", ["platform", "url"], "social", "platform"),
        ("contact_messages", ["name", "email", "subject", "message"], "message", "name"),
    ]:
        query = {"$or": [{f: rx} for f in fields]}
        items = await db[coll].find(query).limit(5).to_list(5)
        for it in items:
            results.append({
                "type": kind,
                "id": it.get("id"),
                "label": it.get(label_field, ""),
                "sub": it.get("description") or it.get("category") or it.get("email") or "",
            })
    return {"results": results}

# ------------------ Bulk Actions ------------------
_BULK_MAP = {"projects": "projects", "certificates": "certificates", "skills": "skills",
             "education": "education", "testimonials": "testimonials", "experience": "experience",
             "messages": "contact_messages", "social_links": "social_links"}

class BulkIds(BaseModel):
    ids: List[str]

@api_router.post("/admin/{entity}/bulk-delete")
async def bulk_delete(entity: str, body: BulkIds, _=Depends(verify_token)):
    coll = _BULK_MAP.get(entity)
    if not coll:
        raise HTTPException(400, "Unknown entity")
    res = await db[coll].delete_many({"id": {"$in": body.ids}})
    await log_activity(f"Bulk Deleted {entity}", entity, f"{res.deleted_count} items")
    return {"deleted": res.deleted_count}

# ------------------ Login attempt limiter ------------------
LOGIN_ATTEMPTS = {}  # in-memory { email: [timestamps] }
MAX_ATTEMPTS = 5
WINDOW_SECONDS = 300  # 5 min

def check_and_record_attempt(email: str, success: bool):
    now = datetime.now(timezone.utc).timestamp()
    arr = LOGIN_ATTEMPTS.get(email, [])
    arr = [t for t in arr if now - t < WINDOW_SECONDS]
    if success:
        LOGIN_ATTEMPTS[email] = []
        return True, 0
    arr.append(now)
    LOGIN_ATTEMPTS[email] = arr
    return len(arr) < MAX_ATTEMPTS, MAX_ATTEMPTS - len(arr)

# ------------------ File Upload ------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await seed_admin()
    # await seed_defaults()
    logger.info("Startup complete")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
