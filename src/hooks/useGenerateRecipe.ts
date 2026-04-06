import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { saveFridgeChallenge } from "./useFridgeChallenge";

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
  skipChallengeSave?: boolean;
}

export const useGenerateRecipe = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const generateRecipe = async ({ ingredients, imageBase64, forceCreative, skipChallengeSave }: GenerateRecipeOptions) => {
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
        let isTriesExhausted = false;
        try {
          // Try parsing the response body from context
          if (error.context) {
            let errorBody: any = null;
            if (typeof error.context.json === "function") {
              errorBody = await error.context.json().catch(() => null);
            }
            if (errorBody?.error) errorMessage = errorBody.error;
            if (errorBody?.tries_exhausted) isTriesExhausted = true;
          }
        } catch (e) {
          console.warn("Error parsing edge function response:", e);
          if (error.message && error.message !== "Edge Function returned a non-2xx status code") {
            errorMessage = error.message;
          }
        }

        if (isTriesExhausted) {
          toast.error("ניצלתם את 3 הניסיונות היומיים 🎯", {
            action: {
              label: "שדרוג",
              onClick: () => navigate("/upgrade"),
            },
            duration: 8000,
          });
          navigate("/upgrade");
          return;
        }

        if (errorMessage.includes("קרדיטים")) {
          toast.error(errorMessage, {
            action: {
              label: "שדרוג",
              onClick: () => navigate("/upgrade"),
            },
            duration: 8000,
          });
          navigate("/upgrade");
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      if (data?.tries_exhausted) {
        toast.error("ניצלתם את 3 הניסיונות היומיים 🎯", {
          action: {
            label: "שדרוג",
            onClick: () => navigate("/upgrade"),
          },
          duration: 8000,
        });
        navigate("/upgrade");
        return;
      }

      if (data?.error) {
        if (typeof data.error === "string" && data.error.includes("קרדיטים")) {
          toast.error(data.error, {
            action: {
              label: "שדרוג",
              onClick: () => navigate("/upgrade"),
            },
            duration: 8000,
          });
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data?.success) {
        if (data.noMatch) {
          navigate(`/recipe`, {
            state: {
              noMatch: true,
              message: data.message || "לא נמצאו מתכונים מתאימים למצרכים שבחרת",
              popularRecipes: data.popularRecipes || [],
              ingredientNames: ingredients?.map(i => i.name) || [],
            },
          });
          return;
        }

        toast.success("המתכון נוצר בהצלחה!");
        
        if (data.recipes && Array.isArray(data.recipes) && data.recipes.length > 0) {
          // Save fridge challenge
          const firstRecipe = data.recipes[0];
          if (ingredients && ingredients.length > 0 && !skipChallengeSave) {
            saveFridgeChallenge({
              ingredientNames: ingredients.map(i => i.name),
              ingredientEmojis: ingredients.map(i => i.emoji),
              recipeId: firstRecipe?.recipe?.id,
              recipeTitle: firstRecipe?.recipe?.title,
            });
          }

          navigate(`/recipe`, {
            state: {
              recipes: data.recipes,
              ingredientNames: ingredients?.map(i => i.name) || [],
            },
          });
        } else if (data.recipe) {
          // Save fridge challenge for single recipe
          if (ingredients && ingredients.length > 0 && !skipChallengeSave) {
            saveFridgeChallenge({
              ingredientNames: ingredients.map(i => i.name),
              ingredientEmojis: ingredients.map(i => i.emoji),
              recipeId: data.recipe.id,
              recipeTitle: data.recipe.title,
            });
          }

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
