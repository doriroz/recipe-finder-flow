import { useState, useMemo, useCallback } from "react";
import { ArrowRight, Camera, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ingredients as mockIngredients, type Ingredient } from "@/data/mockData";
import { useCustomIngredients } from "@/hooks/useCustomIngredients";
import { useGenerateRecipe } from "@/hooks/useGenerateRecipe";
import { useDailyTries } from "@/hooks/useDailyTries";
import GeneratingRecipeLoader from "@/components/GeneratingRecipeLoader";
import ImageUpload from "@/components/ImageUpload";
import CreditCounter from "@/components/CreditCounter";

import SelectedIngredientsBar from "@/components/ingredient-input/SelectedIngredientsBar";
import IngredientSearchInput from "@/components/ingredient-input/IngredientSearchInput";
import QuickPicksSection from "@/components/ingredient-input/QuickPicksSection";
import CategoryBrowser from "@/components/ingredient-input/CategoryBrowser";

const IngredientInput = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Ingredient[]>([]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ingredients" | "photo">("ingredients");
  const { customIngredients, addCustomIngredient } = useCustomIngredients();
  const { generateRecipe, isGenerating } = useGenerateRecipe();
  const { remaining: remainingTries } = useDailyTries();

  const allIngredients = useMemo<Ingredient[]>(() => {
    const custom = customIngredients.map((c) => ({
      ...c,
      popularityScore: 50,
    }));
    const ids = new Set(mockIngredients.map((i) => i.id));
    const uniqueCustom = custom.filter((c) => !ids.has(c.id));
    return [...mockIngredients, ...uniqueCustom];
  }, [customIngredients]);

  const toggle = useCallback((ingredient: Ingredient) => {
    setSelected((prev) => {
      const exists = prev.find((i) => i.id === ingredient.id);
      return exists ? prev.filter((i) => i.id !== ingredient.id) : [...prev, ingredient];
    });
  }, []);

  const remove = useCallback((id: number) => {
    setSelected((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleAddCustom = useCallback(
    (name: string) => {
      const newIng = addCustomIngredient(name, "🥗");
      const withScore: Ingredient = { ...newIng, popularityScore: 50 };
      setSelected((prev) =>
        prev.find((i) => i.id === newIng.id) ? prev : [...prev, withScore]
      );
    },
    [addCustomIngredient]
  );

  const handleGenerate = async () => {
    if (activeTab === "photo" && imageBase64) {
      await generateRecipe({ imageBase64 });
    } else if (selected.length >= 2) {
      await generateRecipe({ ingredients: selected });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isGenerating && <GeneratingRecipeLoader />}

      {/* App Header - Matching V2 Dashboard vibrant orange gradient */}
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
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <CreditCounter />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-primary-foreground">מה שיש</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-background border-b border-border" style={{ height: '48px' }}>
        <div className="container mx-auto px-4 flex">
          <button
            onClick={() => setActiveTab("ingredients")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "ingredients"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChefHat className="w-4 h-4" />
            בחירת מצרכים
          </button>
          <button
            onClick={() => setActiveTab("photo")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "photo"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera className="w-4 h-4" />
            📸 צילום המקרר
          </button>
        </div>
      </div>

      {/* Fixed selected bar + CTA (ingredients tab only) */}
      {activeTab === "ingredients" && (
        <SelectedIngredientsBar
          selected={selected}
          onRemove={remove}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          remainingTries={remainingTries}
        />
      )}

      <main className="container mx-auto px-4 py-4 space-y-4 pb-8">
        {activeTab === "photo" ? (
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-center space-y-1 py-2">
              <p className="text-lg font-semibold text-foreground">צלמו את המקרר שלכם 📸</p>
              <p className="text-sm text-muted-foreground">נזהה את המצרכים ונמצא לכם מתכון מושלם</p>
            </div>
            <ImageUpload onImageSelect={setImageBase64} disabled={isGenerating} />
            {imageBase64 && (
              <Button
                variant="hero"
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                יצירת מתכון מהתמונה ✨
              </Button>
            )}
          </div>
        ) : (
          <>
            <IngredientSearchInput
              allIngredients={allIngredients}
              selected={selected}
              onSelect={toggle}
              onAddCustom={handleAddCustom}
            />

            <QuickPicksSection
              ingredients={allIngredients}
              selected={selected}
              onToggle={toggle}
            />

            <CategoryBrowser
              ingredients={allIngredients}
              selected={selected}
              onToggle={toggle}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default IngredientInput;
