// V2 Digital Cookbook types

export type RecipeSource = "ai" | "heritage" | "library";

export interface V2CookbookRecipe {
  id: string;
  title: string;
  description?: string;
  story?: string;
  ingredients: string[];
  instructions: string[];
  cookingTime?: number;
  difficulty?: string;
  source: RecipeSource;
  sourceLabel: string;
  heritageImageUrl?: string;
  ocrText?: string;
  cuisineCategory?: string;
  tips?: string[];
  ratings?: number[];
  createdAt: Date;
}

export const SOURCE_BADGES: Record<RecipeSource, { label: string; emoji: string; color: string }> = {
  ai: { label: "עוזר AI", emoji: "🤖", color: "bg-accent text-accent-foreground" },
  heritage: { label: "זיכרון משפחתי", emoji: "👵", color: "bg-sage-light text-sage-dark" },
  library: { label: "מהמטבח העולמי", emoji: "🌍", color: "bg-orange-light text-orange-dark" },
};
