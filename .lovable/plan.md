

## Add "Ingredient Match" Indicator to Recipe Page

### Problem
The backend computes how many of the user's selected ingredients were used in the recipe (`used`, `missed`, `coverage`, `precision`), but throws this data away. The user has no idea which of their ingredients made it into the recipe.

### Solution
Pass the match stats from the backend all the way to the recipe page, and display a small, informative badge.

---

### Changes

**1. Edge Function (`supabase/functions/generate-and-save-recipe/index.ts`)**

- In `fetchRecipeFromSpoonacular`, include `used` and `missed` counts in the returned object (alongside `title`, `ingredients`, etc.)
- In the main handler's Spoonacular response (lines 891-900), add `used_count` and `missed_count` to the JSON response:
  ```
  used_count: spoonacularRecipe.used,
  missed_count: spoonacularRecipe.missed,
  ```

**2. Hook (`src/hooks/useGenerateRecipe.ts`)**

- Pass `used_count` and `missed_count` through `navigate` state (lines 93-100):
  ```
  used_count: data.used_count,
  missed_count: data.missed_count,
  ```

**3. Recipe Result Page (`src/pages/RecipeResult.tsx`)**

- Read `used_count` and `missed_count` from `location.state`
- Pass them to `RecipeCard` as new props

**4. Recipe Card (`src/components/RecipeCard.tsx`)**

- Accept optional `used_count` and `missed_count` props
- Display a small badge in the "Quick Info" bar, e.g.:
  ```
  "4 מתוך 6 מרכיבים שלך נמצאים במתכון"
  (4 out of 6 of your ingredients are in the recipe)
  ```
- Style: green tint if coverage is high (80%+), amber if medium, subtle muted if low
- Only show the badge when the values are present (not for mock/old recipes)

### Visual

```text
+---------------------------------------------+
| Clock 30 min | ChefHat Medium | Users 4     |
+---------------------------------------------+
| CheckCircle  4/6 מהמרכיבים שבחרת במתכון    |
+---------------------------------------------+
```

### What stays the same
- No changes to the recipe database schema
- No changes to the ingredient input flow
- Mock recipes won't show this badge (no match data)

