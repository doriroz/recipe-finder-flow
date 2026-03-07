

## Plan: Category Selection Page with Mock Data

Build a cuisine category page that mirrors the existing ingredient `CategoryBrowser` visual style (2-column pastel Smart Cards with emoji, bold title, muted subtitle, spring animations) and adds a free-text search input at the top.

---

### New Files

**1. `src/data/categoryRecipes.ts`** — Mock data

```typescript
export interface CategoryRecipe {
  title: string;
  ingredients: string[];
  cookingTime: number;
  difficulty: string;
}

export interface CuisineCategory {
  id: string;
  name: string;
  nameHe: string;
  subtitle: string;
  emoji: string;
  hue: string; // HSL like ingredient categories
  type: "cuisine" | "meal";
  recipes: CategoryRecipe[];
}
```

6 categories with 3-4 recipes each (max 8 ingredients):
- **Italian** 🍝 — Pasta Carbonara, Margherita Pizza, Bruschetta
- **Asian** 🥢 — Fried Rice, Teriyaki Chicken, Pad Thai
- **Mediterranean** 🫒 — Greek Salad, Falafel, Hummus Bowl, Shakshuka
- **American** 🍔 — Classic Burger, Mac & Cheese, Grilled Cheese
- **Mexican** 🌮 — Beef Tacos, Quesadilla, Guacamole
- **Breakfast** 🥞 — Classic Pancakes, Scrambled Eggs, French Toast, Avocado Toast

Each category gets a unique pastel HSL hue (lightness ~82%) matching the ingredient card style.

**2. `src/pages/CategorySelection.tsx`** — New page

Layout structure (top to bottom):
1. **Header** — same gradient style as IngredientInput, with back button and title "בחירת קטגוריה 🍽️"
2. **Search input** — RTL text input with search icon, placeholder "חפשו מטבח או מתכון...", styled like `IngredientSearchInput` (rounded-full, border, focus ring). Filters visible category cards by name match.
3. **Category grid** — 2-column grid (`grid-cols-2 gap-3`) of `motion.button` cards identical to `CategoryBrowser`:
   - Pastel HSL background
   - Large emoji (text-4xl)
   - Bold Hebrew name + muted subtitle
   - `whileHover` / `whileTap` spring animations
   - Staggered fade-in
4. Clicking a card navigates to `/ingredients` (for now) passing category info via navigation state.

Uses framer-motion for animations, matches existing design tokens (rounded-2xl, shadow, bg-muted page background).

**3. `src/App.tsx`** — Add route

Add `<Route path="/categories" element={<CategorySelection />} />` before the catch-all.

---

### Files

| File | Action |
|------|--------|
| `src/data/categoryRecipes.ts` | Create — mock category/recipe data |
| `src/pages/CategorySelection.tsx` | Create — category grid page with search |
| `src/App.tsx` | Edit — add `/categories` route |

No existing components are modified.

