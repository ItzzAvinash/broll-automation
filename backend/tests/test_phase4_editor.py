"""Phase 4 backend tests — PUT /api/projects/{id}, POST regenerate (full/scene)."""
import copy
import os
import time
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://ai-broll-gen.preview.emergentagent.com"
).rstrip("/")
API = f"{BASE_URL}/api"

SAMPLE_SCRIPT = (
    "Every day, thousands of small businesses struggle with outdated marketing tools. "
    "They lose customers, waste money, and burn out their teams. "
    "Our new platform changes everything — it automates outreach, tracks conversions in real time, "
    "and gives founders their evenings back. "
    "In 90 days, our pilot customers grew revenue by 47%. "
    "Stop guessing. Start scaling. Try the platform free for 14 days."
)

_PROJECT_CACHE = {}


# ---- helpers ----
def _create_project():
    if "record" in _PROJECT_CACHE:
        return _PROJECT_CACHE["record"]
    r = requests.post(
        f"{API}/projects/analyze",
        json={
            "script": SAMPLE_SCRIPT,
            "brand": {"brandName": "TEST_Phase4"},
            "ratio": "16:9",
        },
        timeout=120,
    )
    assert r.status_code == 200, r.text
    _PROJECT_CACHE["record"] = r.json()
    return _PROJECT_CACHE["record"]


