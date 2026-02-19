import { useState, useMemo, useCallback } from "react";
import { ArrowRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ingredients as mockIngredients, type Ingredient } from "@/data/mockData";
import { useCustomIngredients } from "@/hooks/useCustomIngredients";
import { useGenerateRecipe } from "@/hooks/useGenerateRecipe";
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
  const [showPhoto, setShowPhoto] = useState(false);
  const { customIngredients, addCustomIngredient } = useCustomIngredients();
  const { generateRecipe, isGenerating } = useGenerateRecipe();

  // Merge mock + custom, deduplicate by id
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
    if (imageBase64) {
      await generateRecipe({ imageBase64 });
    } else if (selected.length >= 2) {
      await generateRecipe({ ingredients: selected });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isGenerating && <GeneratingRecipeLoader />}

      {/* App Header */}
      <header className="bg-gradient-to-l from-primary/10 via-accent to-card border-b border-primary/20 shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-1 hover:bg-primary/10"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <CreditCounter />
              <span className="font-bold text-foreground">מה שיש 🍳</span>
              {/* Camera toggle moved into header */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPhoto((v) => !v)}
                className={showPhoto ? "text-primary" : "text-muted-foreground hover:text-primary"}
                title={showPhoto ? "חזרה לבחירת מצרכים" : "העלאת תמונה מהמקרר"}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed selected bar + CTA */}
      {!showPhoto && (
        <SelectedIngredientsBar
          selected={selected}
          onRemove={remove}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      )}

      <main className="container mx-auto px-4 py-4 space-y-4 pb-8">

        {showPhoto ? (
          /* Photo mode */
          <div className="max-w-md mx-auto space-y-4">
            <ImageUpload onImageSelect={setImageBase64} disabled={isGenerating} />
            {imageBase64 && (
              <Button
                variant="hero"
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                יצירת מתכון מהתמונה
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Smart Search */}
            <IngredientSearchInput
              allIngredients={allIngredients}
              selected={selected}
              onSelect={toggle}
              onAddCustom={handleAddCustom}
            />

            {/* Quick Picks */}
            <QuickPicksSection
              ingredients={allIngredients}
              selected={selected}
              onToggle={toggle}
            />

            {/* Category browser — modal handles both mobile & desktop */}
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
