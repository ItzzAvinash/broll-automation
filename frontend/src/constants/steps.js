import {
  Frame,
  Palette,
  ScrollText,
  Sparkles,
  Film,
  Download,
} from "lucide-react";

export const STEPS = [
  {
    id: 1,
    slug: "ratio",
    path: "/ratio",
    title: "Ratio",
    subtitle: "Aspect & format",
    icon: Frame,
  },
  {
    id: 2,
    slug: "brand",
    path: "/brand",
    title: "Brand Deck",
    subtitle: "Identity & palette",
    icon: Palette,
  },
  {
    id: 3,
    slug: "script",
    path: "/script",
    title: "Script",
    subtitle: "Paste your copy",
    icon: ScrollText,
  },
  {
    id: 4,
    slug: "analysis",
    path: "/analysis",
    title: "AI Analysis",
    subtitle: "Keywords & beats",
    icon: Sparkles,
  },
  {
    id: 5,
    slug: "preview",
    path: "/preview",
    title: "Preview",
    subtitle: "Editor & timeline",
    icon: Film,
  },
  {
    id: 6,
    slug: "export",
    path: "/export",
    title: "Export",
    subtitle: "Render & download",
    icon: Download,
  },
];

export const FIRST_PATH = STEPS[0].path;
