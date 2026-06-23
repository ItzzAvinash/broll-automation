// Phase 6 — Client-side MP4 export.
// Renders the B-roll plan onto a 2D <canvas> (faithfully mirroring the Remotion
// composition: brand colors, fonts, keyword highlight, B-roll placeholder blocks,
// fades + slow zoom, scene order, -2px letter spacing) and records it with
// MediaRecorder -> MP4 (H.264) with a WebM fallback. Fully client-side, no server.

import {
  getFontById,
  counterpartFontId,
} from "@/constants/mockData";

export const FPS = 30;
const TRANSITION_FRAMES = 12;
const PER_WORD = 5; // frames between word reveals
const LS = -2; // brand letter-spacing in px

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);

// ---- Timeline helpers (kept consistent with BrollComposition) ----
export const sceneFrameCount = (scene, fps = FPS) =>
  Math.max(Math.floor((scene.duration || 4) * fps), Math.floor(2 * fps));

export const buildOffsets = (plan, fps = FPS) => {
  const offsets = [];
  let f = 0;
  (plan?.scenes || []).forEach((s) => {
    offsets.push(f);
    f += sceneFrameCount(s, fps);
  });
  return offsets;
};

export const totalFrames = (plan, fps = FPS) => {
  if (!plan?.scenes?.length) return fps * 2;
  return Math.max(
    plan.scenes.reduce((acc, s) => acc + sceneFrameCount(s, fps), 0),
    fps,
  );
};

export const totalSeconds = (plan, fps = FPS) =>
  totalFrames(plan, fps) / fps;

export const compositionSize = (ratioId) =>
  ratioId === "9:16" ? { W: 1080, H: 1920 } : { W: 1920, H: 1080 };

const fontString = (font, size, weight = 400) =>
  `${font.style?.fontStyle || "italic"} ${weight} ${size}px ${font.stack}`;

const keywordSet = (scene) =>
  new Set(
    (scene.highlightedKeywords || [])
      .filter((k) => k.useHighlightColor !== false)
      .map((k) => (k.text || "").toLowerCase().trim()),
  );

const cleanWord = (w) => w.replace(/[^\w]/g, "").toLowerCase();

