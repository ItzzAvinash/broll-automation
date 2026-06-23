// Editor options consistent with backend llm_service.py vocabulary

export const MOTION_STYLES = [
  "Static",
  "Slow Push",
  "Pan Left",
  "Pan Right",
  "Zoom In",
  "Zoom Out",
  "Parallax",
  "Whip Cut",
  "Cinematic Crane",
  "Dolly",
];

export const KEYWORD_REASONS = [
  { id: "emotional", label: "Emotional" },
  { id: "business", label: "Business" },
  { id: "marketing", label: "Marketing" },
  { id: "product", label: "Product" },
  { id: "statistic", label: "Statistic" },
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "urgency", label: "Urgency" },
  { id: "transformation", label: "Transformation" },
  { id: "visual", label: "Visual" },
];

export const REASON_STYLES = {
  emotional: "from-rose-500/15 to-rose-500/0 border-rose-300/20 text-rose-200",
  business: "from-amber-500/15 to-amber-500/0 border-amber-300/20 text-amber-200",
  marketing: "from-violet-500/15 to-violet-500/0 border-violet-300/20 text-violet-200",
  product: "from-cyan-500/15 to-cyan-500/0 border-cyan-300/20 text-cyan-200",
  statistic: "from-emerald-500/15 to-emerald-500/0 border-emerald-300/20 text-emerald-200",
  problem: "from-orange-500/15 to-orange-500/0 border-orange-300/20 text-orange-200",
  solution: "from-teal-500/15 to-teal-500/0 border-teal-300/20 text-teal-200",
  urgency: "from-red-500/15 to-red-500/0 border-red-300/20 text-red-200",
  transformation: "from-indigo-500/15 to-indigo-500/0 border-indigo-300/20 text-indigo-200",
  visual: "from-zinc-400/15 to-zinc-400/0 border-zinc-300/20 text-zinc-200",
};

export const ASSET_TYPES = ["video", "image", "graphic"];
export const PLACEMENTS = ["background", "overlay", "lower-third", "cutaway", "transition"];
export const PRIORITIES = ["high", "medium", "low"];

export const PRIORITY_BADGE = {
  high: "bg-white text-black",
  medium: "bg-white/15 text-white",
  low: "bg-white/5 text-zinc-400",
};
