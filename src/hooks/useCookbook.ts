import { useState, useCallback, useEffect } from "react";
import type { 
  CookbookSettings, 
  CookbookRecipe, 
  CookbookBuilderStep,
  CookbookTheme 
} from "@/types/cookbook";
import { cookbookThemes } from "@/types/cookbook";
import type { UserGalleryItem } from "@/types/recipe";

interface CookbookDraft {
  userId: string;
  step: CookbookBuilderStep;
  selectedItems: string[];
  recipeOrder: string[];
  personalNotes: Record<string, string>;
  settings: CookbookSettings;
  savedAt: string;
}

const defaultSettings: CookbookSettings = {
  title: "ספר המתכונים שלי",
  subtitle: "",
  colorTheme: cookbookThemes[0],
  includeTableOfContents: true,
  includePersonalNotes: true,
};

const loadDraft = (userId: string): CookbookDraft | null => {
  try {
    const raw = localStorage.getItem(`cookbook_draft_${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as CookbookDraft;
  } catch {
    return null;
  }
};

export const useCookbook = (userId?: string) => {
  const [step, setStep] = useState<CookbookBuilderStep>("select");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<CookbookRecipe[]>([]);
  const [settings, setSettings] = useState<CookbookSettings>(defaultSettings);

  // Derived draft state
  const draft = userId ? loadDraft(userId) : null;
  const hasDraft = !!draft;
  const draftSavedAt = draft?.savedAt ?? null;

  // Auto-save effect (debounced 500ms)
  useEffect(() => {
    if (!userId) return;
    // Only save if something meaningful has been done (at least one item selected or not on the default step)
    if (selectedItems.length === 0 && step === "select") return;

    const draftData: CookbookDraft = {
      userId,
      step,
      selectedItems,
      recipeOrder: recipes.map((r) => r.galleryItem.id),
      personalNotes: Object.fromEntries(
        recipes.map((r) => [r.galleryItem.id, r.personalNote || ""])
      ),
      settings,
      savedAt: new Date().toISOString(),
    };
    const timer = setTimeout(() => {
      localStorage.setItem(`cookbook_draft_${userId}`, JSON.stringify(draftData));
    }, 500);
    return () => clearTimeout(timer);
  }, [step, selectedItems, recipes, settings, userId]);

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

  const clearDraft = useCallback(() => {
    if (userId) localStorage.removeItem(`cookbook_draft_${userId}`);
    reset();
  }, [userId, reset]);

  const resumeDraft = useCallback((galleryItems: UserGalleryItem[]) => {
    if (!userId) return;
    const saved = loadDraft(userId);
    if (!saved) return;

    setSelectedItems(saved.selectedItems);
    setSettings(saved.settings);

    // Re-hydrate full recipe objects from gallery + restore notes and order
    const orderedRecipes = saved.recipeOrder
      .map((id, index) => {
        const item = galleryItems.find((g) => g.id === id);
        if (!item) return null;
        return {
          galleryItem: item,
          pageNumber: index + 1,
          personalNote: saved.personalNotes[id] || "",
        };
      })
      .filter(Boolean) as CookbookRecipe[];

    setRecipes(orderedRecipes);
    setStep(saved.step);
  }, [userId]);

  return {
    step,
    selectedItems,
    recipes,
    settings,
    hasDraft,
    draftSavedAt,
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
    clearDraft,
    resumeDraft,
  };
};
