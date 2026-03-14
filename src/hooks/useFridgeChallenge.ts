import { supabase } from "@/integrations/supabase/client";

interface SaveChallengeParams {
  ingredientNames: string[];
  ingredientEmojis: string[];
  recipeId?: string;
  recipeTitle?: string;
}

export async function saveFridgeChallenge({
  ingredientNames,
  ingredientEmojis,
  recipeId,
  recipeTitle,
}: SaveChallengeParams) {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId || ingredientNames.length === 0) return;

    await supabase.from("fridge_challenges").insert({
      user_id: userId,
      ingredient_names: ingredientNames,
      ingredient_emojis: ingredientEmojis,
      recipe_id: recipeId || null,
      recipe_title: recipeTitle || null,
    });
    console.log("Fridge challenge saved");
  } catch (err) {
    console.error("Failed to save fridge challenge:", err);
  }
}
