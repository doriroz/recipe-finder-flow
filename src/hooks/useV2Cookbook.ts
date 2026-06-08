import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { V2CookbookRecipe, RecipeSource } from "@/types/v2cookbook";
import { SOURCE_BADGES } from "@/types/v2cookbook";

const STORAGE_KEY = "v2-cookbook-recipes";

// ---------- Local (guest) storage helpers ----------
function loadLocalRecipes(): V2CookbookRecipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((r: V2CookbookRecipe) => ({
      ...r,
      createdAt: new Date(r.createdAt),
    }));
  } catch {
    return [];
  }
}

function saveLocalRecipes(recipes: V2CookbookRecipe[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

// ---------- DB row <-> V2CookbookRecipe mapping ----------
type DbRow = {
  id: string;
  title: string;
  description: string | null;
  story: string | null;
  ingredients: unknown;
  instructions: unknown;
  cooking_time: number | null;
  difficulty: string | null;
  source: string;
  source_label: string | null;
  heritage_image_url: string | null;
  ocr_text: string | null;
  cuisine_category: string | null;
  tips: unknown;
  created_at: string;
};

function rowToRecipe(row: DbRow): V2CookbookRecipe {
  const source = (row.source as RecipeSource) || "ai";
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    story: row.story ?? undefined,
    ingredients: Array.isArray(row.ingredients) ? (row.ingredients as string[]) : [],
    instructions: Array.isArray(row.instructions) ? (row.instructions as string[]) : [],
    cookingTime: row.cooking_time ?? undefined,
    difficulty: row.difficulty ?? undefined,
    source,
    sourceLabel: row.source_label || SOURCE_BADGES[source]?.label || source,
    heritageImageUrl: row.heritage_image_url ?? undefined,
    ocrText: row.ocr_text ?? undefined,
    cuisineCategory: row.cuisine_category ?? undefined,
    tips: Array.isArray(row.tips) ? (row.tips as string[]) : undefined,
    createdAt: new Date(row.created_at),
  };
}

function recipeToRow(r: V2CookbookRecipe, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    title: r.title,
    description: r.description ?? null,
    story: r.story ?? null,
    ingredients: r.ingredients ?? [],
    instructions: r.instructions ?? [],
    cooking_time: r.cookingTime ?? null,
    difficulty: r.difficulty ?? null,
    source: r.source,
    source_label: r.sourceLabel ?? null,
    heritage_image_url: r.heritageImageUrl ?? null,
    ocr_text: r.ocrText ?? null,
    cuisine_category: r.cuisineCategory ?? null,
    tips: r.tips ?? [],
  };
}

export const useV2Cookbook = () => {
  const { user, loading: authLoading } = useAuth();
  const [recipes, setRecipes] = useState<V2CookbookRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch from DB when logged in; from localStorage when guest.
  const fetchRecipes = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);

    if (!user) {
      setRecipes(loadLocalRecipes());
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("v2_cookbook_recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[useV2Cookbook] fetch error:", error);
      setRecipes([]);
    } else {
      setRecipes((data as DbRow[]).map(rowToRecipe));
    }
    setLoading(false);
  }, [user, authLoading]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // ---- Mutations ----
  const addRecipe = useCallback(
    async (
      recipe: V2CookbookRecipe,
    ): Promise<{ isDuplicate: boolean; existingTitle?: string }> => {
      const titleNorm = recipe.title.trim().toLowerCase();

      if (!user) {
        const existing = loadLocalRecipes();
        const similar = existing.find((r) => r.title.trim().toLowerCase() === titleNorm);
        if (similar) {
          return { isDuplicate: true, existingTitle: similar.title };
        }
        const updated = [recipe, ...existing];
        saveLocalRecipes(updated);
        setRecipes(updated);
        return { isDuplicate: false };
      }

      // Logged in: check duplicates by title for this user
      const { data: dupes } = await supabase
        .from("v2_cookbook_recipes")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", recipe.title.trim());

      if (dupes && dupes.length > 0) {
        return { isDuplicate: true, existingTitle: dupes[0].title };
      }

      const row = recipeToRow(recipe, user.id);
      const { data, error } = await supabase
        .from("v2_cookbook_recipes")
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error("[useV2Cookbook] insert error:", error);
        throw error;
      }
      const inserted = rowToRecipe(data as DbRow);
      setRecipes((prev) => [inserted, ...prev]);
      return { isDuplicate: false };
    },
    [user],
  );

  const addRecipeForce = useCallback(
    async (recipe: V2CookbookRecipe) => {
      if (!user) {
        const existing = loadLocalRecipes();
        const updated = [recipe, ...existing];
        saveLocalRecipes(updated);
        setRecipes(updated);
        return;
      }
      const row = recipeToRow(recipe, user.id);
      const { data, error } = await supabase
        .from("v2_cookbook_recipes")
        .insert(row)
        .select()
        .single();
      if (error) {
        console.error("[useV2Cookbook] insert(force) error:", error);
        throw error;
      }
      const inserted = rowToRecipe(data as DbRow);
      setRecipes((prev) => [inserted, ...prev]);
    },
    [user],
  );

  const removeRecipe = useCallback(
    async (id: string) => {
      if (!user) {
        const existing = loadLocalRecipes();
        const updated = existing.filter((r) => r.id !== id);
        saveLocalRecipes(updated);
        setRecipes(updated);
        return;
      }
      const { error } = await supabase
        .from("v2_cookbook_recipes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        console.error("[useV2Cookbook] delete error:", error);
        throw error;
      }
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    },
    [user],
  );

  const updateRecipe = useCallback(
    async (id: string, patch: Partial<V2CookbookRecipe>) => {
      if (!user) {
        const existing = loadLocalRecipes();
        const updated = existing.map((r) => (r.id === id ? { ...r, ...patch } : r));
        saveLocalRecipes(updated);
        setRecipes(updated);
        return;
      }
      const dbPatch: Record<string, unknown> = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.story !== undefined) dbPatch.story = patch.story;
      if (patch.description !== undefined) dbPatch.description = patch.description;
      if (patch.ingredients !== undefined) dbPatch.ingredients = patch.ingredients;
      if (patch.instructions !== undefined) dbPatch.instructions = patch.instructions;
      if (patch.cookingTime !== undefined) dbPatch.cooking_time = patch.cookingTime;
      if (patch.heritageImageUrl !== undefined) dbPatch.heritage_image_url = patch.heritageImageUrl;
      const { data, error } = await supabase
        .from("v2_cookbook_recipes")
        .update(dbPatch)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) {
        console.error("[useV2Cookbook] update error:", error);
        throw error;
      }
      const updated = rowToRecipe(data as DbRow);
      setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
    },
    [user],
  );

  const refresh = useCallback(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return { recipes, loading, addRecipe, addRecipeForce, removeRecipe, updateRecipe, refresh };
};
