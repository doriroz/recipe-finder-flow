import { useState, useCallback } from "react";
import type { 
  CookbookSettings, 
  CookbookRecipe, 
  CookbookBuilderStep,
  CookbookTheme 
} from "@/types/cookbook";
import { cookbookThemes } from "@/types/cookbook";
import type { UserGalleryItem } from "@/types/recipe";

const defaultSettings: CookbookSettings = {
  title: "ספר המתכונים שלי",
  subtitle: "",
  colorTheme: cookbookThemes[0],
  includeTableOfContents: true,
  includePersonalNotes: true,
};

export const useCookbook = () => {
  const [step, setStep] = useState<CookbookBuilderStep>("select");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<CookbookRecipe[]>([]);
  const [settings, setSettings] = useState<CookbookSettings>(defaultSettings);

  const toggleSelection = useCallback((itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const selectAll = useCallback((items: UserGalleryItem[]) => {
    setSelectedItems(items.map((item) => item.id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const initializeRecipes = useCallback((galleryItems: UserGalleryItem[]) => {
    const selected = galleryItems.filter((item) => 
      selectedItems.includes(item.id)
    );
    const cookbookRecipes: CookbookRecipe[] = selected.map((item, index) => ({
      galleryItem: item,
      pageNumber: index + 1,
      personalNote: item.user_notes || "",
    }));
    setRecipes(cookbookRecipes);
  }, [selectedItems]);

  const reorderRecipes = useCallback((fromIndex: number, toIndex: number) => {
    setRecipes((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      // Update page numbers
      return updated.map((recipe, index) => ({
        ...recipe,
        pageNumber: index + 1,
      }));
    });
  }, []);

  const updateRecipeNote = useCallback((index: number, note: string) => {
    setRecipes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], personalNote: note };
      return updated;
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<CookbookSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateTheme = useCallback((theme: CookbookTheme) => {
    setSettings((prev) => ({ ...prev, colorTheme: theme }));
  }, []);

  const goToStep = useCallback((newStep: CookbookBuilderStep) => {
    setStep(newStep);
  }, []);

  const nextStep = useCallback(() => {
    const steps: CookbookBuilderStep[] = ["select", "customize", "preview", "checkout"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  }, [step]);

  const prevStep = useCallback(() => {
    const steps: CookbookBuilderStep[] = ["select", "customize", "preview", "checkout"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  }, [step]);

  const reset = useCallback(() => {
    setStep("select");
    setSelectedItems([]);
    setRecipes([]);
    setSettings(defaultSettings);
  }, []);

  return {
    step,
    selectedItems,
    recipes,
    settings,
    toggleSelection,
    selectAll,
    clearSelection,
    initializeRecipes,
    reorderRecipes,
    updateRecipeNote,
    updateSettings,
    updateTheme,
    goToStep,
    nextStep,
    prevStep,
    reset,
  };
};
