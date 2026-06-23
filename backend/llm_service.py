"""
LLM service — wraps Gemini 3 Flash via emergentintegrations for
structured B-roll plan generation from a video script.
"""
from __future__ import annotations

import json
import logging
import os
import re
import uuid
from typing import Any

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-3-flash-preview"
GEMINI_PROVIDER = "gemini"


SYSTEM_PROMPT = """You are an AI B-roll planning assistant for an internal video-production tool.

Given a video script (and brand context), break it into structured scenes and return a single, valid JSON object that follows EXACTLY the schema below.

OUTPUT RULES — absolutely critical:
- Return ONLY the JSON object. No markdown, no code fences, no commentary, no leading or trailing text.
- All strings must be valid JSON-escaped UTF-8.
- All numbers must be numbers (not strings).
- Do not invent fields. Do not omit required fields.

SCHEMA (use these exact keys):
{
  "projectTitle": string,         // 3-6 words, derived from the first scene's headline
  "originalScript": string,       // verbatim copy of the input script
  "scenes": [
    {
      "order": integer,           // 1-based, sequential
      "scriptText": string,       // exact substring(s) from the script that this scene covers
      "headline": string,         // short on-screen caption, 3-8 words
      "textOverlay": string,      // optional secondary subtitle line, 0-10 words
      "duration": number,         // seconds, 2 - 8
      "motionStyle": string,      // one of: "Static" | "Slow Push" | "Pan Left" | "Pan Right" | "Zoom In" | "Zoom Out" | "Parallax" | "Whip Cut" | "Cinematic Crane" | "Dolly"
      "highlightedKeywords": [
        {
          "text": string,                     // exact word/phrase from headline OR textOverlay OR scriptText
          "reason": string,                   // one of: "emotional" | "business" | "marketing" | "product" | "statistic" | "problem" | "solution" | "urgency" | "transformation" | "visual"
          "visualTreatment": string,          // e.g. "Italic emphasis", "Bold underline", "Highlight color"
          "useHighlightColor": boolean,
          "assetSuggestion": string,          // short b-roll asset idea tied to this keyword
          "suggestedSearchQuery": string      // 2-6 words for Pexels/Unsplash stock search
        }
      ],
      "brollSuggestions": [
        {
          "assetType": string,                // "video" | "image" | "graphic"
          "description": string,              // 1-sentence cinematic description
          "suggestedSearchQuery": string,     // 2-6 words for stock library search
          "placement": string,                // "background" | "overlay" | "lower-third" | "cutaway" | "transition"
          "priority": string                  // "high" | "medium" | "low"
        }
      ]
    }
  ]
}

CONTENT RULES:
- Produce 3-6 scenes total. Each scene should cover 1-3 consecutive sentences from the script.
- For each scene include 2-4 highlightedKeywords and 2-3 brollSuggestions.
- Keyword detection priorities (focus on these categories): emotional words, business terms, marketing terms, product/service names, numbers and statistics, problem statements, solution statements, urgency words, transformation words, visually-emphasis-worthy words.
- Search queries must be concrete and "stock-library searchable" (good Pexels/Unsplash hits). No quotes, no punctuation.
- Headlines must be PUNCHY — they are large captions on screen, not full sentences.
- Motion styles should feel cinematic and editorial; vary across scenes rather than repeating one style.
- Set `priority: "high"` on at most one suggestion per scene.
"""


def _build_user_prompt(script: str, brand: dict, ratio: str) -> str:
    return (
        "BRAND CONTEXT\n"
        f"- Brand name: {brand.get('brandName', 'Untitled')}\n"
        f"- Primary color (video background): {brand.get('primary', '#0A0A0B')}\n"
        f"- Secondary color (text): {brand.get('secondary', '#FAFAFA')}\n"
        f"- Highlight color (keywords): {brand.get('highlight', '#E4B8A0')}\n"
        f"- Main font: {brand.get('mainFont', 'times')}\n"
        f"- Aspect ratio: {ratio}\n"
        "\nSCRIPT TO ANALYZE\n"
        f"{script}\n"
        "\nReturn the JSON object only."
    )


_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _extract_json(raw: str) -> dict[str, Any]:
    """Pull a JSON object out of the model's raw text, defensively
    stripping code fences and any leading/trailing prose."""
    if not raw:
        raise ValueError("Empty LLM response")

    text = raw.strip()
    text = _FENCE_RE.sub("", text).strip()

    # Find the first { ... last } slice (handles minor wrapping)
    first = text.find("{")
    last = text.rfind("}")
    if first == -1 or last == -1 or last <= first:
        raise ValueError(f"No JSON object found in LLM response: {raw[:200]}")

    candidate = text[first : last + 1]
    return json.loads(candidate)


