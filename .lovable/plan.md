## Problem
When the user selects **חלב** (milk), Spoonacular returns global recipes (cream sauces, beef stroganoff, chicken alfredo, etc.) and the system surfaces **בשר טחון / עוף** as recommended pairings. This breaks kosher dietary rules and feels wrong for an Israeli/Hebrew app.

The pairing logic itself works — it just lacks cultural awareness.

## Fix — Kosher-aware pairing filter

Add a small classification layer that prevents meat ↔ dairy cross-recommendations. Fish, eggs, and legumes (pareve) remain valid pairings for both sides.

### 1. New file: `src/lib/kosherCategories.ts`
Classify the ~14 protein/dairy ingredients in `mockData.ts`:

```ts
// MEAT (בשרי) — never paired with dairy
export const MEAT_INGREDIENTS = new Set([
  "עוף", "בשר טחון", "נקניקיות", "חזה עוף", "שריות עוף", "בשר בקר"
]);

// DAIRY (חלבי) — never paired with meat
export const DAIRY_INGREDIENTS = new Set([
  "גבינה צהובה", "חלב", "גבינת קוטג'", "שמנת חמוצה", "יוגורט",
  "חמאה", "גבינה לבנה", "גבינת מוצרלה", "שמנת מתוקה", "פרמזן"
]);

// Everything else (fish, eggs, legumes, vegetables, grains…) is pareve → always allowed.

export function isMeat(name: string)  { return MEAT_INGREDIENTS.has(name); }
export function isDairy(name: string) { return DAIRY_INGREDIENTS.has(name); }

export function violatesKosher(selectedNames: string[], candidateName: string): boolean {
  const candIsMeat  = isMeat(candidateName);
  const candIsDairy = isDairy(candidateName);
  if (!candIsMeat && !candIsDairy) return false; // pareve → always fine

  const hasMeat  = selectedNames.some(isMeat);
  const hasDairy = selectedNames.some(isDairy);

  if (candIsMeat && hasDairy) return true;
  if (candIsDairy && hasMeat) return true;
  return false;
}
```

### 2. Update `src/hooks/useIngredientPairings.ts`
Inside the loop that builds `pairedIds` (around the `for (const p of pairings)` block), add a guard:

```ts
import { violatesKosher } from "@/lib/kosherCategories";

const selectedNames = ingredients.map((i) => i.name);
// …inside the loop:
if (violatesKosher(selectedNames, heName)) continue;
```

Also skip the chef-tip toast when `topPairing.pairing` violates kosher (just check the same function before assigning `topPairing`).

### 3. No edge function or UI changes needed
- The Spoonacular call stays the same (still useful for non-conflicting pairings).
- Category glow & ⭐ sorting are unaffected — they just won't show meat under dairy selections (and vice-versa).
- Pareve items (egg, fish, legumes, tofu, vegetables) continue to be recommended normally.

## Validation
After the fix, with **חלב** selected:
- Toast: "חלב משתלב נהדר עם **ביצה**" (or יוגורט / קמח / סוכר) — never with עוף or בשר.
- Open חלבונים → ⭐ on **ביצה / סלמון / טונה / טופו**, never on עוף or בשר טחון.
- Inverse test: select **עוף** → חלבי category will not glow, no dairy items get ⭐.

## Files touched
- `src/lib/kosherCategories.ts` (new, ~25 lines)
- `src/hooks/useIngredientPairings.ts` (add import + 2-line guard + toast guard)