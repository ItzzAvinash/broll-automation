// Realistic mock data used across the app (Phase 1 + Phase 2)

export const RATIOS = [
  {
    id: "16:9",
    label: "YouTube",
    sub: "Landscape · Web video",
    w: 16,
    h: 9,
    resolution: "1920 × 1080",
  },
  {
    id: "9:16",
    label: "Instagram",
    sub: "Vertical · Reels · Stories",
    w: 9,
    h: 16,
    resolution: "1080 × 1920",
  },
];

// Exactly two fonts. Gotham is commercial — we wire up a Gotham @font-face
// with Montserrat Italic as a graceful web fallback until a real Gotham
// woff2 is dropped into /public/fonts/.
export const FONT_OPTIONS = [
  {
    id: "times",
    label: "Times New Roman Italic",
    stack: "'Times New Roman', 'Times', serif",
    style: { fontStyle: "italic" },
  },
  {
    id: "gotham",
    label: "Gotham Italic",
    stack: "'Gotham', 'Montserrat', 'Helvetica Neue', sans-serif",
    style: { fontStyle: "italic" },
  },
];

// Helper: given a main font id, return the *other* one (used for keywords).
export const counterpartFontId = (mainId) =>
  mainId === "gotham" ? "times" : "gotham";

export const getFontById = (id) =>
  FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS[0];

export const DEFAULT_BRAND_DECK = {
  brandName: "Northwind Studio",
  // Primary = video background
  primary: "#0A0A0B",
  // Secondary = main text / font color
  secondary: "#FAFAFA",
  // Highlight = highlighted keywords / important text
  highlight: "#E4B8A0",
  // Main font (keyword font is derived as the counterpart)
  mainFont: "times",
  logoText: "NW",
};

export const SAMPLE_SCRIPT = `In a world that never stops moving, attention is the new currency.
Great brands don't shout — they show. They use motion, light, and rhythm to tell stories that linger.
This is how we build B-roll that earns the scroll: cinematic frames, intentional pacing, and a soundtrack that breathes with the visuals.
From the first cut to the final fade, every second is a deliberate choice.`;

// Mock B-roll thumbnails (from design guidelines media)
export const MOCK_BROLL = [
  "https://images.unsplash.com/photo-1544196538-6b0c1a2cd488?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHw0fHxjaW5lbWF0aWMlMjBjaXR5JTIwZHJvbmV8ZW58MHx8fHwxNzgyMjAzODkzfDA&ixlib=rb-4.1.0&q=85&w=900",
  "https://images.pexels.com/photos/8204363/pexels-photo-8204363.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.unsplash.com/photo-1752731904238-37ca976fd275?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBjaXR5JTIwZHJvbmV8ZW58MHx8fHwxNzgyMjAzODkzfDA&ixlib=rb-4.1.0&q=85&w=900",
  "https://images.pexels.com/photos/7653461/pexels-photo-7653461.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
];

export const MOCK_ANALYSIS = {
  headlines: [
    "Attention is the new currency.",
    "Great brands don't shout — they show.",
    "Every second is a deliberate choice.",
  ],
  // First word in each headline pair below is a highlight word in preview
  keywords: [
    "cinematic",
    "motion",
    "light",
    "rhythm",
    "storytelling",
    "pacing",
    "scroll",
    "brand",
    "soundtrack",
    "fade",
  ],
  brollIdeas: [
    { id: "b1", label: "Aerial city at dusk", duration: "2.4s", thumb: 0, tone: "Cinematic" },
    { id: "b2", label: "Slow-motion light flares", duration: "1.8s", thumb: 1, tone: "Abstract" },
    { id: "b3", label: "Hands sketching on paper", duration: "2.1s", thumb: 2, tone: "Editorial" },
    { id: "b4", label: "Drone reveal over coastline", duration: "2.6s", thumb: 3, tone: "Wide" },
  ],
};

export const MOCK_SCENES = [
  {
    id: "s1",
    index: 1,
    headline: "Attention is the new currency.",
    text: "In a world that never stops moving, attention is the new currency.",
    highlightWords: ["Attention", "currency"],
    duration: 3.2,
    broll: 0,
    transition: "Fade",
  },
  {
    id: "s2",
    index: 2,
    headline: "Don't shout — show.",
    text: "Great brands don't shout — they show. Motion, light, and rhythm tell the story.",
    highlightWords: ["show", "Motion"],
    duration: 3.6,
    broll: 1,
    transition: "Cut",
  },
  {
    id: "s3",
    index: 3,
    headline: "Cinematic by design.",
    text: "Cinematic frames, intentional pacing, a soundtrack that breathes with the visuals.",
    highlightWords: ["Cinematic", "soundtrack"],
    duration: 3.4,
    broll: 2,
    transition: "Dissolve",
  },
  {
    id: "s4",
    index: 4,
    headline: "Every second is a choice.",
    text: "From the first cut to the final fade, every second is a deliberate choice.",
    highlightWords: ["second", "choice"],
    duration: 2.8,
    broll: 3,
    transition: "Fade",
  },
];

export const EXPORT_PRESETS = [
  { id: "social", label: "Social — 1080p", sub: "MP4 · H.264 · 30fps", size: "~38 MB" },
  { id: "hq", label: "High Quality — 1080p", sub: "MP4 · H.264 · 60fps", size: "~72 MB" },
  { id: "master", label: "Master — 4K", sub: "MP4 · H.265 · 60fps", size: "~210 MB" },
];

// Brand letter-spacing rule: ALWAYS -2px on brand-styled text
export const BRAND_LETTER_SPACING = "-2px";
