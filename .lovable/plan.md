

## Fix: Recipe-Ingredient Correlation Problem

### The Problem

When a user selects ingredients (tomato, potato, chicken, rice, pasta), the system returns "Baked Agnolotti" which uses none of those ingredients. The smart substitutions then show egg and bread replacements -- which relate to the Agnolotti recipe, not to what the user selected. Everything feels disconnected.

### Root Cause

Two issues in `supabase/functions/generate-and-save-recipe/index.ts`:

1. **Wrong Spoonacular ranking mode**: The API call uses `ranking=2` (minimize missing ingredients) instead of `ranking=1` (maximize used ingredients). With `ranking=2`, Spoonacular returns recipes that need the fewest extra ingredients -- but may ignore the user's ingredients entirely.

2. **Only 1 result fetched, no validation**: `number=1` fetches a single recipe with no check that it actually uses the selected ingredients. Even with `ranking=1`, we should fetch multiple results and pick the best match.

### The Fix

**File: `supabase/functions/generate-and-save-recipe/index.ts`**

1. **Change Spoonacular API parameters** (line 473):
   - Change `ranking=2` to `ranking=1` (maximize used ingredients)
   - Change `number=1` to `number=5` (fetch 5 candidates)

2. **Add best-match selection logic** after fetching Spoonacular results:
   - For each candidate recipe returned by `findByIngredients`, count how many of the user's ingredients are actually used (Spoonacular returns `usedIngredients` and `missedIngredients` arrays in the response)
   - Pick the recipe with the highest number of `usedIngredients`
   - If the best candidate uses fewer than 2 of the user's ingredients (or less than 30% of them), reject it and return the "no matching recipe" error instead of serving an irrelevant recipe

3. **Add logging** to show which recipe was selected and why:
   - Log: "Selected recipe X: uses Y/Z user ingredients"

### Technical Detail

The Spoonacular `findByIngredients` response already includes:
```json
{
  "id": 123,
  "title": "Chicken Rice Bowl",
  "usedIngredientCount": 3,
  "missedIngredientCount": 2,
  "usedIngredients": [...],
  "missedIngredients": [...]
}
```

We will use `usedIngredientCount` to rank results and set a minimum threshold.

### What About Substitutions?

The substitutions currently look up the **recipe's ingredients** in the DB (line 683). This is actually correct behavior -- they show what you can swap IN the recipe you're about to cook. The real problem was the recipe itself being irrelevant. Once the recipe properly matches the user's ingredients, the substitutions will make sense too (e.g., suggesting alternatives for chicken or pasta).

### Files Changed

- `supabase/functions/generate-and-save-recipe/index.ts` -- fix Spoonacular query parameters and add best-match selection

### Summary

- `ranking=2` changed to `ranking=1` (prioritize using what the user has)
- Fetch 5 candidates instead of 1
- Pick the one that uses the most user ingredients
- Reject recipes that use fewer than 2 of the user's ingredients
- No changes needed to substitution logic (it was correct, just fed a bad recipe)

