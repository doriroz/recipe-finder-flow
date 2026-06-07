import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, X, ChefHat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useGoBack } from "@/hooks/useGoBack";
import CookingStep from "@/components/CookingStep";
import StepProgress from "@/components/StepProgress";
import IngredientReadinessCard from "@/components/IngredientReadinessCard";
import { useRecipe } from "@/hooks/useRecipes";
import { mockRecipe } from "@/data/mockData";
import type { RecipeIngredient } from "@/types/recipe";

const CookingMode = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const recipeId = searchParams.get("id");
  const [currentStep, setCurrentStep] = useState(1);

  const { data: recipe, isLoading } = useRecipe(recipeId !== "mock" ? recipeId : null);

  // Session-only ingredient swaps coming from the recipe screen.
  // Format: [{ original: "milk", alternative: "oat milk" }]. Not persisted.
  const acceptedSubs: { original: string; alternative: string }[] =
    (location.state as any)?.acceptedSubstitutions || [];

  // Transform DB recipe instructions to steps format, or use mock
  const steps = useMemo(() => {
    const applySwaps = (text: string) => {
      let out = text;
      for (const s of acceptedSubs) {
        if (!s.original) continue;
        out = out.split(s.original).join(s.alternative);
      }
      return out;
    };
    return recipe?.instructions
      ? recipe.instructions.map((instruction, index) => ({
          number: index + 1,
          title: `שלב ${index + 1}`,
          instruction: applySwaps(instruction),
          tip: undefined,
        }))
      : mockRecipe.steps;
  }, [recipe?.instructions, acceptedSubs]);

  // Ingredients for mise en place
  const ingredients: RecipeIngredient[] = useMemo(() => {
    const base: RecipeIngredient[] = recipe?.ingredients
      ? recipe.ingredients
      : mockRecipe.ingredients.map((s) => ({ name: s }));
    if (acceptedSubs.length === 0) return base;
    return base.map((ing) => {
      const swap = acceptedSubs.find((s) => s.original && ing.name?.includes(s.original));
      return swap ? { ...ing, name: ing.name.replace(swap.original, swap.alternative) } : ing;
    });
  }, [recipe?.ingredients, acceptedSubs]);

  const displayTitle = recipe?.title || mockRecipe.title;
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      navigate(`/complete?id=${recipeId || "mock"}`);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleExit = () => {
    if (confirm("בטוח שאתם רוצים לצאת מהבישול?")) {
      goBack();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">טוען מתכון...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}

      {/*className="bg-card border-b border-border"*/}
      {/*
      <header
        className="relative z-20 shrink-0"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(28 95% 65%) 100%)",
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleExit} className="text-destructive hover:text-destructive">
              <X className="w-5 h-5" />
              יציאה
            </Button>
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground">{displayTitle}</span>
            </div>
          </div>
        </div>
      </header>*/}

      <header
        className="relative z-20"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(28 95% 65%) 100%)",
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="flex items-center gap-1 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowRight className="w-4 h-4" />
              יציאה
            </Button>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
              <span className="font-bold text-primary-foreground">{displayTitle}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-card border-b border-border py-4">
        <div className="container mx-auto px-4">
          <StepProgress currentStep={currentStep} totalSteps={totalSteps} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {currentStep === 1 && <IngredientReadinessCard ingredients={ingredients} />}

        <CookingStep step={steps[currentStep - 1]} totalSteps={totalSteps} />
      </main>

      {/* Navigation Buttons */}
      <footer className="bg-card border-t border-border p-4">
        <div className="container mx-auto flex gap-4">
          <Button variant="outline" size="lg" className="flex-1" onClick={handlePrev} disabled={currentStep <= 1}>
            <ArrowRight className="w-5 h-5" />
            הקודם
          </Button>
          <Button variant="hero" size="lg" className="flex-1" onClick={handleNext}>
            {currentStep === totalSteps ? (
              <>
                סיימתי!
                <span>🎉</span>
              </>
            ) : (
              <>
                הבא
                <ArrowLeft className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default CookingMode;
