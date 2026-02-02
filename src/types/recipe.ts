// Recipe types matching Supabase schema

export interface RecipeSubstitution {
  original: string;
  alternative: string;
  reason: string;
}

export interface RecipeIngredient {
  name: string;
  amount?: string;
  unit?: string;
}

export interface RecipeStep {
  number: number;
  title: string;
  instruction: string;
  tip?: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  substitutions: RecipeSubstitution[] | null;
  cooking_time: number | null;
  user_id: string | null;
  created_at: string | null;
}

// For display purposes - extended with computed fields
export interface RecipeDisplay extends Recipe {
  description?: string;
  difficulty?: string;
  servings?: number;
  image?: string;
  steps?: RecipeStep[];
}

// User gallery item matching Supabase schema
export interface UserGalleryItem {
  id: string;
  user_id: string | null;
  recipe_id: string | null;
  image_url: string;
  user_notes: string | null;
  created_at: string | null;
  // Joined data - partial recipe for gallery display
  recipe?: {
    id: string;
    title: string;
    ingredients?: RecipeIngredient[];
    instructions?: string[];
    cooking_time?: number | null;
    substitutions?: RecipeSubstitution[] | null;
  } | null;
}
