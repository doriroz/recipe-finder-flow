import { useState, useEffect } from "react";
import { ArrowRight, ChefHat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import RecipeCard, { RecipeCardData } from "@/components/RecipeCard";
import { useRecipe, useUserRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { mockRecipe } from "@/data/mockData";
import { calculateDifficulty } from "@/lib/calculateDifficulty";

const RecipeResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const recipeId = searchParams.get("id");
  const { user, loading: authLoading } = useAuth();

  const [whyItWorks, setWhyItWorks] = useState<string | undefined>();
  const [reliabilityScore, setReliabilityScore] = useState<"high" | "medium" | "creative">("medium");
  const [spoonacularVerified, setSpoonacularVerified] = useState(false);

  // Pick up why_it_works, reliability_score, and spoonacular_verified from navigation state
  useEffect(() => {
    const state = location.state as {
      why_it_works?: string;
      reliability_score?: string;
      spoonacular_verified?: boolean;
    } | null;
    if (state?.why_it_works) setWhyItWorks(state.why_it_works);
    if (state?.reliability_score) setReliabilityScore(state.reliability_score as any);
    if (state?.spoonacular_verified !== undefined) setSpoonacularVerified(state.spoonacular_verified);
  }, [location.state]);

  // Fetch specific recipe if ID provided, otherwise get latest user recipe
  const { data: specificRecipe, isLoading: loadingSpecific } = useRecipe(recipeId);
  const { data: userRecipes, isLoading: loadingRecipes } = useUserRecipes();

  const isLoading = authLoading || loadingSpecific || loadingRecipes;

  // Use specific recipe, or first user recipe, or fall back to mock
  const latestRecipe = userRecipes?.[0];
  const recipe = specificRecipe || latestRecipe;

  /**
   * Compute difficulty locally from the recipe's own data:
   *   - number of instruction steps
   *   - number of ingredients
   *   - presence of advanced cooking technique keywords
   */
  const computedDifficulty = recipe ?
  calculateDifficulty(
    recipe.instructions.length,
    recipe.ingredients.length,
    recipe.instructions
  ) :
  "בינוני";

  // Transform DB recipe to display format
  const displayRecipe: RecipeCardData = recipe ?
  {
    id: recipe.id,
    title: recipe.title,
    description: recipe.cooking_time ?
    `מתכון מהיר ב-${recipe.cooking_time} דקות` :
    "מתכון מותאם אישית",
    time: recipe.cooking_time ? `${recipe.cooking_time} דקות` : "30 דקות",
    // ← Locally calculated, no AI call
    difficulty: computedDifficulty,
    servings: 4,
    image: "🍳",
    // Pass structured ingredients directly — RecipeCard handles both formats
    ingredients: recipe.ingredients,
    substitutions: recipe.substitutions as any || [],
    why_it_works: whyItWorks,
    reliability_score: reliabilityScore,
    spoonacular_verified: spoonacularVerified
  } :
  {
    // Fallback to mock data when no recipes exist
    id: mockRecipe.id,
    title: mockRecipe.title,
    description: mockRecipe.description,
    time: mockRecipe.time,
    difficulty: mockRecipe.difficulty,
    servings: mockRecipe.servings,
    image: mockRecipe.image,
    ingredients: mockRecipe.ingredients,
    substitutions: mockRecipe.substitutions
  };

  const handleStartCooking = () => {
    const id = recipe?.id || "mock";
    navigate(`/cooking?id=${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/ingredients")}
              className="flex items-center gap-2">

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
        {isLoading ?
        <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">טוען מתכון...</p>
          </div> :

        <>
            {/* Title */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-sage-light text-sage-dark px-4 py-2 rounded-full mb-4">
                <span>✨</span>
                <span className="font-medium">
                  {recipe ? "מצאנו מתכון מושלם!" : "מתכון לדוגמה"}
                </span>
              </div>
              {!user &&
            <p className="text-sm text-muted-foreground mt-2">
                  התחברו כדי לשמור מתכונים משלכם
                </p>
            }
            </div>

            {/* Difficulty badge — informational only, no regeneration */}
            {recipe &&
          <div className="max-w-2xl mx-auto mb-6 animate-fade-in">
                <div className="card-warm flex items-center justify-between bg-orange-50">
                  <span className="text-sm font-medium text-foreground">רמת קושי</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
              computedDifficulty === "קל" ?
              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
              computedDifficulty === "מאתגר" ?
              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
              "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}`
              }>
                    {computedDifficulty === "קל" && "⭐"}
                    {computedDifficulty === "בינוני" && "⭐⭐"}
                    {computedDifficulty === "מאתגר" && "⭐⭐⭐"}
                    {" "}{computedDifficulty}
                  </span>
                </div>
              </div>
          }

            {/* Recipe Card */}
            <RecipeCard recipe={displayRecipe} onStartCooking={handleStartCooking} />
          </>
        }
      </main>
    </div>);

};

export default RecipeResult;