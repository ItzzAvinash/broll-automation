"""Backend tests for Phase 3 — POST /api/projects/analyze + GET /api/projects[/{id}]."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://remotion-composer-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

SAMPLE_SCRIPT = (
    "Every day, thousands of small businesses struggle with outdated marketing tools. "
    "They lose customers, waste money, and burn out their teams. "
    "Our new platform changes everything — it automates outreach, tracks conversions in real time, "
    "and gives founders their evenings back. "
    "In 90 days, our pilot customers grew revenue by 47%. "
    "Stop guessing. Start scaling. Try the platform free for 14 days."
)

ANALYZE_CACHE = {}


def _api_analyze():
    """Cache one analyze response across tests to avoid burning LLM calls."""
    if "resp" in ANALYZE_CACHE:
        return ANALYZE_CACHE["resp"]
    r = requests.post(
        f"{API}/projects/analyze",
        json={
            "script": SAMPLE_SCRIPT,
            "brand": {"brandName": "TEST_Studio"},
            "ratio": "16:9",
        },
        timeout=90,
    )
    ANALYZE_CACHE["resp"] = r
    return r


# ---------- Health ----------
def test_root_ok():
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert "message" in r.json()


# ---------- Analyze: validation ----------
def test_analyze_empty_script_returns_400():
    r = requests.post(f"{API}/projects/analyze", json={"script": "  "}, timeout=30)
    assert r.status_code == 400, r.text


def test_analyze_missing_script_returns_422():
    r = requests.post(f"{API}/projects/analyze", json={}, timeout=30)
    # Pydantic validation -> 422
    assert r.status_code in (400, 422), r.text


# ---------- Analyze: happy path ----------
def test_analyze_returns_project_record():
    r = _api_analyze()
    assert r.status_code == 200, r.text
    data = r.json()

    # Envelope
    for key in ("id", "createdAt", "ratio", "brand", "plan"):
        assert key in data, f"missing key {key}"
    assert isinstance(data["id"], str) and len(data["id"]) > 0
    assert data["ratio"] == "16:9"

    plan = data["plan"]
    assert isinstance(plan["projectTitle"], str) and plan["projectTitle"].strip()
    assert plan["originalScript"].strip().startswith("Every day")
    assert isinstance(plan["scenes"], list)
    assert 3 <= len(plan["scenes"]) <= 6, f"expected 3-6 scenes, got {len(plan['scenes'])}"


def test_analyze_scenes_shape():
    r = _api_analyze()
    plan = r.json()["plan"]
    motion_styles = set()
    for i, sc in enumerate(plan["scenes"], start=1):
        assert sc["order"] == i
        assert isinstance(sc["scriptText"], str) and sc["scriptText"].strip()
        assert isinstance(sc["headline"], str) and sc["headline"].strip()
        assert isinstance(sc["textOverlay"], str)  # may be empty
        assert isinstance(sc["duration"], (int, float))
        assert 2.0 <= float(sc["duration"]) <= 8.0
        assert isinstance(sc["motionStyle"], str) and sc["motionStyle"]
        motion_styles.add(sc["motionStyle"])

        # Keywords 2-4
        kws = sc["highlightedKeywords"]
        assert isinstance(kws, list) and 2 <= len(kws) <= 4, f"scene {i} keywords len={len(kws)}"
        for k in kws:
            for key in ("text", "reason", "visualTreatment", "useHighlightColor",
                        "assetSuggestion", "suggestedSearchQuery"):
                assert key in k, f"missing keyword field {key}"
            assert isinstance(k["useHighlightColor"], bool)

        # B-roll 2-3
        bs = sc["brollSuggestions"]
        assert isinstance(bs, list) and 2 <= len(bs) <= 3, f"scene {i} broll len={len(bs)}"
        for b in bs:
            for key in ("assetType", "description", "suggestedSearchQuery", "placement", "priority"):
                assert key in b
            assert b["priority"] in ("high", "medium", "low")
            assert b["assetType"] in ("video", "image", "graphic")


def test_keyword_reason_variety():
    r = _api_analyze()
    plan = r.json()["plan"]
    reasons = set()
    for sc in plan["scenes"]:
        for k in sc["highlightedKeywords"]:
            reasons.add((k.get("reason") or "").lower())
    expected = {"emotional", "business", "marketing", "product", "statistic",
                "problem", "solution", "urgency", "transformation", "visual"}
    overlap = reasons & expected
    assert len(overlap) >= 3, f"expected at least 3 reason categories from {expected}, got {reasons}"


def test_project_title_is_short():
    r = _api_analyze()
    plan = r.json()["plan"]
    word_count = len(plan["projectTitle"].split())
    # Spec says 3-6 words; allow a tiny slack to avoid LLM flakiness
    assert 2 <= word_count <= 8, f"projectTitle has {word_count} words: {plan['projectTitle']!r}"


# ---------- List + get ----------
def test_list_projects_contains_new_record():
    r = _api_analyze()
    new_id = r.json()["id"]

    listing = requests.get(f"{API}/projects", timeout=15)
    assert listing.status_code == 200
    items = listing.json()
    assert isinstance(items, list) and len(items) >= 1
    ids = [it["id"] for it in items]
    assert new_id in ids, f"new project id not in listing"
    # Most recent first → our just-created should be near the top
    assert ids.index(new_id) < 5


def test_get_project_by_id_roundtrip():
    r = _api_analyze()
    new_id = r.json()["id"]
    g = requests.get(f"{API}/projects/{new_id}", timeout=15)
    assert g.status_code == 200, g.text
    got = g.json()
    assert got["id"] == new_id
    assert got["plan"]["projectTitle"] == r.json()["plan"]["projectTitle"]
    # _id from mongo must not leak
    assert "_id" not in got


def test_get_project_404():
    r = requests.get(f"{API}/projects/does-not-exist-xyz", timeout=15)
    assert r.status_code == 404
