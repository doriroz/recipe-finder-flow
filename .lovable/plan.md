

## Fix Translation + Restore Smart Substitutions

### What's broken and why

**Translation**: The `translateBatch` function joins all text with newlines into one string. A typical recipe has title + 5-10 ingredients + 5-8 steps = 15+ strings. This easily exceeds MyMemory's 490-char limit, the count doesn't match after splitting, and everything stays in English. Evidence from DB: "Simple Garlic Pasta", "chili pepper", "Penne Arrabiata".

**Substitutions**: `fetchRecipeFromSpoonacular` returns `substitutions: []` because Spoonacular doesn't provide them. Your DB has 55+ Hebrew substitution mappings that aren't being used.

---

### Fix 1: Individual Translation (replace `translateBatch`)

In both `generate-and-save-recipe/index.ts` and `search-recipe/index.ts`:

- Remove the `translateBatch` function
- Replace with `translateEach`: loops through each string and calls `translateText` individually
- Each ingredient name ("garlic", "olive oil") is well under 490 chars, so every call succeeds
- If one fails, only that one stays in English -- the rest still translate

### Fix 2: DB-Based Substitutions

In `generate-and-save-recipe/index.ts`, after building the Spoonacular recipe:

- Query the `ingredient_substitutions` table for each translated Hebrew ingredient name
- Use partial matching (e.g. if ingredient contains "חמאה", find all substitutions for "חמאה")
- Attach up to 4 matching substitutions to the recipe before saving
- Same logic added in `search-recipe/index.ts` for search results

### Fix 3: Update disclaimer text

In `src/components/RecipeCard.tsx`:
- Change the AI disclaimer to reflect that recipes come from verified external sources, not AI

---

### Technical Details

**`supabase/functions/generate-and-save-recipe/index.ts`**:
- Remove `translateBatch` (lines 41-48)
- Add `translateEach(texts, langpair)` that calls `translateText` per item in a loop
- In `fetchRecipeFromSpoonacular` (line 345): replace `translateBatch(textsToTranslate, "en|he")` with `translateEach(textsToTranslate, "en|he")`
- After line 500 (after getting `spoonacularRecipe`): query `ingredient_substitutions` table to find matching substitutions for the recipe's ingredient names, and set them on the recipe before saving

**`supabase/functions/search-recipe/index.ts`**:
- Same `translateBatch` replacement with individual calls (line 158 area)
- Add substitution lookup from `ingredient_substitutions` table for each search result

**`src/components/RecipeCard.tsx`**:
- Update disclaimer text (line 281) from "AI" to "external verified sources"

### What this fixes
- Every ingredient and instruction step will be translated to Hebrew individually (reliable)
- Recipes will have real substitutions from your 55+ entry DB (e.g. butter to olive oil, eggs to tofu)
- No AI cost, no new dependencies

