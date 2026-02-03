import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SearchRecipeResult {
  id: string;
  title: string;
  ingredients: { name: string; amount?: string; unit?: string }[];
  instructions: string[];
  substitutions: { original: string; alternative: string; reason: string }[] | null;
  cooking_time: number | null;
  difficulty: string;
  source: "existing" | "generated";
}

export const useRecipeSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchRecipeResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string): Promise<SearchRecipeResult[]> => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return [];
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("יש להתחבר כדי לחפש מתכונים");
      }

      const response = await supabase.functions.invoke("search-recipe", {
        body: { query: query.trim() },
      });

      if (response.error) {
        throw new Error(response.error.message || "שגיאה בחיפוש");
      }

      const searchResults = response.data?.results || [];
      setResults(searchResults);
      return searchResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "שגיאה בחיפוש";
      setError(errorMessage);
      setResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const saveGeneratedRecipe = async (recipe: SearchRecipeResult): Promise<string | null> => {
    if (recipe.source === "existing") {
      return recipe.id;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error("יש להתחבר כדי לשמור מתכון");
      }

      const { data, error: insertError } = await supabase
        .from("recipes")
        .insert({
          title: recipe.title,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          substitutions: recipe.substitutions,
          cooking_time: recipe.cooking_time,
          user_id: session.session.user.id,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      return data?.id || null;
    } catch (err) {
      console.error("Failed to save recipe:", err);
      return null;
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return {
    search,
    saveGeneratedRecipe,
    clearResults,
    isSearching,
    results,
    error,
  };
};
