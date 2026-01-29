import { ArrowRight, ChefHat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import RecipeCard, { RecipeCardData } from "@/components/RecipeCard";
import { useRecipe, useUserRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { mockRecipe } from "@/data/mockData";

const RecipeResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipeId = searchParams.get("id");
  const { user, loading: authLoading } = useAuth();
  
  // Fetch specific recipe if ID provided, otherwise get latest user recipe
  const { data: specificRecipe, isLoading: loadingSpecific } = useRecipe(recipeId);
  const { data: userRecipes, isLoading: loadingRecipes } = useUserRecipes();
  
  const isLoading = authLoading || loadingSpecific || loadingRecipes;
  
  // Use specific recipe, or first user recipe, or fall back to mock
  const latestRecipe = userRecipes?.[0];
  const recipe = specificRecipe || latestRecipe;
  
  // Transform DB recipe to display format
  const displayRecipe = recipe ? {
    id: recipe.id,
    title: recipe.title,
    description: recipe.cooking_time 
      ? `מתכון מהיר ב-${recipe.cooking_time} דקות` 
      : "מתכון מותאם אישית",
    time: recipe.cooking_time ? `${recipe.cooking_time} דקות` : "30 דקות",
    difficulty: "בינוני",
    servings: 4,
    image: "🍳",
    ingredients: recipe.ingredients.map(ing => 
      typeof ing === 'string' ? ing : `${ing.amount || ''} ${ing.unit || ''} ${ing.name}`.trim()
    ),
    substitutions: recipe.substitutions || [],
  } : {
    // Fallback to mock data when no recipes exist
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

  const handleStartCooking = () => {
    const id = recipe?.id || 'mock';
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
            {/* Title */}
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

            {/* Recipe Card */}
            <RecipeCard 
              recipe={displayRecipe} 
              onStartCooking={handleStartCooking}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default RecipeResult;
