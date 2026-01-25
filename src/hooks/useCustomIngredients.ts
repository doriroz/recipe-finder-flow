import { useState, useEffect } from "react";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
}

const STORAGE_KEY = "custom_ingredients";

export const useCustomIngredients = () => {
  const [customIngredients, setCustomIngredients] = useState<Ingredient[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCustomIngredients(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse custom ingredients:", e);
      }
    }
  }, []);

  // Save to localStorage whenever customIngredients changes
  useEffect(() => {
    if (customIngredients.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customIngredients));
    }
  }, [customIngredients]);

  const addCustomIngredient = (name: string): Ingredient => {
    const trimmedName = name.trim();
    
    // Check if already exists
    const existing = customIngredients.find(
      (ing) => ing.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    // Generate unique ID (higher than mock data to avoid conflicts)
    const maxId = Math.max(
      1000,
      ...customIngredients.map((ing) => ing.id)
    );
    
    const newIngredient: Ingredient = {
      id: maxId + 1,
      name: trimmedName,
      emoji: "🥗", // Default emoji for custom ingredients
      category: "מותאם אישית",
    };

    setCustomIngredients((prev) => {
      const updated = [...prev, newIngredient];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return newIngredient;
  };

  const removeCustomIngredient = (id: number) => {
    setCustomIngredients((prev) => {
      const updated = prev.filter((ing) => ing.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return {
    customIngredients,
    addCustomIngredient,
    removeCustomIngredient,
  };
};