// Apply alpha to a hex color (#RRGGBB) -> rgba()
const withAlpha = (hex, a) => {
  const m = (hex || "#000000").replace("#", "");
  const r = parseInt(m.substring(0, 2) || "00", 16);
  const g = parseInt(m.substring(2, 4) || "00", 16);
  const b = parseInt(m.substring(4, 6) || "00", 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// --- B-roll placeholder layer ---
const drawBroll = (ctx, scene, brand, localFrame, sceneFrames, W, H, master) => {
  const primary = brand.primary || "#0A0A0B";
  const highlight = brand.highlight || "#E4B8A0";
  const secondary = brand.secondary || "#FAFAFA";

  const scale = 1 + 0.06 * clamp01(localFrame / sceneFrames);
  const brollAlpha = master * easeOut(localFrame / 18);
  const drift = (localFrame / FPS) * 8;

  const primaryBroll = (scene.brollSuggestions || [])[0];
  const accentTone = primaryBroll?.assetType || "Visual";
  const description =
    primaryBroll?.description || `B-roll · ${scene.headline || "Scene"}`;

  ctx.save();
  ctx.globalAlpha = clamp01(brollAlpha);
  // slow push
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);
  ctx.translate(-W / 2, -H / 2);

  // cinematic radial gradients
  const g1cx = (0.2 + drift / 100) * W;
  const g1 = ctx.createRadialGradient(g1cx, 0.3 * H, 0, g1cx, 0.3 * H, W * 0.55);
  g1.addColorStop(0, withAlpha(highlight, 0.16));
  g1.addColorStop(1, withAlpha(highlight, 0));
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  const g2cy = (0.7 + drift / 100) * H;
  const g2 = ctx.createRadialGradient(0.8 * W, g2cy, 0, 0.8 * W, g2cy, W * 0.45);
  g2.addColorStop(0, withAlpha(secondary, 0.07));
  g2.addColorStop(1, withAlpha(secondary, 0));
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // vignette
  const vg = ctx.createLinearGradient(0, 0, 0, H);
  vg.addColorStop(0, withAlpha(primary, 0.67));
  vg.addColorStop(0.4, withAlpha(primary, 0.33));
  vg.addColorStop(1, withAlpha(primary, 0.93));
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // centered faint description
  ctx.save();
  ctx.fillStyle = withAlpha(secondary, 0.34);
  ctx.font = `normal 200 ${Math.round(W * 0.0188)}px 'Outfit', sans-serif`;
  ctx.letterSpacing = `${LS}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const maxDescW = W * 0.7;
  const dLines = wrapText(ctx, description, maxDescW);
  const dLH = Math.round(W * 0.0188) * 1.15;
  const dStart = H / 2 - ((dLines.length - 1) * dLH) / 2;
  dLines.forEach((ln, i) => ctx.fillText(ln, W / 2, dStart + i * dLH));
  ctx.restore();

  // label chip top-right: "B-ROLL · {assetType}"
  ctx.save();
  const chipFs = Math.round(W * 0.0073);
  ctx.font = `500 ${chipFs}px 'Outfit', sans-serif`;
  ctx.letterSpacing = "3px";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const label = `B-ROLL · ${String(accentTone).toUpperCase()}`;
  const padX = 14;
  const padY = 9;
  const dot = 9;
  const gap = 10;
  const textW = ctx.measureText(label).width;
  const chipW = padX + dot + gap + textW + padX;
  const chipH = chipFs + padY * 2;
  const chipX = W - 36 - chipW;
  const chipY = 36;
  roundRect(ctx, chipX, chipY, chipW, chipH, chipH / 2);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();
  // dot
  ctx.beginPath();
  ctx.fillStyle = highlight;
  ctx.arc(chipX + padX + dot / 2, chipY + chipH / 2, dot / 2, 0, Math.PI * 2);
  ctx.fill();
  // label text
  ctx.fillStyle = secondary;
  ctx.fillText(label, chipX + padX + dot + gap, chipY + chipH / 2 + 1);
  ctx.restore();

  ctx.restore();
};

// --- Caption layer (eyebrow + word-by-word headline + overlay) ---
const drawCaption = (ctx, scene, brand, localFrame, W, H, master) => {
  const secondary = brand.secondary || "#FAFAFA";
  const highlight = brand.highlight || "#E4B8A0";
  const mainFont = getFontById(brand.mainFont);
  const keywordFont = getFontById(counterpartFontId(brand.mainFont));
  const kw = keywordSet(scene);

  const pad = 64;
  const headSize = Math.round(W * 0.0406); // ~78 on 1920
  const headLH = headSize * 1.05;
  const eyebrowSize = Math.round(W * 0.0083);
  const overlaySize = Math.round(W * 0.0115);
  const overlayLH = overlaySize * 1.4;
  const maxHeadW = W * 0.85 - pad;
  const maxOverlayW = W * 0.65 - pad;

  // ---- layout headline ----
  ctx.save();
  ctx.letterSpacing = `${LS}px`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = fontString(mainFont, headSize, 300);
  const spaceW = ctx.measureText(" ").width;
  const words = (scene.headline || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = [];
  let curW = 0;
  words.forEach((w, idx) => {
    const isKw = kw.has(cleanWord(w));
    const font = isKw ? keywordFont : mainFont;
    ctx.font = fontString(font, headSize, isKw ? 400 : 300);
    const wWidth = ctx.measureText(w).width;
    const addW = (cur.length ? spaceW : 0) + wWidth;
    if (curW + addW > maxHeadW && cur.length) {
      lines.push(cur);
      cur = [];
      curW = 0;
    }
    const x = curW + (cur.length ? spaceW : 0);
    cur.push({ text: w, isKw, font, x, width: wWidth, wordIndex: idx });
    curW = x + wWidth;
  });
  if (cur.length) lines.push(cur);

  // overlay lines
  ctx.font = fontString(mainFont, overlaySize, 400);
  const overlayLines = scene.textOverlay
    ? wrapText(ctx, scene.textOverlay, maxOverlayW)
    : [];

  // ---- compute block height & top ----
  const eyebrowBlock = eyebrowSize + 18;
  const headBlock = lines.length * headLH;
  const overlayBlock = overlayLines.length
    ? 22 + overlayLines.length * overlayLH
    : 0;
  const totalH = eyebrowBlock + headBlock + overlayBlock;
  let y = H - pad - totalH;

  // ---- eyebrow ----
  ctx.font = fontString(keywordFont, eyebrowSize, 500);
  ctx.letterSpacing = `${Math.round(eyebrowSize * 0.32)}px`;
  ctx.globalAlpha = clamp01(master * clamp01(localFrame / 8));
  ctx.fillStyle = highlight;
  ctx.fillText(String(brand.brandName || "Roll").toUpperCase(), pad, y);
  y += eyebrowBlock;

  // ---- headline (word by word) ----
  ctx.letterSpacing = `${LS}px`;
  lines.forEach((line, li) => {
    const lineY = y + li * headLH;
    line.forEach((word) => {
      const enter = word.wordIndex * PER_WORD;
      const lw = localFrame - enter;
      const wordOpacity = clamp01(lw / 8);
      if (wordOpacity <= 0) return;
      const yOffset = lerp(10, 0, clamp01(lw / 10));
      let popScale = 1;
      if (word.isKw) popScale = lerp(0.86, 1, easeOut(lw / 14));

      ctx.save();
      ctx.globalAlpha = clamp01(master * wordOpacity);
      ctx.fillStyle = word.isKw ? highlight : secondary;
      ctx.font = fontString(word.font, headSize, word.isKw ? 400 : 300);
      ctx.translate(pad + word.x, lineY + yOffset);
      if (popScale !== 1) {
        ctx.translate(0, headSize / 2);
        ctx.scale(popScale, popScale);
        ctx.translate(0, -headSize / 2);
      }
      ctx.fillText(word.text, 0, 0);
      ctx.restore();
    });
  });
  y += headBlock;

  // ---- overlay ----
  if (overlayLines.length) {
    y += 22;
    ctx.font = fontString(mainFont, overlaySize, 400);
    ctx.letterSpacing = `${LS}px`;
    ctx.globalAlpha = clamp01(master * lerp(0, 0.78, clamp01((localFrame - 10) / 14)));
    ctx.fillStyle = secondary;
    overlayLines.forEach((ln, i) => ctx.fillText(ln, pad, y + i * overlayLH));
  }
  ctx.restore();
};

// word-wrap helper using the current ctx.font / ctx.letterSpacing
function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  words.forEach((w) => {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  });
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const drawScene = (ctx, scene, brand, localFrame, sceneFrames, W, H, master) => {
  ctx.save();
  ctx.globalAlpha = clamp01(master);
  ctx.fillStyle = brand.primary || "#0A0A0B";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  drawBroll(ctx, scene, brand, localFrame, sceneFrames, W, H, master);
  drawCaption(ctx, scene, brand, localFrame, W, H, master);
};

// Draw a full frame (handles cross-fade between consecutive scenes)
export const drawFrame = (ctx, plan, brand, W, H, frame, fps = FPS) => {
  // base background so transitions never flash to transparent
  ctx.globalAlpha = 1;
  ctx.fillStyle = brand.primary || "#0A0A0B";
  ctx.fillRect(0, 0, W, H);

  const scenes = plan?.scenes || [];
  if (!scenes.length) return;
  const offsets = buildOffsets(plan, fps);

  let i = 0;
  for (let k = 0; k < offsets.length; k++) {
    if (offsets[k] <= frame) i = k;
  }
  const localFrame = frame - offsets[i];
  const sf = sceneFrameCount(scenes[i], fps);

  if (i > 0 && localFrame < TRANSITION_FRAMES) {
    // cross-fade: previous scene (held at its end) under the incoming scene
    const prev = scenes[i - 1];
    const prevSf = sceneFrameCount(prev, fps);
    drawScene(ctx, prev, brand, prevSf - 1, prevSf, W, H, 1);
    drawScene(ctx, scenes[i], brand, localFrame, sf, W, H, localFrame / TRANSITION_FRAMES);
  } else {
    drawScene(ctx, scenes[i], brand, localFrame, sf, W, H, 1);
  }
  ctx.globalAlpha = 1;
};

// ---- MediaRecorder mime selection (prefer MP4/H.264) ----
export const pickMimeType = () => {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1.42001f",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=h264",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  if (typeof MediaRecorder === "undefined") return null;
  return candidates.find((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch (e) {
      return false;
    }
  });
};

/**
 * Render + record the plan to a video Blob (real-time capture).
 * @returns {Promise<{blob: Blob, mime: string, ext: string, durationMs: number}>}
 */
export const exportVideo = async ({
  plan,
  brand,
  ratioId,
  fps = FPS,
  onProgress = () => {},
  signal,
} = {}) => {
  if (!plan?.scenes?.length) throw new Error("No scenes to export.");
  const mime = pickMimeType();
  if (!mime) throw new Error("This browser cannot record video (MediaRecorder unsupported).");

  const { W, H } = compositionSize(ratioId);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Make sure web fonts are ready so text renders with the right face
  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch (e) {
    /* ignore */
  }

  const total = totalFrames(plan, fps);

  // initial frame so the stream starts with content
  drawFrame(ctx, plan, brand, W, H, 0, fps);

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 12_000_000,
  });
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  const startTime = performance.now();
  recorder.start();

  await new Promise((resolve, reject) => {
    let raf = 0;
    const loop = (now) => {
      if (signal?.aborted) {
        cancelAnimationFrame(raf);
        reject(new DOMException("Export cancelled", "AbortError"));
        return;
      }
      const elapsed = (now - startTime) / 1000;
      let frame = Math.floor(elapsed * fps);
      if (frame >= total) frame = total - 1;
      drawFrame(ctx, plan, brand, W, H, frame, fps);
      onProgress(clamp01(frame / (total - 1)));
      if (elapsed * fps >= total) {
        resolve();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });

  // capture trailing frame
  await new Promise((r) => setTimeout(r, 250));
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  await stopped;

  onProgress(1);
  const blob = new Blob(chunks, { type: mime });
  const ext = mime.includes("mp4") ? "mp4" : "webm";
  return { blob, mime, ext, durationMs: performance.now() - startTime };
};

export const safeFileName = (title, ext) => {
  const base = (title || "roll-studio-broll")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "roll-studio-broll"}.${ext}`;
};

export const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
