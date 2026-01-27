import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Recipe, RecipeSubstitution, RecipeIngredient } from "@/types/recipe";
import type { Json } from "@/integrations/supabase/types";

// Helper to safely parse JSON fields
const parseIngredients = (json: Json): RecipeIngredient[] => {
  if (Array.isArray(json)) {
    return json as unknown as RecipeIngredient[];
  }
  return [];
};

const parseSubstitutions = (json: Json | null): RecipeSubstitution[] | null => {
  if (!json) return null;
  if (Array.isArray(json)) {
    return json as unknown as RecipeSubstitution[];
  }
  return null;
};

// Fetch all recipes for current user
export const useUserRecipes = () => {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        return [];
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((row): Recipe => ({
        id: row.id,
        title: row.title,
        ingredients: parseIngredients(row.ingredients),
        instructions: row.instructions,
        substitutions: parseSubstitutions(row.substitutions),
        cooking_time: row.cooking_time,
        user_id: row.user_id,
        created_at: row.created_at,
      }));
    },
  });
};

// Fetch single recipe by ID
export const useRecipe = (recipeId: string | null) => {
  return useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      if (!recipeId) return null;

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        ingredients: parseIngredients(data.ingredients),
        instructions: data.instructions,
        substitutions: parseSubstitutions(data.substitutions),
        cooking_time: data.cooking_time,
        user_id: data.user_id,
        created_at: data.created_at,
      } as Recipe;
    },
    enabled: !!recipeId,
  });
};

// Insert a new recipe
export const useInsertRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe: Omit<Recipe, "id" | "created_at">) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error("User must be logged in to save recipes");
      }

      const { data, error } = await supabase
        .from("recipes")
        .insert({
          title: recipe.title,
          ingredients: recipe.ingredients as unknown as Json,
          instructions: recipe.instructions,
          substitutions: recipe.substitutions as unknown as Json,
          cooking_time: recipe.cooking_time,
          user_id: session.session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
};
