import { useState, useMemo, useCallback } from "react";
import { Search, Camera, ChefHat, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ingredients as mockIngredients, type Ingredient } from "@/data/mockData";
import { useCustomIngredients } from "@/hooks/useCustomIngredients";
import { useGenerateRecipe } from "@/hooks/useGenerateRecipe";
import { useDailyTries } from "@/hooks/useDailyTries";
import GeneratingRecipeLoader from "@/components/GeneratingRecipeLoader";
import ImageUpload from "@/components/ImageUpload";
import CreditCounter from "@/components/CreditCounter";

import IngredientSearchInput from "@/components/ingredient-input/IngredientSearchInput";
import QuickPicksSection from "@/components/ingredient-input/QuickPicksSection";
import CategoryBrowser from "@/components/ingredient-input/CategoryBrowser";
import SelectedIngredientsSidebar from "@/components/ingredient-input/SelectedIngredientsSidebar";

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

  const canGenerate = selected.length >= 2;

  return (
    <div className="min-h-screen bg-muted" dir="rtl">
      {isGenerating && <GeneratingRecipeLoader />}

      <div className="flex min-h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold text-foreground">בריות מתכונים!</h1>
              </div>
              <CreditCounter />
            </div>
          </header>

          {/* Tabs */}
          <div className="bg-card border-b border-border">
            <div className="max-w-4xl mx-auto px-6 flex">
              <button
                onClick={() => setActiveTab("ingredients")}
                className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
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
                className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
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

          {/* Content */}
          <main className="flex-1 overflow-y-auto pb-32 md:pb-8">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">
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
            </div>
          </main>
        </div>

        {/* Desktop Sidebar — selected ingredients */}
        <div className="hidden md:block w-72 lg:w-80 shrink-0">
          <SelectedIngredientsSidebar
            selected={selected}
            onRemove={remove}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
          />
        </div>
      </div>

      {/* Mobile floating bottom bar */}
      {activeTab === "ingredients" && (
        <div className="md:hidden fixed bottom-16 inset-x-0 z-30 px-4 pb-3">
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-elevated p-3 space-y-2">
            {/* Chips row */}
            {selected.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {selected.map((ing) => (
                  <span
                    key={ing.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground border border-primary/20 shrink-0"
                  >
                    <span>{ing.emoji}</span>
                    <span>{ing.name}</span>
                    <button
                      onClick={() => remove(ing.id)}
                      className="mr-0.5 hover:text-destructive"
                      aria-label={`הסר ${ing.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <Button
              variant="hero"
              className="w-full"
              disabled={!canGenerate || isGenerating}
              onClick={handleGenerate}
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating
                ? "יוצר מתכון..."
                : `מצא לי מתכונים!`}
              {canGenerate && !isGenerating && (
                <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs mr-1">
                  {selected.length} מצרכים
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientInput;
