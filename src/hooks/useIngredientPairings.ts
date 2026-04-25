import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getEnglishNames, fuzzyMatchHebrew } from "@/lib/ingredientI18n";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
  popularityScore: number;
}

interface PairingResult {
  /** Categories that contain at least one paired ingredient */
  relatedCategories: Set<string>;
  /** IDs of locally-known ingredients that pair well with the current selection */
  pairedIngredientIds: Set<number>;
  /** Per-paired-ingredient: which selected source it pairs with (Hebrew name) */
  pairingSources: Map<number, string>;
  isLoading: boolean;
  hasSelection: boolean;
}

interface CachedPayload {
  relatedCategories: Set<string>;
  pairedIngredientIds: Set<number>;
  pairingSources: Map<number, string>;
  topPairing?: { source: string; pairing: string };
}

export function useIngredientPairings(
  selectedIngredients: Ingredient[],
  allIngredients: Ingredient[]
): PairingResult {
  const [relatedCategories, setRelatedCategories] = useState<Set<string>>(new Set());
  const [pairedIngredientIds, setPairedIngredientIds] = useState<Set<number>>(new Set());
  const [pairingSources, setPairingSources] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const cacheRef = useRef<Map<string, CachedPayload>>(new Map());
  const lastToastKeyRef = useRef<string>("");

  const applyPayload = useCallback((payload: CachedPayload, cacheKey: string) => {
    setRelatedCategories(payload.relatedCategories);
    setPairedIngredientIds(payload.pairedIngredientIds);
    setPairingSources(payload.pairingSources);
    // Premium chef tip toast — once per unique pairing key
    if (payload.topPairing && lastToastKeyRef.current !== cacheKey) {
      lastToastKeyRef.current = cacheKey;
      const { source, pairing } = payload.topPairing;
      toast(`👨‍🍳 טיפ של השף`, {
        description: `${source} משתלב נהדר עם ${pairing}`,
        duration: 4000,
      });
    }
  }, []);

  const fetchPairings = useCallback(
    async (ingredients: Ingredient[]) => {
      if (ingredients.length === 0) {
        setRelatedCategories(new Set());
        setPairedIngredientIds(new Set());
        setPairingSources(new Map());
        lastToastKeyRef.current = "";
        return;
      }

      const cacheKey = ingredients
        .map((i) => i.name)
        .sort()
        .join(",");
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        applyPayload(cached, cacheKey);
        return;
      }

      // Translate selected Hebrew names to English for Spoonacular
      const englishNames: string[] = [];
      const englishToSourceHe = new Map<string, string>();
      for (const ing of ingredients) {
        const ens = getEnglishNames(ing.name);
        if (ens.length > 0) {
          englishNames.push(ens[0]);
          englishToSourceHe.set(ens[0].toLowerCase(), ing.name);
        }
      }

      if (englishNames.length === 0) {
        // No translatable items — only highlight categories of selected items
        const categories = new Set<string>(ingredients.map((i) => i.category));
        const payload: CachedPayload = {
          relatedCategories: categories,
          pairedIngredientIds: new Set(),
          pairingSources: new Map(),
        };
        cacheRef.current.set(cacheKey, payload);
        applyPayload(payload, cacheKey);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ingredient-pairings", {
          body: { ingredientNames: englishNames },
        });

        if (error || !data) {
          console.error("Pairings fetch error:", error);
          setRelatedCategories(new Set(ingredients.map((i) => i.category)));
          setPairedIngredientIds(new Set());
          setPairingSources(new Map());
          return;
        }

        const pairings: Array<{ name: string; count: number; aisle?: string }> =
          data.pairings || [];

        const categories = new Set<string>(ingredients.map((i) => i.category));
        const pairedIds = new Set<number>();
        const sources = new Map<number, string>();
        const selectedIds = new Set(ingredients.map((i) => i.id));
        let topPairing: { source: string; pairing: string } | undefined;

        // Take primary selected ingredient as the "source" attribution for the toast
        const primarySource = ingredients[ingredients.length - 1]?.name;

        for (const p of pairings) {
          const heName = fuzzyMatchHebrew(p.name);
          if (!heName) continue;
          const match = allIngredients.find((ai) => ai.name === heName);
          if (!match || selectedIds.has(match.id)) continue;
          pairedIds.add(match.id);
          categories.add(match.category);
          if (!sources.has(match.id) && primarySource) {
            sources.set(match.id, primarySource);
          }
          if (!topPairing && primarySource) {
            topPairing = { source: primarySource, pairing: heName };
          }
        }

        const payload: CachedPayload = {
          relatedCategories: categories,
          pairedIngredientIds: pairedIds,
          pairingSources: sources,
          topPairing,
        };
        cacheRef.current.set(cacheKey, payload);
        applyPayload(payload, cacheKey);
      } catch (err) {
        console.error("Pairings error:", err);
        setRelatedCategories(new Set(ingredients.map((i) => i.category)));
        setPairedIngredientIds(new Set());
        setPairingSources(new Map());
      } finally {
        setIsLoading(false);
      }
    },
    [allIngredients, applyPayload]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPairings(selectedIngredients);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedIngredients, fetchPairings]);

  return {
    relatedCategories,
    pairedIngredientIds,
    pairingSources,
    isLoading,
    hasSelection: selectedIngredients.length > 0,
  };
}
