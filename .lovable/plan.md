

## Smart Personal Chef - 4-Step Waterfall Architecture

### Overview
Replace the current scoring + Spoonacular-first flow with a strict 4-step waterfall: Local Strict -> External API -> Local Fallback Inspiration -> AI On-Demand button. Integrate staple/anchor/complexity concepts into the matching logic.

---

### Task 1: Database & Data Model Updates

**Migration 1: Add fields to `recipe_library`**
- Add `complexity TEXT DEFAULT 'Everyday'` (values: "Everyday" or "Special")
- Update existing 31 recipes: mark recipes with 8+ ingredient_names or difficulty="high" as "Special", rest as "Everyday"

**Migration 2: Add `is_staple` and `is_core_anchor` to `ingredients` table**
- Add `is_staple BOOLEAN DEFAULT false`
- Add `is_core_anchor BOOLEAN DEFAULT false`
- Populate the table from the mockData ingredient list (100 items), setting:
  - `is_staple = true` for: salt, black pepper, olive oil, canola oil, sugar, water, vinegar, soy sauce
  - `is_core_anchor = true` for: chicken, ground beef, salmon, tuna, chicken breast, beef, egg, tofu, pasta, rice, couscous

**No migration needed for `ingredients_with_quantities`** -- `recipe_library.ingredients` (jsonb) already stores structured `{name, amount, unit}` objects.

**Frontend mockData update:**
- Add `is_staple` and `is_core_anchor` boolean fields to the `Ingredient` interface in `src/data/mockData.ts`
- Tag the relevant ingredients in the hardcoded array (same list as DB population above)
- This ensures the frontend can display staple/anchor indicators if needed later

---

### Task 2: Chef Logic Rules (Edge Function Scoring)

**File: `supabase/functions/generate-and-save-recipe/index.ts`**

Replace `scoreCandidates` and `findLocalMatch` with new Chef Logic functions:

**Core Anchor Rule:**
- From a Spoonacular candidate's `missedIngredients`, check if any is a core anchor (chicken, beef, pasta, rice, egg, etc.)
- If the recipe requires a core anchor the user didn't select -> **reject the recipe**
- Use a hardcoded list in the edge function (same pattern as existing `proteinKeywords`)

**Burden Rule:**
- Count missing non-staple ingredients (exclude salt, pepper, oil, water, sugar, vinegar from the miss count)
- Dynamic max burden: user selects 1-2 ingredients -> max 2 missing; 3+ -> max 3 missing
- Exceeding max burden -> reject

**Complexity Rule:**
- For "Special" recipes: only allow if user has >= 80% of required non-staple ingredients
- "Everyday" recipes: no extra restriction

**Scoring formula** (for ranking recipes that pass all rules):
```
finalScore = 0.55 * coverage + 0.20 * precision + 0.15 * (1 - burdenPenalty) + 0.10 * structuralBonus
```
(Keep existing formula for ranking, but apply it only AFTER the Chef Logic filter)

---

### Task 3: 4-Step Waterfall (Edge Function Main Handler)

Replace the current flow (local match -> Spoonacular top 3 -> creative fallback) with:

**Step 1 - Local DB Strict Match:**
- Query `recipe_library` (all 31+ recipes)
- Apply Chef Logic rules (anchor, burden, complexity) against user ingredients
- If 1-3 recipes pass: save to `recipes` table, return them with badge "המלצת השף" (Chef's Recommendation), **stop**
- The local matching will use Hebrew ingredient names directly (no translation needed)

**Step 2 - External API (Spoonacular):**
- Only triggered if Step 1 yields 0 results
- Translate user ingredients to English, call Spoonacular `findByIngredients`
- Apply the same Chef Logic rules to Spoonacular candidates
- If valid recipes found: translate, save to DB (for future local matches too - insert into `recipe_library`), return up to 3 with badge "המלצת השף", **stop**

**Step 3 - Local Fallback Inspiration:**
- Only triggered if Step 2 yields 0 results
- Find the user's most prominent `is_core_anchor` ingredient
- Return exactly 1 "Everyday" recipe from `recipe_library` that uses this anchor, even if it breaks the Burden Rule
- Badge: "השראה למצרך שלך" (Inspiration) with contextual message explaining the fallback
- Set a flag `showAIButton: true` in the response

**Step 4 - AI On-Demand (Frontend UI):**
- No backend change needed for the generation itself (creative fallback engine already exists)
- When `showAIButton: true` is in the response, the frontend renders a prominent button below the fallback recipe: "צור מתכון AI אישי" (Generate Personal AI Recipe)
- Clicking this button triggers a separate call to the existing `generateCreativeFallback` logic (via a new parameter on the edge function, e.g., `{ forceCreative: true, ingredients: [...] }`)

---

### Task 4: UI Badges & Context Updates

**Badge mapping changes:**
- Step 1/2 results: Badge "המלצת השף" with star icon
- Step 3 fallback: Badge "השראה למצרך שלך" with sparkle icon
- Step 4 AI result: Badge "אפשרות יצירתית" (existing)

**Context sentences:**
- Step 1/2: "משתמש ב-X מהמצרכים שבחרת" or "דורש רק X תוספות קטנות"
- Step 3: "לא מצאנו התאמה מושלמת, אבל הנה מתכון יומיומי קלאסי ל[anchor ingredient]"

**Frontend changes:**

**`src/components/RecipeCarousel.tsx`:**
- Add new badge style for "השראה למצרך שלך" (blue/indigo theme)
- When `showAIButton` is true on a recipe item, render a prominent CTA button below the recipe card

**`src/pages/RecipeResult.tsx`:**
- Handle `showAIButton` flag from navigation state
- Wire the AI button to call `generateRecipe` with `{ forceCreative: true, ingredients }` 
- Show a loading state while generating, then replace the fallback with the AI result

**`src/types/recipe.ts`:**
- Add `showAIButton?: boolean` to `RecipeResultItem`

**`src/hooks/useGenerateRecipe.ts`:**
- Support passing `forceCreative: true` to the edge function

---

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-and-save-recipe/index.ts` | New Chef Logic rules, 4-step waterfall, forceCreative parameter |
| `src/data/mockData.ts` | Add `is_staple` and `is_core_anchor` to Ingredient interface and data |
| `src/types/recipe.ts` | Add `showAIButton` to `RecipeResultItem` |
| `src/hooks/useGenerateRecipe.ts` | Support `forceCreative` option |
| `src/components/RecipeCarousel.tsx` | New badge style, AI generate button |
| `src/pages/RecipeResult.tsx` | Handle AI button flow |

### Files NOT Modified
- CookingMode, CookingStep, MiseEnPlace, PostCooking (cooking flow untouched)
- RecipeCard (no changes needed, badges displayed by carousel)
- Landing page, Login, Gallery, Cookbook
- Other edge functions

### Database Migrations
- 2 migrations: add complexity to recipe_library + add staple/anchor fields to ingredients and populate data

