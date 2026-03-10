

## Make Category Search Input Functional with Spoonacular API

### What's happening now
The search input on `/categories` only filters local category cards by name. It doesn't search for actual meals/recipes.

### What we'll build
When a user types a meal name (e.g., "שניצל") and submits, the app will:
1. **Check local DB first** — query the `recipes` table for matching titles
2. **Call Spoonacular via the existing `search-recipe` edge function** — which already handles Hebrew→English translation, Spoonacular search, AI translation back to Hebrew, and caching
3. **Display results** below the search bar as clickable recipe cards
4. **Save selected recipe** to the DB and navigate to the recipe page
5. **Show friendly message** if nothing is found

### Changes

**`src/pages/CategorySelection.tsx`**:
- Import and use the existing `useRecipeSearch` hook
- Add debounced search trigger (or search on Enter/button press) — when query is ≥2 chars, call `search()` from the hook
- Add a new **search results section** between the search bar and the category grid:
  - While searching: show a loading spinner
  - If results found: show recipe cards (title, cooking time, difficulty) that on click save to DB and navigate to `/recipe?id=...`
  - If no results: show a friendly "לא מצאנו מתכונים עבור..." message with suggestion to try different keywords
- Keep the existing local category filtering working alongside — categories still filter by name, but search results appear as a separate section above
- When query is cleared, hide search results and show categories normally

**Flow**:
```text
User types "שניצל" + presses Enter
  → useRecipeSearch.search("שניצל")
  → Edge function checks user's saved recipes
  → If < 3 results, queries Spoonacular API
  → Returns translated Hebrew results
  → Results displayed as cards
  → User clicks a result
  → If source="generated", saveGeneratedRecipe() saves to DB
  → Navigate to /recipe?id=...
```

### UI States
- **Empty query**: Show category grid as normal
- **Searching**: Show loader, hide/dim categories
- **Results found**: Show result cards with title, time, difficulty
- **No results**: "לא מצאנו מתכונים עבור "שניצל" 😕 — נסו מילים אחרות"
- **Error**: Show error message from hook

