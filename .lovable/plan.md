

## Plan: Recipe Card Click → Spoonacular Search → Recipe Result Page

### Approach
Reuse the existing `search-recipe` edge function (which already queries Spoonacular, translates to Hebrew, and returns full recipe data) by searching with the clicked recipe's title. Then save the result and navigate to `/recipe`.

### Changes

**File: `src/pages/CategorySelection.tsx`**

1. Import `useRecipeSearch` hook and `useNavigate`
2. Add loading state (`loadingRecipe: string | null`) to track which recipe is being fetched
3. On recipe card click:
   - Set loading state (show spinner on that card)
   - Call `search(recipe.title)` from `useRecipeSearch`
   - If results found: call `saveGeneratedRecipe(results[0])` to persist to DB
   - Navigate to `/recipe?id={savedId}` with state matching existing pattern (`why_it_works`, `reliability_score`, `source: "spoonacular"`, etc.)
   - If no results or error: show toast error in Hebrew
4. Disable clicks on other recipe cards while one is loading

**No edge function changes** — `search-recipe` already handles Spoonacular search + Hebrew translation + substitution lookup.

**No new files** — uses existing `useRecipeSearch` hook which wraps the edge function.

### Navigation State
Matches the existing legacy single-recipe format used by `RecipeResult.tsx`:
```
navigate(`/recipe?id=${savedId}`, {
  state: { source: "spoonacular", spoonacular_verified: true }
})
```

