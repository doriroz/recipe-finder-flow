

## Smart Chef Selection Engine

### Overview
Transform the recipe experience from "single result" to "top 3 recommendations with carousel selection" — a personal chef recommending options, not a search engine returning one result.

### What Changes

**4 areas of change, all integrating with existing code:**

1. Backend scoring formula (edge function)
2. Return top 3 recipes instead of 1
3. New carousel selection UI on RecipeResult page
4. Pre-cooking session locking logic

---

### Part 1: New Scoring Formula (Backend)

**File:** `supabase/functions/generate-and-save-recipe/index.ts`

Replace the current scoring block (lines 700-774) with the new formula:

```text
coverage      = usedCount / userCount
precision     = usedCount / totalIngredients
extraCount    = totalIngredients - usedCount
burdenRatio   = extraCount / userCount

Dynamic maxBurdenRatio:
  userCount <= 3  -> 0.75
  userCount <= 5  -> 1.0
  else            -> 1.5

burdenPenalty = min(burdenRatio / maxBurdenRatio, 1)

structuralBonus =
  (hasProtein ? 0.05 : 0) +
  (missedCount <= 3 ? 0.05 : 0)

finalScore =
  0.55 * coverage +
  0.20 * precision +
  0.15 * (1 - burdenPenalty) +
  0.10 * structuralBonus
```

- Hard reject ONLY if `burdenRatio > 2.0` (very permissive)
- Sort by finalScore descending
- Keep top 3 candidates (not just 1)
- Keep existing relaxation loop + creative fallback for when no candidates pass

### Part 2: Return Top 3 Recipes (Backend + Hook)

**Backend changes:**

Instead of selecting 1 best candidate, process the top 3:
- Fetch full recipe info from Spoonacular for each (up to 3 API calls)
- Translate all 3 via AI
- Save all 3 to the `recipes` table
- Return an array of recipes with their scores and badge labels

**Badge mapping** (no percentages shown):
```text
score >= 0.85  ->  "המלצת השף" (Chef Recommended)
score >= 0.70  ->  "התאמה מצוינת" (Great Match)
else           ->  "אפשרות יצירתית" (Creative Option)
```

Each recipe includes a contextual sentence:
- "משתמש ב-7 מהמצרכים שבחרת"
- "דורש רק 2 תוספות קטנות"
- "בנוי סביב הביצים והבצל שלך"

**Response shape change:**
```text
Current:  { success, recipe, why_it_works, ... }
New:      { success, recipes: [{ recipe, badge, contextLine, score_label, ... }] }
```

**Hook changes (`useGenerateRecipe.ts`):**
- Parse the new `recipes` array from the response
- Navigate to `/recipe` with all recipes in state (not just one ID)
- Keep backwards compatibility: if only 1 recipe, same behavior as before

### Part 3: Carousel Selection UI (Frontend)

**New file:** `src/components/RecipeCarousel.tsx`

A carousel component using the existing Embla carousel infrastructure (`src/components/ui/carousel.tsx`):

- State: `viewMode: "carousel" | "recipeDetail"` and `selectedRecipeId`
- **1 recipe:** Render single RecipeCard normally (no carousel) -- same as current behavior
- **2-3 recipes:** Render carousel layout:
  - Center card is visually dominant (larger, elevated)
  - Side cards are smaller/dimmed
  - Each card shows: title, badge, contextual sentence, quick stats (time, difficulty)
  - Arrow navigation between cards
- Clicking a card: transitions to full RecipeCard detail view (animate center expand, sides fade)
- "Back to selection" button in detail view returns to carousel
- No data refetch on any transition
- Scroll position and active index preserved

**Modified file:** `src/pages/RecipeResult.tsx`

- Accept array of recipes from navigation state
- Render `RecipeCarousel` instead of single `RecipeCard`
- Pass `onStartCooking` to the detail view within the carousel
- Keep existing header, back button, layout

### Part 4: Pre-Cooking Session Logic

**State management in `RecipeResult.tsx`:**

```text
cookingSessionActive = false
lockedRecipeId = null
```

**Before "Start Cooking":**
- User can freely browse carousel, switch between recipes
- No locking, no restrictions

**When user clicks "Start Cooking" (bbishul):**
- `cookingSessionActive = true`
- `lockedRecipeId = selectedRecipeId`
- Carousel access disabled (back button hidden)
- Navigate to `/cooking?id=lockedRecipeId`

**No changes to:**
- CookingMode page
- Cooking steps logic
- MiseEnPlace / preparation flow
- PostCooking page

---

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-and-save-recipe/index.ts` | New scoring formula, return top 3, badge + context generation |
| `src/hooks/useGenerateRecipe.ts` | Parse new multi-recipe response, pass array to navigation state |
| `src/pages/RecipeResult.tsx` | Accept recipe array, render carousel or single card, pre-cooking lock state |
| `src/components/RecipeCarousel.tsx` | **New file** -- carousel/detail dual view with badge display |
| `src/components/RecipeCard.tsx` | Add optional `badge` and `contextLine` props for display |
| `src/types/recipe.ts` | Add badge/context types |

### Files NOT Modified
- All cooking step components (CookingMode, CookingStep, StepProgress, SmartTimer)
- MiseEnPlace / preparation flow
- PostCooking page
- Database schema
- Other edge functions
- Ingredient input page
- Landing page

### Risk Mitigation
- If Spoonacular returns fewer than 3 results, the system works with 1 or 2
- Creative fallback still generates 1 recipe (shown without carousel)
- Backend response is backwards-compatible: old clients seeing `recipes` array can fall back to `recipes[0]`
- The carousel uses the existing Embla carousel already installed in the project