async def analyze_script(
    *,
    script: str,
    brand: dict,
    ratio: str,
    session_id: str | None = None,
) -> dict[str, Any]:
    """Call Gemini 3 Flash with the script + brand context and return
    the parsed structured B-roll plan."""

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY is not configured in backend/.env")

    if not script or not script.strip():
        raise ValueError("script is empty")

    sid = session_id or f"broll-{uuid.uuid4()}"
    chat = LlmChat(
        api_key=api_key,
        session_id=sid,
        system_message=SYSTEM_PROMPT,
    ).with_model(GEMINI_PROVIDER, GEMINI_MODEL)

    user_msg = UserMessage(text=_build_user_prompt(script, brand, ratio))

    # Non-streaming: we need the full JSON before parsing.
    logger.info("Calling Gemini 3 Flash for script analysis (session=%s)", sid)
    raw = await chat.send_message(user_msg)
    logger.info("LLM returned %d chars", len(raw or ""))

    plan = _extract_json(raw)

    # Defensive normalisation — guarantee originalScript matches input
    plan.setdefault("originalScript", script)
    plan.setdefault("scenes", [])

    # Auto-derive projectTitle from first scene headline if model didn't
    if not plan.get("projectTitle"):
        first = plan["scenes"][0] if plan["scenes"] else None
        if first and first.get("headline"):
            words = first["headline"].split()
            plan["projectTitle"] = " ".join(words[:6])
        else:
            plan["projectTitle"] = "Untitled Project"

    # Renumber scenes 1..N to be safe
    for idx, sc in enumerate(plan["scenes"], start=1):
        sc["order"] = idx
        sc.setdefault("highlightedKeywords", [])
        sc.setdefault("brollSuggestions", [])
        sc.setdefault("motionStyle", "Static")
        sc.setdefault("textOverlay", "")
        # Clamp duration
        try:
            d = float(sc.get("duration", 4))
            sc["duration"] = max(2.0, min(8.0, d))
        except (TypeError, ValueError):
            sc["duration"] = 4.0

    return plan


# ============================================================
# Single-scene regeneration
# ============================================================

SCENE_REGEN_SYSTEM_PROMPT = """You are an AI B-roll planning assistant. Given ONE scene of an existing B-roll plan plus its surrounding context, regenerate just that single scene.

Return ONLY a single JSON object describing the new scene — no markdown, no code fences, no commentary.

Schema (identical to a single scene of the full plan):
{
  "order": integer,
  "scriptText": string,           // KEEP UNCHANGED — same value as the input scene
  "headline": string,             // FRESH — 3-8 words, punchy, brand-aware
  "textOverlay": string,          // FRESH — optional secondary subtitle (0-10 words)
  "duration": number,             // 2 - 8 seconds
  "motionStyle": string,          // one of: "Static" | "Slow Push" | "Pan Left" | "Pan Right" | "Zoom In" | "Zoom Out" | "Parallax" | "Whip Cut" | "Cinematic Crane" | "Dolly"
  "highlightedKeywords": [
    {"text": string, "reason": string, "visualTreatment": string,
     "useHighlightColor": boolean, "assetSuggestion": string, "suggestedSearchQuery": string}
  ],
  "brollSuggestions": [
    {"assetType": string, "description": string, "suggestedSearchQuery": string,
     "placement": string, "priority": "high" | "medium" | "low"}
  ]
}

CONTENT RULES:
- Produce 2-4 highlightedKeywords drawn from these reason categories: emotional, business, marketing, product, statistic, problem, solution, urgency, transformation, visual.
- Produce 2-3 brollSuggestions with concrete stock-library-friendly search queries.
- Vary the motionStyle from whatever appears in the surrounding scenes if possible.
- Keep the headline and overlay aligned with the surrounding narrative — they're consecutive beats of one video.
"""


def _build_regen_user_prompt(
    scene: dict, surrounding: list[dict], brand: dict, ratio: str
) -> str:
    # Provide a compact view of neighbouring scenes so the regen stays coherent
    order = scene.get("order", 1)
    neighbours = []
    for s in surrounding:
        if s.get("order") == order:
            continue
        neighbours.append(
            {
                "order": s.get("order"),
                "scriptText": s.get("scriptText", "")[:200],
                "headline": s.get("headline", ""),
            }
        )

    payload = {
        "scene_to_regenerate": {
            "order": order,
            "scriptText": scene.get("scriptText", ""),
        },
        "surrounding_scenes": neighbours,
        "brand": {
            "brandName": brand.get("brandName", "Untitled"),
            "primary": brand.get("primary", "#0A0A0B"),
            "secondary": brand.get("secondary", "#FAFAFA"),
            "highlight": brand.get("highlight", "#E4B8A0"),
            "mainFont": brand.get("mainFont", "times"),
        },
        "ratio": ratio,
    }
    return (
        "CONTEXT JSON:\n"
        + json.dumps(payload, ensure_ascii=False, indent=2)
        + "\n\nReturn ONLY the regenerated scene JSON object."
    )


async def regenerate_scene(
    *,
    scene: dict,
    surrounding: list[dict],
    brand: dict,
    ratio: str,
    session_id: str | None = None,
) -> dict[str, Any]:
    """Call Gemini 3 Flash to regenerate one scene's headline / textOverlay /
    motionStyle / highlightedKeywords / brollSuggestions. scriptText is
    preserved by the caller — the model is instructed to keep it identical."""

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY is not configured in backend/.env")

    sid = session_id or f"broll-regen-{uuid.uuid4()}"
    chat = LlmChat(
        api_key=api_key,
        session_id=sid,
        system_message=SCENE_REGEN_SYSTEM_PROMPT,
    ).with_model(GEMINI_PROVIDER, GEMINI_MODEL)

    user_msg = UserMessage(
        text=_build_regen_user_prompt(scene, surrounding, brand, ratio)
    )

    logger.info("Regenerating scene %s (session=%s)", scene.get("order"), sid)
    raw = await chat.send_message(user_msg)
    new_scene = _extract_json(raw)

    # Defensive defaults
    new_scene.setdefault("order", scene.get("order", 1))
    new_scene.setdefault("highlightedKeywords", [])
    new_scene.setdefault("brollSuggestions", [])
    new_scene.setdefault("motionStyle", "Static")
    new_scene.setdefault("textOverlay", "")
    new_scene.setdefault("headline", scene.get("headline", ""))
    # Clamp duration
    try:
        d = float(new_scene.get("duration", scene.get("duration", 4)))
        new_scene["duration"] = max(2.0, min(8.0, d))
    except (TypeError, ValueError):
        new_scene["duration"] = 4.0
    return new_scene
