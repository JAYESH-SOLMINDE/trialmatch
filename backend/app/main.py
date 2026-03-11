import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import trials, matching, chat

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Clinical Trial Eligibility & Matching Engine",
    version="1.0.0"
)

# Allow localhost in dev + any Vercel deployment in production
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    settings.FRONTEND_URL,
]

# If a wildcard is set in env, allow all origins (for deployment)
if os.environ.get("ALLOW_ALL_ORIGINS") == "true":
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trials.router,   prefix="/api/v1/trials",   tags=["Trials"])
app.include_router(matching.router, prefix="/api/v1/matching", tags=["Matching"])
app.include_router(chat.router,     prefix="/api/v1",          tags=["Chat"])

@app.get("/")
def root():
    return {"status": "running", "app": settings.APP_NAME}