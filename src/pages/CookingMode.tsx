import { useState } from "react";
import { ArrowRight, ArrowLeft, X, ChefHat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import CookingStep from "@/components/CookingStep";
import StepProgress from "@/components/StepProgress";
import { useRecipe } from "@/hooks/useRecipes";
import { mockRecipe } from "@/data/mockData";

const CookingMode = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipeId = searchParams.get("id");
  const [currentStep, setCurrentStep] = useState(1);
  
  const { data: recipe, isLoading } = useRecipe(recipeId !== 'mock' ? recipeId : null);
  
  // Transform DB recipe instructions to steps format, or use mock
  const steps = recipe?.instructions 
    ? recipe.instructions.map((instruction, index) => ({
        number: index + 1,
        title: `שלב ${index + 1}`,
        instruction,
        tip: undefined,
      }))
    : mockRecipe.steps;
  
  const displayTitle = recipe?.title || mockRecipe.title;
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigate(`/complete?id=${recipeId || 'mock'}`);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleExit = () => {
    if (confirm("בטוח שאתם רוצים לצאת מהבישול?")) {
      navigate(`/recipe${recipeId ? `?id=${recipeId}` : ''}`);
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
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleExit}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-5 h-5" />
              יציאה
            </Button>
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground">{displayTitle}</span>
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
        <CookingStep 
          step={steps[currentStep - 1]} 
          totalSteps={totalSteps}
        />
      </main>

      {/* Navigation Buttons */}
      <footer className="bg-card border-t border-border p-4">
        <div className="container mx-auto flex gap-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ArrowRight className="w-5 h-5" />
            הקודם
          </Button>
          <Button
            variant="hero"
            size="lg"
            className="flex-1"
            onClick={handleNext}
          >
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
