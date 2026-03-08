

## Plan: Dynamic Back Button on Recipe Result Page

### Problem
The "חזרה" (back) button on `/recipe` always navigates to `/ingredients`, even when the user came from `/categories`. 

### Solution
Pass `from` in navigation state from both `/ingredients` and `/categories`. In `RecipeResult.tsx`, read `state.from` and use it for the back button destination. Default to `/ingredients` for backward compatibility.

### Changes

**`src/pages/CategorySelection.tsx`** — Add `from: "/categories"` to navigation state:
```ts
navigate(`/recipe?id=${savedId}`, {
  state: { source: "spoonacular", spoonacular_verified: true, from: "/categories" },
});
```

**`src/pages/RecipeResult.tsx`** — 3 back buttons all hardcode `/ingredients`. Change all three to use a dynamic `backPath`:
1. Parse `from` from `location.state` (default: `"/ingredients"`)
2. Replace all `navigate("/ingredients")` calls with `navigate(backPath)`

This affects the back button in:
- No-match view (line 102)
- Multi-recipe carousel view (line 165)  
- Legacy single-recipe view (line 243)

