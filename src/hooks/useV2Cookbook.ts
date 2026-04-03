import { useState, useCallback } from "react";
import type { V2CookbookRecipe } from "@/types/v2cookbook";

const STORAGE_KEY = "v2-cookbook-recipes";

function loadRecipes(): V2CookbookRecipe[] {
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

function saveRecipes(recipes: V2CookbookRecipe[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export const useV2Cookbook = () => {
  const [recipes, setRecipes] = useState<V2CookbookRecipe[]>(loadRecipes);

  const addRecipe = useCallback((recipe: V2CookbookRecipe): { isDuplicate: boolean; existingTitle?: string } => {
    const existing = loadRecipes();
    const similar = existing.find(
      (r) => r.title.trim().toLowerCase() === recipe.title.trim().toLowerCase()
    );
    if (similar) {
      return { isDuplicate: true, existingTitle: similar.title };
    }
    const updated = [recipe, ...existing];
    saveRecipes(updated);
    setRecipes(updated);
    return { isDuplicate: false };
  }, []);

  const addRecipeForce = useCallback((recipe: V2CookbookRecipe) => {
    const existing = loadRecipes();
    const updated = [recipe, ...existing];
    saveRecipes(updated);
    setRecipes(updated);
  }, []);

  const removeRecipe = useCallback((id: string) => {
    const existing = loadRecipes();
    const updated = existing.filter((r) => r.id !== id);
    saveRecipes(updated);
    setRecipes(updated);
  }, []);

  const refresh = useCallback(() => {
    setRecipes(loadRecipes());
  }, []);

  return { recipes, addRecipe, addRecipeForce, removeRecipe, refresh };
};
