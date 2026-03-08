

## Add 3 New Categories for a 3×3 Grid

### Current 6 categories
Italian 🍝, Asian 🥢, Mediterranean 🫒, American 🍔, Mexican 🌮, Breakfast 🥞

### 3 New Daily-Life Categories
1. **🍰 קינוחים (Desserts)** — "מתוק לסיום" — cakes, cookies, simple sweets
2. **🥗 סלטים וקלילים (Salads & Light)** — "בריא ומהיר" — everyday salads and light meals
3. **🍲 מרקים (Soups)** — "חם ונעים" — daily comfort soups

### Changes

**`src/data/categoryRecipes.ts`**:
- Add 3 new `CuisineCategory` entries with 3-4 recipes each (simple, daily-life recipes with ≤8 ingredients)
- Types: Desserts and Salads as `"meal"`, Soups as `"meal"`

**`src/pages/CategorySelection.tsx`**:
- Update grid from `grid-cols-2` to `grid-cols-3` so all 9 categories display in a clean 3×3 layout
- Adjust card sizing/padding if needed for the tighter grid

