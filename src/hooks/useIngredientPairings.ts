import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
  popularityScore: number;
}

// Map Spoonacular aisles to Hebrew categories
const AISLE_TO_CATEGORY: Record<string, string[]> = {
  "Produce": ["ירקות", "פירות"],
  "Meat": ["חלבונים"],
  "Seafood": ["חלבונים"],
  "Dairy": ["חלבי"],
  "Milk, Eggs, Other Dairy": ["חלבי"],
  "Cheese": ["חלבי"],
  "Baking": ["דגנים"],
  "Bread": ["דגנים"],
  "Pasta and Rice": ["דגנים"],
  "Spices and Seasonings": ["תבלינים"],
  "Canned and Jarred": ["שימורים"],
  "Oil, Vinegar, Salad Dressing": ["שמנים"],
  "Condiments": ["תבלינים", "שמנים"],
  "Frozen": ["שימורים"],
};

function mapAislesToCategories(aisles: string[]): Set<string> {
  const categories = new Set<string>();
  for (const aisle of aisles) {
    // Try exact match
    if (AISLE_TO_CATEGORY[aisle]) {
      AISLE_TO_CATEGORY[aisle].forEach((c) => categories.add(c));
      continue;
    }
    // Try partial match
    for (const [key, cats] of Object.entries(AISLE_TO_CATEGORY)) {
      if (aisle.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(aisle.toLowerCase())) {
        cats.forEach((c) => categories.add(c));
      }
    }
  }
  return categories;
}

export function useIngredientPairings(
  selectedIngredients: Ingredient[],
  allIngredients: Ingredient[]
) {
  const [relatedCategories, setRelatedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const cacheRef = useRef<Map<string, Set<string>>>(new Map());

  const fetchPairings = useCallback(async (ingredients: Ingredient[]) => {
    if (ingredients.length === 0) {
      setRelatedCategories(new Set());
      return;
    }

    const cacheKey = ingredients.map((i) => i.name).sort().join(",");
    if (cacheRef.current.has(cacheKey)) {
      setRelatedCategories(cacheRef.current.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingredient-pairings", {
        body: { ingredientNames: ingredients.map((i) => i.name) },
      });

      if (error) {
        console.error("Pairings fetch error:", error);
        setRelatedCategories(new Set());
        return;
      }

      // Map aisles to Hebrew categories
      const categories = mapAislesToCategories(data.aisles || []);

      // Also try matching relatedIngredients to our local ingredient list
      const relatedNames: string[] = data.relatedIngredients || [];
      for (const ri of relatedNames) {
        const match = allIngredients.find(
          (ai) => ai.name.toLowerCase() === ri.toLowerCase()
        );
        if (match) categories.add(match.category);
      }

      // Always include categories of selected ingredients
      ingredients.forEach((i) => categories.add(i.category));

      cacheRef.current.set(cacheKey, categories);
      setRelatedCategories(categories);
    } catch (err) {
      console.error("Pairings error:", err);
      setRelatedCategories(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [allIngredients]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPairings(selectedIngredients);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedIngredients, fetchPairings]);

  return { relatedCategories, isLoading, hasSelection: selectedIngredients.length > 0 };
}
