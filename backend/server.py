from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
from pathlib import Path

# Backend mínimo (o app principal agora usa Firebase direto no frontend)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

app = FastAPI(title="InsectControl Tupy API (minimal)")
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@api_router.get("/")
async def root():
    return {"message": "Backend mínimo: o sistema usa Firebase (Auth + Firestore) no frontend"}


@api_router.get("/health")
async def health():
    return {"ok": True}


app.include_router(api_router)
