

## Fix Misleading Spoonacular Badge for Local Recipes

### Problem

When a recipe is served from the local library (no AI involved), the UI still shows an amber badge saying "לא אומת – מבוסס AI בלבד" (Not verified -- AI based only). This is incorrect and confusing because the recipe came from the curated local database, not from AI generation.

### Root Cause

The edge function returns a `source` field (`"local"` or `"ai"`) in the response, but the frontend currently ignores it. The Spoonacular badge only checks `spoonacular_verified` (true/false), so any non-verified recipe -- including local matches -- gets the misleading "AI based only" label.

### Solution

Pass the `source` field through to the UI and display a third badge variant for local recipes.

### Changes

**1. `src/hooks/useGenerateRecipe.ts`**
- Pass `source` from the edge function response into the navigation state (alongside `why_it_works`, `reliability_score`, etc.)

**2. `src/pages/RecipeResult.tsx`**
- Read `source` from `location.state`
- Pass it down to `RecipeCard`

**3. `src/components/RecipeCard.tsx`**
- Add optional `source?: "local" | "ai"` to `RecipeCardData`
- Pass it to the badge display area

**4. Badge display logic (in `RecipeCard.tsx`)**
- Current logic (2 states):
  - `spoonacular_verified === true` --> green badge: "מאומת ע״י Spoonacular"
  - `spoonacular_verified === false` --> amber badge: "לא אומת – מבוסס AI בלבד"
- New logic (3 states):
  - `spoonacular_verified === true` --> green badge: "מאומת ע״י Spoonacular" (unchanged)
  - `source === "local"` --> blue/teal badge: "מתכון מהמאגר המקומי" (new)
  - Otherwise --> amber badge: "לא אומת – מבוסס AI בלבד" (unchanged)

This is a small, surgical fix -- no database changes, no edge function changes, no new dependencies.