# ---------- PUT /api/projects/{id} ----------
def test_put_plan_updates_and_persists():
    rec = _create_project()
    pid = rec["id"]
    plan = copy.deepcopy(rec["plan"])
    plan["projectTitle"] = "TEST_Edited Title"
    if plan["scenes"]:
        plan["scenes"][0]["headline"] = "TEST_New Headline"
        plan["scenes"][0]["textOverlay"] = "TEST_overlay"
        plan["scenes"][0]["duration"] = 5.5
        plan["scenes"][0]["motionStyle"] = "Dolly"

    r = requests.put(f"{API}/projects/{pid}", json={"plan": plan}, timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["id"] == pid
    assert body["plan"]["projectTitle"] == "TEST_Edited Title"
    assert body["plan"]["scenes"][0]["headline"] == "TEST_New Headline"
    assert body["plan"]["scenes"][0]["duration"] == 5.5
    assert body["plan"]["scenes"][0]["motionStyle"] == "Dolly"

    # Verify persistence with GET
    g = requests.get(f"{API}/projects/{pid}", timeout=15)
    assert g.status_code == 200
    fetched = g.json()
    assert fetched["plan"]["projectTitle"] == "TEST_Edited Title"
    assert fetched["plan"]["scenes"][0]["headline"] == "TEST_New Headline"
    assert "_id" not in fetched


def test_put_plan_renumbers_scenes_defensively():
    rec = _create_project()
    pid = rec["id"]
    plan = copy.deepcopy(rec["plan"])
    # Mess up order values arbitrarily
    for i, sc in enumerate(plan["scenes"]):
        sc["order"] = 99 - i  # descending, non-1-based
    # Also reverse the list
    plan["scenes"] = list(reversed(plan["scenes"]))

    r = requests.put(f"{API}/projects/{pid}", json={"plan": plan}, timeout=30)
    assert r.status_code == 200, r.text
    scenes = r.json()["plan"]["scenes"]
    # Renumbered 1..N
    for idx, sc in enumerate(scenes, start=1):
        assert sc["order"] == idx, f"scene #{idx} has order {sc['order']}"


def test_put_unknown_id_returns_404():
    r = requests.put(
        f"{API}/projects/does-not-exist",
        json={"plan": {"projectTitle": "x", "originalScript": "y", "scenes": []}},
        timeout=15,
    )
    assert r.status_code == 404, r.text


# ---------- POST /api/projects/{id}/scenes/{order}/regenerate ----------
def test_regenerate_single_scene_preserves_scriptText():
    rec = _create_project()
    pid = rec["id"]
    # Fetch fresh state (previous test may have edited)
    g = requests.get(f"{API}/projects/{pid}", timeout=15).json()
    scenes_before = g["plan"]["scenes"]
    order = 2 if len(scenes_before) >= 2 else 1
    before = scenes_before[order - 1]
    before_script = before["scriptText"]
    before_headline = before["headline"]
    # Snapshot other scenes' scriptText to ensure untouched
    others_before = [
        (i, s["scriptText"]) for i, s in enumerate(scenes_before) if i != order - 1
    ]

    r = requests.post(
        f"{API}/projects/{pid}/scenes/{order}/regenerate", timeout=120
    )
    assert r.status_code == 200, r.text
    body = r.json()
    new_scenes = body["plan"]["scenes"]
    new_scene = new_scenes[order - 1]

    # scriptText preserved
    assert new_scene["scriptText"] == before_script
    # headline changed (most likely — LLM regen)
    # We assert at least one of headline/motionStyle/keywords/broll changed
    changed = (
        new_scene["headline"] != before_headline
        or new_scene["motionStyle"] != before["motionStyle"]
        or new_scene["highlightedKeywords"] != before["highlightedKeywords"]
        or new_scene["brollSuggestions"] != before["brollSuggestions"]
    )
    assert changed, "regenerate produced identical scene — expected some field to change"

    # Other scenes untouched (scriptText preserved)
    for i, original_text in others_before:
        assert new_scenes[i]["scriptText"] == original_text

    # Persisted
    g2 = requests.get(f"{API}/projects/{pid}", timeout=15).json()
    assert g2["plan"]["scenes"][order - 1]["headline"] == new_scene["headline"]


def test_regenerate_single_scene_with_script_override():
    rec = _create_project()
    pid = rec["id"]
    order = 1
    override_text = "TEST_OVERRIDE: Founders demanding faster pipelines and ruthless clarity."
    r = requests.post(
        f"{API}/projects/{pid}/scenes/{order}/regenerate",
        json={"sceneScriptText": override_text},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    new_scene = r.json()["plan"]["scenes"][order - 1]
    assert new_scene["scriptText"] == override_text

    g = requests.get(f"{API}/projects/{pid}", timeout=15).json()
    assert g["plan"]["scenes"][order - 1]["scriptText"] == override_text


def test_regenerate_scene_unknown_project_404():
    r = requests.post(
        f"{API}/projects/does-not-exist/scenes/1/regenerate", timeout=15
    )
    assert r.status_code == 404


def test_regenerate_scene_order_out_of_range_404():
    rec = _create_project()
    pid = rec["id"]
    r = requests.post(
        f"{API}/projects/{pid}/scenes/99/regenerate", timeout=30
    )
    assert r.status_code == 404


# ---------- POST /api/projects/{id}/regenerate (full) ----------
def test_regenerate_full_plan_returns_fresh_plan():
    rec = _create_project()
    pid = rec["id"]
    g_before = requests.get(f"{API}/projects/{pid}", timeout=15).json()
    title_before = g_before["plan"]["projectTitle"]
    original_script_before = g_before["plan"]["originalScript"]

    r = requests.post(f"{API}/projects/{pid}/regenerate", timeout=180)
    assert r.status_code == 200, r.text
    body = r.json()
    scenes = body["plan"]["scenes"]
    assert 3 <= len(scenes) <= 6
    assert body["plan"]["originalScript"].strip() == original_script_before.strip()

    # persisted
    g = requests.get(f"{API}/projects/{pid}", timeout=15).json()
    assert g["plan"]["projectTitle"] == body["plan"]["projectTitle"]


def test_regenerate_full_unknown_id_404():
    r = requests.post(f"{API}/projects/nope-xyz/regenerate", timeout=15)
    assert r.status_code == 404


def test_regenerate_full_empty_script_400():
    # Create a project, then blank originalScript via PUT, then call regenerate
    rec = _create_project()
    pid = rec["id"]
    g = requests.get(f"{API}/projects/{pid}", timeout=15).json()
    plan = copy.deepcopy(g["plan"])
    plan["originalScript"] = ""
    r_put = requests.put(f"{API}/projects/{pid}", json={"plan": plan}, timeout=15)
    assert r_put.status_code == 200

    r = requests.post(f"{API}/projects/{pid}/regenerate", timeout=15)
    assert r.status_code == 400, r.text

    # Restore script for any subsequent tests
    plan["originalScript"] = SAMPLE_SCRIPT
    requests.put(f"{API}/projects/{pid}", json={"plan": plan}, timeout=15)
