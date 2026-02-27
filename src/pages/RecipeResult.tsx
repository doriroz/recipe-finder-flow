import { useState, useEffect } from "react";
import { ArrowRight, ChefHat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import RecipeCard, { RecipeCardData } from "@/components/RecipeCard";
import RecipeCarousel from "@/components/RecipeCarousel";
import { useRecipe, useUserRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { mockRecipe } from "@/data/mockData";
import { calculateDifficulty } from "@/lib/calculateDifficulty";
import { RecipeResultItem } from "@/types/recipe";

const RecipeResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const recipeId = searchParams.get("id");
  const { user, loading: authLoading } = useAuth();

  // Pre-cooking session state
  const [cookingSessionActive, setCookingSessionActive] = useState(false);
  const [lockedRecipeId, setLockedRecipeId] = useState<string | null>(null);

  // Multi-recipe state from navigation
  const [recipeItems, setRecipeItems] = useState<RecipeResultItem[] | null>(null);

  // Legacy single-recipe state (backwards compat)
  const [whyItWorks, setWhyItWorks] = useState<string | undefined>();
  const [reliabilityScore, setReliabilityScore] = useState<"high" | "medium" | "creative">("medium");
  const [spoonacularVerified, setSpoonacularVerified] = useState(false);
  const [recipeSource, setRecipeSource] = useState<"local" | "ai" | "spoonacular" | undefined>();
  const [usedCount, setUsedCount] = useState<number | undefined>();
  const [missedCount, setMissedCount] = useState<number | undefined>();
  const [usedIngredientNames, setUsedIngredientNames] = useState<string[] | undefined>();

  // Parse navigation state
  useEffect(() => {
    const state = location.state as any | null;
    if (!state) return;

    // New multi-recipe format
    if (state.recipes && Array.isArray(state.recipes) && state.recipes.length > 0) {
      setRecipeItems(state.recipes);
      return;
    }

    // Legacy single-recipe format
    if (state.why_it_works) setWhyItWorks(state.why_it_works);
    if (state.reliability_score) setReliabilityScore(state.reliability_score);
    if (state.spoonacular_verified !== undefined) setSpoonacularVerified(state.spoonacular_verified);
    if (state.source) setRecipeSource(state.source);
    if (state.used_count !== undefined) setUsedCount(state.used_count);
    if (state.missed_count !== undefined) setMissedCount(state.missed_count);
    if (state.used_ingredient_names) setUsedIngredientNames(state.used_ingredient_names);
  }, [location.state]);

  // Fetch specific recipe if ID provided (legacy), otherwise get latest user recipe
  const { data: specificRecipe, isLoading: loadingSpecific } = useRecipe(recipeId);
  const { data: userRecipes, isLoading: loadingRecipes } = useUserRecipes();

  const isLoading = authLoading || (recipeItems === null && (loadingSpecific || loadingRecipes));

  const handleStartCooking = (selectedRecipeId: string) => {
    setCookingSessionActive(true);
    setLockedRecipeId(selectedRecipeId);
    navigate(`/cooking?id=${selectedRecipeId}`);
  };

  // If we have multi-recipe items from navigation, render carousel
  if (recipeItems && recipeItems.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {!cookingSessionActive && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/ingredients")}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  חזרה
                </Button>
              )}
              <div className="flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-primary" />
                <span className="font-bold text-foreground">מה שיש</span>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 pb-24">
          <RecipeCarousel recipeItems={recipeItems} onStartCooking={handleStartCooking} />
        </main>
      </div>
    );
  }

  // Legacy single-recipe flow
  const latestRecipe = userRecipes?.[0];
  const recipe = specificRecipe || latestRecipe;

  const computedDifficulty = recipe
    ? calculateDifficulty(recipe.instructions.length, recipe.ingredients.length, recipe.instructions)
    : "בינוני";

  const displayRecipe: RecipeCardData = recipe
    ? {
        id: recipe.id,
        title: recipe.title,
        description: recipe.cooking_time ? `מתכון מהיר ב-${recipe.cooking_time} דקות` : "מתכון מותאם אישית",
        time: recipe.cooking_time ? `${recipe.cooking_time} דקות` : "30 דקות",
        difficulty: computedDifficulty,
        servings: 4,
        image: "🍳",
        ingredients: recipe.ingredients,
        substitutions: (recipe.substitutions as any) || [],
        why_it_works: whyItWorks,
        reliability_score: reliabilityScore,
        spoonacular_verified: spoonacularVerified,
        source: recipeSource,
        used_count: usedCount,
        missed_count: missedCount,
        used_ingredient_names: usedIngredientNames,
      }
    : {
        id: mockRecipe.id,
        title: mockRecipe.title,
        description: mockRecipe.description,
        time: mockRecipe.time,
        difficulty: mockRecipe.difficulty,
        servings: mockRecipe.servings,
        image: mockRecipe.image,
        ingredients: mockRecipe.ingredients,
        substitutions: mockRecipe.substitutions,
      };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/ingredients")}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground">מה שיש</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">טוען מתכון...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-sage-light text-sage-dark px-4 py-2 rounded-full mb-4">
                <span>✨</span>
                <span className="font-medium">
                  {recipe ? "מצאנו מתכון מושלם!" : "מתכון לדוגמה"}
                </span>
              </div>
              {!user && (
                <p className="text-sm text-muted-foreground mt-2">
                  התחברו כדי לשמור מתכונים משלכם
                </p>
              )}
            </div>

            <RecipeCard
              recipe={displayRecipe}
              onStartCooking={() => handleStartCooking(recipe?.id || "mock")}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default RecipeResult;
