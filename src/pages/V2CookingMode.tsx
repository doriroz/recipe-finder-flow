import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChefHat, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGoBack } from "@/hooks/useGoBack";
import { useRecipe } from "@/hooks/useRecipes";
import { mockRecipe } from "@/data/mockData";
import type { RecipeIngredient } from "@/types/recipe";
import MiseEnPlace from "@/components/MiseEnPlace";
import V2StepSidebar from "@/components/v2cooking/V2StepSidebar";
import V2InstructionCard from "@/components/v2cooking/V2InstructionCard";
import V2KeepAwakeToggle from "@/components/v2cooking/V2KeepAwakeToggle";
import V2StickyTimer from "@/components/v2cooking/V2StickyTimer";
import type { ParsedTimer } from "@/lib/parseTimers";

/**
 * V2 Cooking Mode — isolated route at /v2-cooking-mode.
 * Mirrors the data contract of the legacy /cooking page (id query param
 * + optional acceptedSubstitutions in location.state).
 */
const V2CookingMode = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const recipeId = searchParams.get("id");

  // 0 = prep / mise-en-place; 1..N = cooking steps
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTimer, setActiveTimer] = useState<ParsedTimer | null>(null);
  const [showCheck, setShowCheck] = useState(false);

  const { data: recipe, isLoading } = useRecipe(recipeId !== "mock" ? recipeId : null);

  const acceptedSubs: { original: string; alternative: string }[] =
    (location.state as { acceptedSubstitutions?: { original: string; alternative: string }[] } | null)
      ?.acceptedSubstitutions || [];

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
          tip: undefined as string | undefined,
        }))
      : mockRecipe.steps;
  }, [recipe?.instructions, acceptedSubs]);

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
  const progress = currentStep === 0 ? 0 : Math.round((currentStep / totalSteps) * 100);

  const triggerCheck = () => {
    setShowCheck(true);
    window.setTimeout(() => setShowCheck(false), 650);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      triggerCheck();
      window.setTimeout(() => setCurrentStep((p) => p + 1), 180);
    } else {
      navigate(`/complete?id=${recipeId || "mock"}`);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  };

  const handleExit = () => {
    if (confirm("בטוח שאתם רוצים לצאת מהבישול?")) goBack();
  };

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">טוען מתכון...</p>
      </div>
    );
  }

  const activeStep = currentStep === 0 ? null : steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Brand Header */}
      <header
        className="relative z-20 shrink-0"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(28 95% 65%) 100%)",
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
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
            <span className="font-bold text-primary-foreground truncate max-w-[60vw]">{displayTitle}</span>
          </div>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 min-h-0">
        <V2StepSidebar totalSteps={totalSteps} currentStep={currentStep} onJump={(i) => setCurrentStep(i)} />

        <main className="flex-1 flex flex-col min-w-0">
          {/* Top utility bar */}
          <div className="border-b border-border bg-card/40">
            {/*py-3*/}
            <div className="max-w-3xl mx-auto w-full px-6 pt-[0.75rem] pb-[1rem] flex items-center gap-6">
              <div className="flex-1 flex items-center gap-3">
                <Progress value={progress} className="h-2" />
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{progress}%</span>
              </div>
              <V2KeepAwakeToggle />
            </div>
          </div>

          {/* Content area, centered relative to right container */}
          <div className="flex-1 overflow-y-auto pb-32">
            <div className="max-w-3xl mx-auto w-full px-6 py-10">
              <AnimatePresence mode="wait">
                {currentStep === 0 ? (
                  <motion.div
                    key="prep"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-card rounded-2xl shadow-md border border-border/60 px-6 py-8 md:px-10 md:py-10"
                  >
                    <MiseEnPlace ingredients={ingredients} onReady={() => setCurrentStep(1)} />
                  </motion.div>
                ) : (
                  <V2InstructionCard
                    key={`step-${currentStep}`}
                    stepNumber={activeStep!.number}
                    totalSteps={totalSteps}
                    title={activeStep!.title}
                    instruction={activeStep!.instruction}
                    tip={activeStep!.tip}
                    onStartTimer={(t) => setActiveTimer(t)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sticky timer */}
          {activeTimer && (
            <V2StickyTimer
              key={`${activeTimer.label}-${activeTimer.durationSeconds}`}
              durationSeconds={activeTimer.durationSeconds}
              label={activeTimer.label}
              onDismiss={() => setActiveTimer(null)}
            />
          )}

          {/* Bottom Nav: Next on LEFT, Prev on RIGHT (RTL layout) */}
          <footer className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-border">
            <div className="max-w-3xl mx-auto w-full px-6 py-3 flex gap-3">
              {/* In RTL, the LEFT visual position needs order-last */}
              <Button
                variant="outline"
                size="lg"
                className="flex-1 order-first"
                onClick={handlePrev}
                disabled={currentStep <= 0}
              >
                <ArrowRight className="w-5 h-5" />
                הקודם
              </Button>
              <Button variant="hero" size="lg" className="flex-1 order-last relative" onClick={handleNext}>
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
        </main>
      </div>

      {/* Checkmark feedback overlay */}
      <AnimatePresence>
        {showCheck && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="bg-secondary text-secondary-foreground rounded-full p-6 shadow-2xl">
              <Check className="w-12 h-12" strokeWidth={3} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default V2CookingMode;
