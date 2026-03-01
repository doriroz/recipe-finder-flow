

## Fix 3 Critical Bugs in Chef Matching Logic

### Bug Summary

1. **Hallucinated matched ingredients** -- UI shows matches against recipe instructions/staples instead of strict ingredient list intersection
2. **Broken Core Anchor Rule** -- user selects Rice but gets Eggplant Salad; bidirectional anchor check missing; major vegetables not in anchor list
3. **0-match recipes pass** -- recipes with zero user ingredient overlap slip through because burden count is low

---

### Fix 1: Strict Ingredient Match Calculation (Frontend)

**File: `src/components/RecipeCard.tsx` (lines 189-220)**

The "Ingredient Match Badge" currently displays `recipe.used_count` and `recipe.used_ingredient_names` as passed from the backend. The backend computes these using fuzzy substring matching (`.includes()`) which can match words in cooking instructions or partial strings.

**Change:** Recompute the match display in the RecipeCard itself using a strict intersection between `recipe.used_ingredient_names` and the recipe's actual `ingredients` array (the structured `{name, amount, unit}` objects). Only show an ingredient as "matched" if it appears in the recipe's ingredients list by exact name match.

- Extract ingredient names from `recipe.ingredients` into a Set
- Filter `recipe.used_ingredient_names` to only include names that exist in that Set
- Update `used_count` display to reflect the strict count
- This is a frontend-only safety net; the backend fix (below) also tightens matching

### Fix 2: Bidirectional Core Anchor Rule + Expanded Anchor List (Backend + DB)

**File: `supabase/functions/generate-and-save-recipe/index.ts`**

**A) Bidirectional Anchor Rule (lines 307-355 in `applyChefLogicLocal`, lines 790-865 in `scoreCandidatesWithChefLogic`):**

Current logic only checks: "does the recipe require an anchor the user didn't select?" (one direction).

Add the reverse check: "did the user select a core anchor that the recipe does NOT contain?" If the user selected Rice and the recipe has no rice at all, reject the recipe.

Implementation:
- After the existing anchor check, add a new loop: for each user ingredient that is a core anchor, verify the recipe contains it
- If a user-selected anchor is absent from the recipe's ingredients, reject the recipe
- Apply same logic to both `applyChefLogicLocal` (Hebrew, Step 1) and `scoreCandidatesWithChefLogic` (English, Step 2)

**B) Expand Core Anchor Lists:**

Add major vegetables and proteins to both Hebrew and English anchor sets:
- Hebrew: "חציל" (eggplant), "כרוב" (cabbage), "תפוח אדמה" (potato), "בטטה" (sweet potato), "כרובית" (cauliflower), "דלעת" (squash/pumpkin)
- English: "eggplant", "cabbage", "potato", "sweet potato", "cauliflower", "squash", "pumpkin"

**C) Database update:** Populate the `ingredients` table with `is_core_anchor = true` for these items so the data model stays consistent (using the insert tool, not migration).

### Fix 3: Minimum Match Rule -- Zero-Match Rejection (Backend)

**File: `supabase/functions/generate-and-save-recipe/index.ts`**

In both `applyChefLogicLocal` (line ~330) and `scoreCandidatesWithChefLogic` (line ~796):

Add a check BEFORE the anchor and burden rules:

```text
if (usedCount === 0) {
  reject recipe immediately
  continue
}
```

This ensures no recipe with zero ingredient overlap can ever pass through Steps 1 or 2, regardless of how few total ingredients it has.

---

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-and-save-recipe/index.ts` | Add minimum-match rule (usedCount > 0), bidirectional anchor check, expand anchor lists |
| `src/components/RecipeCard.tsx` | Strict intersection for ingredient match badge display |

### Database Data Update
- Populate `ingredients` table with core anchor flags for expanded items (eggplant, cabbage, potato, etc.) using the insert tool

### Files NOT Modified
- RecipeCarousel.tsx (no changes needed, it passes data from backend as-is)
- RecipeResult.tsx, useGenerateRecipe.ts, types/recipe.ts (no structural changes)
- Cooking flow, landing page, gallery -- untouched

