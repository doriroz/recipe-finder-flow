import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
}

interface GenerateRecipeOptions {
  ingredients?: Ingredient[];
  imageBase64?: string;
  forceCreative?: boolean;
}

export const useGenerateRecipe = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const showCreditError = (message: string) => {
    toast.error(message, {
      action: {
        label: "חידוש קרדיטים",
        onClick: () => navigate("/profile"),
      },
      duration: 8000,
    });
  };

  const generateRecipe = async ({ ingredients, imageBase64, forceCreative }: GenerateRecipeOptions) => {
    setIsGenerating(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error("יש להתחבר כדי ליצור מתכון");
        navigate("/login");
        return;
      }

      const payload: { ingredients?: string[]; imageBase64?: string; forceCreative?: boolean } = {};
      
      if (forceCreative) {
        payload.forceCreative = true;
      }

      if (imageBase64) {
        payload.imageBase64 = imageBase64;
      } else if (ingredients && ingredients.length > 0) {
        payload.ingredients = ingredients.map((i) => i.name);
      } else {
        toast.error("יש לבחור מצרכים או להעלות תמונה");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-and-save-recipe", {
        body: payload,
      });

      if (error) {
        console.error("Edge function error:", error);
        let errorMessage = "שגיאה ביצירת המתכון. נסו שוב.";
        try {
          if (error.context && typeof error.context.json === "function") {
            const errorBody = await error.context.json();
            if (errorBody?.error) errorMessage = errorBody.error;
          }
        } catch (e) {
          // Response body may already be consumed
          if (error.message && error.message !== "Edge Function returned a non-2xx status code") {
            errorMessage = error.message;
          }
        }

        if (errorMessage.includes("קרדיטים")) {
          showCreditError(errorMessage);
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      if (data?.error) {
        if (typeof data.error === "string" && data.error.includes("קרדיטים")) {
          showCreditError(data.error);
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data?.success) {
        toast.success("המתכון נוצר בהצלחה!");
        
        // New multi-recipe format
        if (data.recipes && Array.isArray(data.recipes) && data.recipes.length > 0) {
          navigate(`/recipe`, {
            state: {
              recipes: data.recipes,
              ingredientNames: ingredients?.map(i => i.name) || [],
            },
          });
        } else if (data.recipe) {
          // Backwards compatibility - single recipe
          navigate(`/recipe?id=${data.recipe.id}`, {
            state: {
              why_it_works: data.why_it_works,
              reliability_score: data.reliability_score,
              spoonacular_verified: data.spoonacular_verified ?? false,
              source: data.source,
              used_count: data.used_count,
              missed_count: data.missed_count,
              used_ingredient_names: data.used_ingredient_names,
            },
          });
        }
      }
    } catch (err) {
      console.error("Generate recipe error:", err);
      toast.error("שגיאה בלתי צפויה. נסו שוב.");
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateRecipe, isGenerating };
};
