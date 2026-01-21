from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal, Any
import uuid
from datetime import datetime, timezone, timedelta, date

import jwt
from passlib.context import CryptContext


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# App
app = FastAPI(title="InsectControl Tupy - Gestão")
api_router = APIRouter(prefix="/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Security
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.environ.get("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
http_bearer = HTTPBearer(auto_error=False)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(*, user_id: str, username: str) -> str:
    expires_at = _now_utc() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "username": username,
        "exp": int(expires_at.timestamp()),
        "iat": int(_now_utc().timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Não autenticado")

    token = creds.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="Sessão expirada") from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Token inválido") from e

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user


# ---------- Models ----------
class ApiMessage(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    username: str
    created_at: datetime


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    username: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=6, max_length=200)


class UserLogin(BaseModel):
    username: str
    password: str


class BootstrapStatus(BaseModel):
    has_user: bool


class ClientBase(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    email: Optional[str] = None


class ClientCreate(ClientBase):
    name: str = Field(min_length=2, max_length=120)


class ClientUpdate(ClientBase):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)


class ClientOut(ClientBase):
    model_config = ConfigDict(extra="ignore")

    id: str
    created_at: datetime
    updated_at: datetime


ServiceStatus = Literal["PENDENTE", "CONCLUIDO"]


class ServiceBase(BaseModel):
    client_id: str
    date: date
    service_type: str
    value: float = 0
    status: ServiceStatus = "PENDENTE"


class ServiceCreate(ServiceBase):
    service_type: str = Field(min_length=2, max_length=160)


class ServiceUpdate(BaseModel):
    client_id: Optional[str] = None
    date: Optional[date] = None
    service_type: Optional[str] = Field(default=None, min_length=2, max_length=160)
    value: Optional[float] = None
    status: Optional[ServiceStatus] = None


class ServiceOut(ServiceBase):
    model_config = ConfigDict(extra="ignore")

    id: str
    created_at: datetime
    updated_at: datetime


class DashboardSummary(BaseModel):
    month: str
    clients_total: int
    services_month: int
    pending_month: int
    revenue_month: float


# ---------- Helpers ----------

def _dt_to_iso(dt: datetime) -> str:
    # Always store in ISO for Mongo
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def _iso_to_dt(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value)
    return _now_utc()


# ---------- Startup ----------
@app.on_event("startup")
async def startup_indexes():
    try:
        await db.users.create_index("username", unique=True)
    except Exception:
        pass
    try:
        await db.clients.create_index([("name", 1)])
        await db.clients.create_index([("phone", 1)])
    except Exception:
        pass
    try:
        await db.services.create_index([("date", 1)])
        await db.services.create_index([("status", 1)])
        await db.services.create_index([("client_id", 1)])
    except Exception:
        pass


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ---------- Routes ----------
@api_router.get("/", response_model=ApiMessage)
async def root():
    return {"message": "InsectControl Tupy API"}


# Auth
@api_router.get("/auth/bootstrap/status", response_model=BootstrapStatus)
async def auth_bootstrap_status():
    count = await db.users.count_documents({})
    return {"has_user": count > 0}


@api_router.post("/auth/register", response_model=UserPublic)
async def register_user(payload: UserCreate):
    username = payload.username.strip().lower()
    exists = await db.users.find_one({"username": username}, {"_id": 1})
    if exists:
        raise HTTPException(status_code=400, detail="Esse usuário já existe")

    doc = {
        "id": _uuid(),
        "name": payload.name.strip(),
        "username": username,
        "password_hash": hash_password(payload.password),
        "created_at": _dt_to_iso(_now_utc()),
    }

    try:
        await db.users.insert_one(doc)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Não foi possível criar usuário") from e

    user = await db.users.find_one({"id": doc["id"]}, {"_id": 0, "password_hash": 0})
    user["created_at"] = _iso_to_dt(user["created_at"])
    return user


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    username = payload.username.strip().lower()
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    token = create_access_token(user_id=user["id"], username=user["username"])
    return {"access_token": token, "token_type": "bearer"}


@api_router.get("/auth/me", response_model=UserPublic)
async def me(current_user: dict = Depends(get_current_user)):
    u = {k: v for k, v in current_user.items() if k != "password_hash"}
    u["created_at"] = _iso_to_dt(u["created_at"])
    return u


# Clients
@api_router.get("/clients", response_model=List[ClientOut])
async def list_clients(
    q: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    query: dict = {}
    if q and q.strip():
        s = q.strip()
        query = {
            "$or": [
                {"name": {"$regex": s, "$options": "i"}},
                {"phone": {"$regex": s, "$options": "i"}},
            ]
        }

    items = await db.clients.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for it in items:
        it["created_at"] = _iso_to_dt(it.get("created_at"))
        it["updated_at"] = _iso_to_dt(it.get("updated_at"))
    return items


@api_router.post("/clients", response_model=ClientOut)
async def create_client(
    payload: ClientCreate,
    current_user: dict = Depends(get_current_user),
):
    now = _now_utc()
    doc = {
        "id": _uuid(),
        "name": payload.name.strip(),
        "phone": payload.phone,
        "address": payload.address,
        "city": payload.city,
        "neighborhood": payload.neighborhood,
        "email": payload.email,
        "created_at": _dt_to_iso(now),
        "updated_at": _dt_to_iso(now),
    }
    await db.clients.insert_one(doc)
    doc["created_at"] = now
    doc["updated_at"] = now
    return doc


@api_router.get("/clients/{client_id}", response_model=ClientOut)
async def get_client(client_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    doc["created_at"] = _iso_to_dt(doc.get("created_at"))
    doc["updated_at"] = _iso_to_dt(doc.get("updated_at"))
    return doc


@api_router.put("/clients/{client_id}", response_model=ClientOut)
async def update_client(
    client_id: str,
    payload: ClientUpdate,
    current_user: dict = Depends(get_current_user),
):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "name" in update and update["name"]:
        update["name"] = update["name"].strip()
    update["updated_at"] = _dt_to_iso(_now_utc())

    res = await db.clients.update_one({"id": client_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    doc = await db.clients.find_one({"id": client_id}, {"_id": 0})
    doc["created_at"] = _iso_to_dt(doc.get("created_at"))
    doc["updated_at"] = _iso_to_dt(doc.get("updated_at"))
    return doc


@api_router.delete("/clients/{client_id}", response_model=ApiMessage)
async def delete_client(client_id: str, current_user: dict = Depends(get_current_user)):
    # MVP: não permite excluir cliente se houver serviços vinculados
    has_services = await db.services.count_documents({"client_id": client_id})
    if has_services > 0:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir: cliente possui serviços cadastrados",
        )

    res = await db.clients.delete_one({"id": client_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente excluído"}


# Services
@api_router.get("/services", response_model=List[ServiceOut])
async def list_services(
    status: Optional[ServiceStatus] = Query(default=None),
    from_date: Optional[str] = Query(default=None, alias="from"),
    to_date: Optional[str] = Query(default=None, alias="to"),
    client_id: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    query: dict = {}
    if status:
        query["status"] = status
    if client_id:
        query["client_id"] = client_id

    if from_date or to_date:
        date_q: dict = {}
        if from_date:
            date_q["$gte"] = from_date
        if to_date:
            date_q["$lte"] = to_date
        query["date"] = date_q

    items = await db.services.find(query, {"_id": 0}).sort("date", -1).to_list(2000)

    # Convert timestamps
    for it in items:
        it["created_at"] = _iso_to_dt(it.get("created_at"))
        it["updated_at"] = _iso_to_dt(it.get("updated_at"))
        # date is stored as YYYY-MM-DD
        if isinstance(it.get("date"), str):
            it["date"] = date.fromisoformat(it["date"])
    return items


@api_router.post("/services", response_model=ServiceOut)
async def create_service(
    payload: ServiceCreate,
    current_user: dict = Depends(get_current_user),
):
    # Validate client exists
    client_doc = await db.clients.find_one({"id": payload.client_id}, {"_id": 0})
    if not client_doc:
        raise HTTPException(status_code=400, detail="Cliente inválido")

    now = _now_utc()
    doc = {
        "id": _uuid(),
        "client_id": payload.client_id,
        "date": payload.date.isoformat(),
        "service_type": payload.service_type.strip(),
        "value": float(payload.value or 0),
        "status": payload.status,
        "created_at": _dt_to_iso(now),
        "updated_at": _dt_to_iso(now),
    }
    await db.services.insert_one(doc)
    doc["date"] = payload.date
    doc["created_at"] = now
    doc["updated_at"] = now
    return doc


@api_router.get("/services/{service_id}", response_model=ServiceOut)
async def get_service(service_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    doc["created_at"] = _iso_to_dt(doc.get("created_at"))
    doc["updated_at"] = _iso_to_dt(doc.get("updated_at"))
    if isinstance(doc.get("date"), str):
        doc["date"] = date.fromisoformat(doc["date"])
    return doc


@api_router.put("/services/{service_id}", response_model=ServiceOut)
async def update_service(
    service_id: str,
    payload: ServiceUpdate,
    current_user: dict = Depends(get_current_user),
):
    update: dict = {k: v for k, v in payload.model_dump().items() if v is not None}

    if "client_id" in update:
        client_doc = await db.clients.find_one({"id": update["client_id"]}, {"_id": 0})
        if not client_doc:
            raise HTTPException(status_code=400, detail="Cliente inválido")

    if "service_type" in update and update["service_type"]:
        update["service_type"] = update["service_type"].strip()

    if "date" in update and isinstance(update["date"], date):
        update["date"] = update["date"].isoformat()

    update["updated_at"] = _dt_to_iso(_now_utc())

    res = await db.services.update_one({"id": service_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    doc = await db.services.find_one({"id": service_id}, {"_id": 0})
    doc["created_at"] = _iso_to_dt(doc.get("created_at"))
    doc["updated_at"] = _iso_to_dt(doc.get("updated_at"))
    if isinstance(doc.get("date"), str):
        doc["date"] = date.fromisoformat(doc["date"])
    return doc


@api_router.delete("/services/{service_id}", response_model=ApiMessage)
async def delete_service(service_id: str, current_user: dict = Depends(get_current_user)):
    res = await db.services.delete_one({"id": service_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    return {"message": "Serviço excluído"}


# Dashboard
@api_router.get("/dashboard/summary", response_model=DashboardSummary)
async def dashboard_summary(current_user: dict = Depends(get_current_user)):
    now = _now_utc().date()
    month_start = date(now.year, now.month, 1)
    if now.month == 12:
        next_month = date(now.year + 1, 1, 1)
    else:
        next_month = date(now.year, now.month + 1, 1)
    month_end = next_month - timedelta(days=1)

    clients_total = await db.clients.count_documents({})
    services_month = await db.services.count_documents(
        {"date": {"$gte": month_start.isoformat(), "$lte": month_end.isoformat()}}
    )
    pending_month = await db.services.count_documents(
        {
            "date": {"$gte": month_start.isoformat(), "$lte": month_end.isoformat()},
            "status": "PENDENTE",
        }
    )

    revenue_cursor = db.services.find(
        {
            "date": {"$gte": month_start.isoformat(), "$lte": month_end.isoformat()},
            "status": "CONCLUIDO",
        },
        {"_id": 0, "value": 1},
    )
    revenue_docs = await revenue_cursor.to_list(5000)
    revenue_month = float(sum([float(d.get("value") or 0) for d in revenue_docs]))

    return {
        "month": month_start.strftime("%Y-%m"),
        "clients_total": int(clients_total),
        "services_month": int(services_month),
        "pending_month": int(pending_month),
        "revenue_month": revenue_month,
    }


app.include_router(api_router)
