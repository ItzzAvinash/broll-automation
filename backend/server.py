from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone

from llm_service import analyze_script, regenerate_scene


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Configure logging early so handlers can use `logger` safely
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------- Existing demo models (kept for compatibility) ----------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


# ---------- B-roll project plan models ----------
class BrandSnapshot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    brandName: str = "Untitled Studio"
    primary: str = "#0A0A0B"
    secondary: str = "#FAFAFA"
    highlight: str = "#E4B8A0"
    mainFont: str = "times"
    logoText: str = "NW"


class AnalyzeScriptRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    script: str
    brand: BrandSnapshot = Field(default_factory=BrandSnapshot)
    ratio: str = "16:9"


class HighlightedKeyword(BaseModel):
    model_config = ConfigDict(extra="ignore")
    text: str = ""
    reason: str = ""
    visualTreatment: str = ""
    useHighlightColor: bool = True
    assetSuggestion: str = ""
    suggestedSearchQuery: str = ""


class BrollSuggestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    assetType: str = "video"
    description: str = ""
    suggestedSearchQuery: str = ""
    placement: str = "background"
    priority: str = "medium"


class Scene(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order: int = 1
    scriptText: str = ""
    headline: str = ""
    textOverlay: str = ""
    duration: float = 4.0
    motionStyle: str = "Static"
    highlightedKeywords: List[HighlightedKeyword] = Field(default_factory=list)
    brollSuggestions: List[BrollSuggestion] = Field(default_factory=list)


class ProjectPlan(BaseModel):
    """The strict JSON shape the AI must return + we persist."""
    model_config = ConfigDict(extra="ignore")
    projectTitle: str = "Untitled Project"
    originalScript: str = ""
    scenes: List[Scene] = Field(default_factory=list)


class ProjectRecord(BaseModel):
    """Persisted project envelope."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    createdAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    ratio: str = "16:9"
    brand: BrandSnapshot = Field(default_factory=BrandSnapshot)
    plan: ProjectPlan = Field(default_factory=ProjectPlan)


# ---------- Demo routes (kept) ----------
@api_router.get("/")
async def root():
    return {"message": "Roll Studio backend up"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check.get("timestamp"), str):
            check["timestamp"] = datetime.fromisoformat(check["timestamp"])
    return status_checks


# ---------- Phase 3: AI script analysis + project persistence ----------
@api_router.post("/projects/analyze")
async def projects_analyze(payload: AnalyzeScriptRequest):
    """Analyze a script with Gemini 3 Flash and persist the resulting plan."""
    if not payload.script or not payload.script.strip():
        raise HTTPException(status_code=400, detail="script must not be empty")

    try:
        raw_plan: Dict[str, Any] = await analyze_script(
            script=payload.script,
            brand=payload.brand.model_dump(),
            ratio=payload.ratio,
        )
    except ValueError as e:
        logger.warning("Bad LLM response: %s", e)
        raise HTTPException(status_code=502, detail=f"LLM returned invalid plan: {e}")
    except RuntimeError as e:
        logger.error("LLM config error: %s", e)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected LLM error")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

    plan = ProjectPlan(**raw_plan)
    record = ProjectRecord(ratio=payload.ratio, brand=payload.brand, plan=plan)

    await db.projects.insert_one(record.model_dump())
    logger.info("Persisted project %s (title=%r)", record.id, plan.projectTitle)

    return JSONResponse(content=record.model_dump())


@api_router.get("/projects")
async def list_projects():
    cursor = (
        db.projects.find({}, {"_id": 0})
        .sort("createdAt", -1)
        .limit(50)
    )
    docs = await cursor.to_list(length=50)
    return docs


@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="project not found")
    return doc


# ---------- Phase 4: editable plan + regeneration ----------
class UpdatePlanRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    plan: ProjectPlan


@api_router.put("/projects/{project_id}")
async def update_project_plan(project_id: str, payload: UpdatePlanRequest):
    """Persist edits the user made to the plan (auto-save on the frontend)."""
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="project not found")

    plan_doc = payload.plan.model_dump()
    # Renumber scenes 1..N defensively (user may have reordered)
    for idx, sc in enumerate(plan_doc.get("scenes", []), start=1):
        sc["order"] = idx

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"plan": plan_doc}},
    )
    existing["plan"] = plan_doc
    return existing


@api_router.post("/projects/{project_id}/regenerate")
async def regenerate_full_plan(project_id: str):
    """Regenerate the entire plan using the stored script + brand + ratio."""
    record = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="project not found")

    script = record.get("plan", {}).get("originalScript", "")
    if not script:
        raise HTTPException(status_code=400, detail="project has no original script")

    try:
        raw_plan = await analyze_script(
            script=script,
            brand=record.get("brand", {}),
            ratio=record.get("ratio", "16:9"),
        )
    except Exception as e:
        logger.exception("Full regenerate failed")
        raise HTTPException(status_code=500, detail=f"Regenerate failed: {e}")

    plan = ProjectPlan(**raw_plan)
    await db.projects.update_one(
        {"id": project_id}, {"$set": {"plan": plan.model_dump()}}
    )
    record["plan"] = plan.model_dump()
    return record


class RegenerateSceneRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    # Optional override script text for the scene (when the user has edited
    # scene.scriptText locally and wants the regenerate to operate on the new text)
    sceneScriptText: Optional[str] = None


@api_router.post("/projects/{project_id}/scenes/{order}/regenerate")
async def regenerate_single_scene(
    project_id: str,
    order: int,
    payload: RegenerateSceneRequest = RegenerateSceneRequest(),
):
    """Regenerate ONLY one scene's headline / textOverlay / motionStyle /
    highlightedKeywords / brollSuggestions. Keeps scriptText (unless override)."""
    record = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="project not found")

    plan = record.get("plan") or {}
    scenes = plan.get("scenes", [])
    idx = order - 1
    if idx < 0 or idx >= len(scenes):
        raise HTTPException(status_code=404, detail="scene not found")

    target_scene = scenes[idx]
    if payload.sceneScriptText:
        target_scene = {**target_scene, "scriptText": payload.sceneScriptText}

    try:
        new_scene = await regenerate_scene(
            scene=target_scene,
            surrounding=scenes,
            brand=record.get("brand", {}),
            ratio=record.get("ratio", "16:9"),
        )
    except Exception as e:
        logger.exception("Regenerate scene failed")
        raise HTTPException(status_code=500, detail=f"Regenerate failed: {e}")

    # Preserve order + scriptText (unless user overrode it)
    new_scene["order"] = order
    new_scene["scriptText"] = target_scene.get("scriptText", new_scene.get("scriptText", ""))

    scenes[idx] = new_scene
    plan["scenes"] = scenes

    await db.projects.update_one(
        {"id": project_id}, {"$set": {"plan": plan}}
    )
    record["plan"] = plan
    return record


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
