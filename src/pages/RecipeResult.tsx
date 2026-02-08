import { useState } from "react";
import { ArrowRight, ChefHat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import RecipeCard, { RecipeCardData } from "@/components/RecipeCard";
import DifficultyTuning, { DifficultyLevel } from "@/components/DifficultyTuning";
import { useRecipe, useUserRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { mockRecipe } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RecipeResult = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const recipeId = searchParams.get("id");
  const { user, loading: authLoading } = useAuth();
  
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>("medium");
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Fetch specific recipe if ID provided, otherwise get latest user recipe
  const { data: specificRecipe, isLoading: loadingSpecific, refetch: refetchRecipe } = useRecipe(recipeId);
  const { data: userRecipes, isLoading: loadingRecipes, refetch: refetchUserRecipes } = useUserRecipes();
  
  const isLoading = authLoading || loadingSpecific || loadingRecipes;
  
  // Use specific recipe, or first user recipe, or fall back to mock
  const latestRecipe = userRecipes?.[0];
  const recipe = specificRecipe || latestRecipe;
  
  // Extract ingredients from current recipe for regeneration
  const getIngredientsFromRecipe = () => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing: any) => 
      typeof ing === 'string' ? ing : ing.name
    );
  };
  
  const handleDifficultyChange = async (difficulty: DifficultyLevel) => {
    if (difficulty === currentDifficulty || !user) {
      if (!user) {
        toast.error("יש להתחבר כדי לשנות רמת קושי");
        return;
      }
      return;
    }
    
    setIsRegenerating(true);
    setCurrentDifficulty(difficulty);
    
    try {
      const ingredients = getIngredientsFromRecipe();
      
      if (ingredients.length === 0) {
        toast.error("לא נמצאו מצרכים במתכון");
        setIsRegenerating(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke("generate-and-save-recipe", {
        body: { 
          ingredients,
          difficulty 
        },
      });
      
      if (error) {
        console.error("Regeneration error:", error);
        toast.error("שגיאה ביצירת המתכון. נסו שוב.");
        return;
      }
      
      if (data?.success && data?.recipe) {
        toast.success(`המתכון הותאם לרמת קושי ${difficulty === 'low' ? 'קלה' : difficulty === 'high' ? 'מאתגרת' : 'בינונית'}!`);
        // Navigate to new recipe
        setSearchParams({ id: data.recipe.id });
        refetchRecipe();
        refetchUserRecipes();
      }
    } catch (err) {
      console.error("Difficulty change error:", err);
      toast.error("שגיאה בלתי צפויה. נסו שוב.");
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Map difficulty to Hebrew display text
  const getDifficultyLabel = (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
      case "low": return "קל";
      case "high": return "מאתגר";
      default: return "בינוני";
    }
  };
  
  // Transform DB recipe to display format
  const displayRecipe = recipe ? {
    id: recipe.id,
    title: recipe.title,
    description: recipe.cooking_time 
      ? `מתכון מהיר ב-${recipe.cooking_time} דקות` 
      : "מתכון מותאם אישית",
    time: recipe.cooking_time ? `${recipe.cooking_time} דקות` : "30 דקות",
    difficulty: getDifficultyLabel(currentDifficulty),
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

            {/* Difficulty Tuning - Only show for logged in users with a real recipe */}
            {user && recipe && (
              <div className="max-w-2xl mx-auto mb-6 card-warm animate-fade-in">
                <DifficultyTuning
                  currentDifficulty={currentDifficulty}
                  onDifficultyChange={handleDifficultyChange}
                  isRegenerating={isRegenerating}
                />
              </div>
            )}

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
