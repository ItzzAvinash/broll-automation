# Roll Studio — Internal B-roll Automation

## Original Problem Statement
Build an internal B-roll automation web application in phases. The app should help the in-house team generate B-roll style videos from scripts. The user selects a video ratio, customizes a brand deck, pastes a script, lets AI detect keywords/headlines/B-roll ideas, previews the generated video, edits the plan, and exports the final MP4. References: Remotion.dev + HyperFrames. Design: premium glassmorphism, dark, minimal, restrained.

## User Personas
- Internal creators/editors on the marketing & content team
- Brand designers customizing the look of generated B-roll
- Producers reviewing/exporting final cuts

## Core Requirements (static)
1. Step-based flow: Ratio → Brand Deck → Script → AI Analysis → Preview/Editor → Export
2. Premium glassmorphism dark UI (Outfit + Manrope typography, restrained palette)
3. Reusable components: GlassCard, StepLayout, AppButton, ColorPickerInput, FontSelector, RatioCard, PreviewPanel, SceneEditorCard, ExportPanel
4. Future: AI keyword/headline extraction, Remotion-driven render pipeline, MP4 export

## What's been implemented (Phase 1 — UI Foundation) — 2026-02-23
- Full step-based navigation with left sidebar (progress checkmarks) + top progress bar
- 6 pages routed: `/ratio`, `/brand`, `/script`, `/analysis`, `/preview`, `/export`
- All 9 reusable components (in `/app/frontend/src/components/broll/`)
- Ratio Selection: 16:9, 9:16, 1:1, 4:5 with proportional previews and selectable state
- Brand Deck: customizable colors (primary/secondary/accent/background/text), font selector (heading + body), brand name + logo mark, live brand preview surface
- Script Input: paste-aware textarea, sample script loader, word/char/duration estimators
- AI Analysis Review: mock headlines, keyword chips, suggested B-roll grid with cinematic thumbs
- Preview/Editor: aspect-correct preview surface with brand caption overlay, scene list (drag handles, thumbnails, transitions), scene properties panel, transport bar
- Export: render preset cards, summary, mocked render progress + completion
- State persistence via localStorage (`ProjectContext`)
- Custom design system: glass-panel utilities, dotted dividers, ambient background glows, custom scrollbar, fonts (Outfit + Manrope + JetBrains Mono)

## What's been implemented (Phase 2 — Ratio + Brand functional) — 2026-02-23
- Ratio Selection narrowed to exactly two cards: **YouTube 16:9** and **Instagram 9:16**; clicking auto-advances to Brand Deck (~380ms)
- Brand Deck reshaped to exactly **three colors**: Primary (video background), Secondary (main text), Highlight (keyword/important text); each with color-picker swatch **and HEX text input** (accepts with/without `#`)
- Exactly **two fonts**: Times New Roman Italic + Gotham Italic; main font is user-pick, keyword font is auto-set to the counterpart (Gotham ↔ Times)
- Brand letter-spacing locked at **−2px** across preview headline/body/eyebrow
- Gotham wired via `@font-face` in `index.html` with **Montserrat Italic** as graceful Google-Fonts fallback (drop a licensed `Gotham-BookItalic.woff2` into `/public/fonts/` to activate)
- localStorage schema bumped to `broll.studio.v2`; defensive merge so stale v1 state is reset
- Frontend test report iteration_2: **100% pass (13/13 acceptance items)**

## What's been implemented (Phase 3 — Script Input + AI B-roll Planning) — 2026-02-23
- Backend `/api/projects/analyze` endpoint: receives script + brand + ratio, calls **Gemini 3 Flash** (`gemini-3-flash-preview`) via `emergentintegrations` + Emergent Universal LLM key, returns strictly-structured `ProjectRecord` JSON, persists to MongoDB `projects` collection
- Strict JSON contract: `projectTitle` (auto-derived from first headline), `originalScript`, `scenes[]` with `order`, `scriptText`, `headline`, `textOverlay`, `duration` (2-8s), `motionStyle`, `highlightedKeywords[]` (text/reason/visualTreatment/useHighlightColor/assetSuggestion/suggestedSearchQuery), `brollSuggestions[]` (assetType/description/suggestedSearchQuery/placement/priority)
- Defensive JSON extraction (strips code-fence markers, renumbers scenes, clamps durations, fills defaults)
- Additional endpoints: `GET /api/projects` (recent-first list), `GET /api/projects/{id}` (single project)
- Frontend Script page: **"Generate B-roll Plan"** primary button calls backend, shows loading state, disables textarea while in flight, toast on success/error
- Frontend Analysis page: now reads `state.plan` and renders real scenes with color-coded keyword chips by reason category (emotional/business/marketing/product/statistic/problem/solution/urgency/transformation/visual), priority-sorted B-roll cards with `assetType`, `placement`, and `suggestedSearchQuery` visible
- ProjectContext bumped to `broll.studio.v3` with `plan`, `projectId`, transient `analyzing`/`analyzeError` fields (transient fields stripped before persistence)
- Test report iteration_3: **backend 100% (10/10 pytest)**, **frontend 100%** — zero console errors

