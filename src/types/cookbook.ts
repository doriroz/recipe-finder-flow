// Cookbook types

import type { UserGalleryItem } from "./recipe";

export interface CookbookSettings {
  title: string;
  subtitle?: string;
  coverImage?: string;
  colorTheme: CookbookTheme;
  includeTableOfContents: boolean;
  includePersonalNotes: boolean;
}

export interface CookbookTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export const cookbookThemes: CookbookTheme[] = [
  {
    id: "cream",
    name: "קרם קלאסי",
    primary: "#8B7355",
    secondary: "#F5E6D3",
    accent: "#D4A574",
    background: "#FFFBF5",
  },
  {
    id: "sage",
    name: "ירוק מרווה",
    primary: "#6B7B6B",
    secondary: "#E8EDE8",
    accent: "#9CAF88",
    background: "#F7FAF7",
  },
  {
    id: "terracotta",
    name: "טרה-קוטה",
    primary: "#A0522D",
    secondary: "#FAE5D3",
    accent: "#CD853F",
    background: "#FFF8F0",
  },
  {
    id: "midnight",
    name: "כחול לילה",
    primary: "#2C3E50",
    secondary: "#ECF0F1",
    accent: "#3498DB",
    background: "#FAFBFC",
  },
];

export interface CookbookRecipe {
  galleryItem: UserGalleryItem;
  pageNumber: number;
  personalNote?: string;
}

export interface Cookbook {
  id: string;
  settings: CookbookSettings;
  recipes: CookbookRecipe[];
  createdAt: Date;
}

export type CookbookBuilderStep = "select" | "customize" | "preview" | "checkout";

export interface ExportOption {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export const exportOptions: ExportOption[] = [
  {
    id: "pdf",
    name: "עותק דיגיטלי (PDF)",
    description: "הורדה מיידית בפורמט PDF באיכות גבוהה",
    price: 0,
    icon: "📄",
  },
  {
    id: "softcover",
    name: "כריכה רכה",
    description: "ספר מודפס בכריכה רכה, משלוח עד 7 ימי עסקים",
    price: 89,
    icon: "📖",
  },
  {
    id: "hardcover",
    name: "כריכה קשה דלוקס",
    description: "ספר מודפס באיכות פרימיום עם כריכה קשה",
    price: 149,
    icon: "📚",
  },
];
