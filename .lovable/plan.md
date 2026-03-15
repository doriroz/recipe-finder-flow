

## Navigation History Stack Fix

### Problem
When exiting CookingMode, `navigate(`/recipe?id=...`)` **pushes** a new entry onto the history stack. The stack becomes:

```text
Home → Ingredients → Recipe → Cooking → Recipe (new push)
```

So when the user clicks "Back" on the Recipe page, `navigate(-1)` goes back to `/cooking`, which is still in the history — creating a loop.

### Fix

**One change in `src/pages/CookingMode.tsx`**: Use `navigate(..., { replace: true })` in `handleExit` so the Cooking entry is **replaced** in the history stack instead of pushing a new Recipe entry on top.

This makes the history stack:

```text
Home → Ingredients → Recipe (replaced cooking)
```

Now "Back" from Recipe correctly goes to Ingredients/Home.

### File Changes

- **`src/pages/CookingMode.tsx` (line 55)**: Change `navigate(`/recipe?id=${recipeId}`)` to `navigate(`/recipe?id=${recipeId}`, { replace: true })` and similarly line 57 for the fallback home navigation.