## What's been implemented (Phase 4 — Editable Scene Editor) — 2026-02-23
- **Layout**: left = editable scene cards (SceneEditCard), right = sticky brand-styled preview + summary (PlanPreviewPanel)
- **Per-scene editing**: inline edit of headline / textOverlay / scriptText / duration (range 2-8s) / motionStyle (10 options) plus chip-style editors for highlightedKeywords (text + reason dropdown w/ 10 reasons + search query + remove) and brollSuggestions (description + searchQuery + assetType + placement + priority + remove). Inline-add buttons for both lists.
- **Inline-edit project title** at the top of the page (plan-title-input)
- **Reorder scenes** via ChevronUp/ChevronDown on each card (renumbers 1..N automatically and persists)
- **Regenerate Scene** button per card calls `POST /api/projects/{id}/scenes/{order}/regenerate` — refreshes only that scene's headline/textOverlay/motionStyle/highlightedKeywords/brollSuggestions while preserving scriptText
- **Regenerate Full Plan** button (StepLayout secondary + toolbar) calls `POST /api/projects/{id}/regenerate` to rebuild the entire plan from stored script
- **Active scene activation** via click anywhere on card body, header click, OR focusing any input — preview + summary panel update live
- **Debounced auto-save** (900ms): every plan edit triggers `PUT /api/projects/{id}`; UI shows `autosave-indicator-saving` → `autosave-indicator-saved` with "Saved Ns ago" relative timestamp
- **Backend additions**: `llm_service.regenerate_scene()` with focused single-scene prompt + scriptText preservation + duration clamping; `server.py` adds PUT /api/projects/{id}, POST /api/projects/{id}/regenerate, POST /api/projects/{id}/scenes/{order}/regenerate
- Test report iteration_4: **backend 100% (10/10 pytest)**, **frontend 100%** after fixing the body-click activation bug

## What's been implemented (Phase 5 — Remotion Video Preview) — 2026-06-23
- **VideoPreview page** (`/preview`) renders a live in-browser preview via `@remotion/player` driven by selected ratio + brand deck + scene plan
- **Remotion composition** (`remotion/BrollComposition.jsx`): one `<Sequence>` per scene with cross-fade transitions; duration derived from each scene's `duration` at 30fps; canonical 1920×1080 (16:9) / 1080×1920 (9:16) composition size, ratio-safe (composition-space px scale uniformly)
- **`BRollPlaceholder.jsx`**: premium animated B-roll placeholder block (slow push/zoom 1.0→1.06, drifting brand-color gradient, subtle moving grid, vignette, "B-roll · {assetType}" label chip, faint centered description). Stands in for real footage in MVP
- **`Caption.jsx`**: word-by-word headline reveal (fade + rise), keyword "pop" spring animation; keywords rendered in HIGHLIGHT color + the OPPOSITE font (main font ↔ counterpart); eyebrow = brandName; optional textOverlay subtitle. All brand text uses letter-spacing −2px
- **Styling rules enforced**: primary = background, secondary = main text, highlight = keyword text, main font = selected, keyword font = opposite, letter-spacing −2px
- **Right rail**: clickable Scene strip (scrub/seek to scene via player `seekTo`, active scene synced to `frameupdate`) + Render summary (ratio, frames, duration, composition, background/highlight hex)
- **Reactivity**: preview reads `state.plan`/`state.brand`/`state.ratio` from ProjectContext, so edits on Step 04 reflect in the preview
- Added `acknowledgeRemotionLicense` prop to suppress license console warning
- **Verified** (UI agent, both ratios): animated content renders (not black), B-roll blocks per scene, keyword styling, scrubbing, correct ratio/colors. All 6 acceptance criteria met.

### Environment note (2026-06-23)
- Restored empty `backend/.env` (MONGO_URL, DB_NAME, CORS_ORIGINS, EMERGENT_LLM_KEY) and `frontend/.env` (REACT_APP_BACKEND_URL) — the checkout shipped with empty env files and the app was fully down.
- **KNOWN BLOCKER**: the EMERGENT_LLM_KEY has a very low budget cap (max $0.001, already exceeded), so `POST /api/projects/analyze` ("Generate B-roll Plan") fails with a LiteLLM budget error. The user must add Emergent credits or supply their own LLM key for live generation. Phase 5 preview itself does NOT depend on the LLM.

## What's been implemented (Phase 6 — MP4 Export) — 2026-06-23
- **Real client-side MP4 export** — no server/Node renderer, no LLM dependency. `frontend/src/lib/videoExport.js` renders the plan onto a 2D `<canvas>` (faithfully mirrors the Remotion composition: brand colors, main/opposite fonts, keyword highlight, B-roll placeholder blocks + label chips, slow zoom, cross-fade transitions, scene order, edited headlines, −2px letter spacing) and records it via `MediaRecorder.captureStream` preferring `video/mp4;codecs=avc1` (H.264) with a WebM fallback (`pickMimeType`).
- **Export page** (`ExportPanel.jsx`): final Remotion preview (same as Step 05), Export summary (project title, ratio + resolution, scene count, duration, background/highlight hex, format), Export button, real-time progress %, auto-download on completion, "Download again" + "Re-render", cancel-during-render, and an empty state when no plan exists.
- **Verified** (UI agent): real MP4 files download for both ratios — 16:9 `save-10-hours-every-week.mp4` (173,522 bytes), 9:16 (135,861 bytes); progress reaches 100%; done banner + buttons; no console errors. All 5 acceptance criteria met. **Roll Studio MVP (Phases 1–6) complete.**

## Prioritized Backlog
### P0 (next phase)
- Wire FastAPI backend (`/api/...`) for project CRUD, script analysis, render orchestration
- LLM integration for real keyword/headline/B-roll-idea extraction (GPT/Claude/Gemini via Emergent LLM key)
- B-roll asset library + search (Pexels/Unsplash/uploaded)

### P1
- Remotion.dev composition + render pipeline (mp4 export)
- Drag-to-reorder scenes
- Per-scene caption editing & font sizing
- Voiceover/audio track support

### P2
- Project list / multi-project dashboard
- Team collaboration & comments
- Brand presets save/load
- Template gallery

## Next Action Items
- Phase 2: Backend scaffolding + LLM-driven analysis
- Phase 3: Remotion render integration & real MP4 export
- Phase 4: Asset library + advanced editing
