
## Magnetic Honeycomb Ingredient Picker — Implementation Plan

### Phase 1: Organic Layout + Animations
**Goal:** Replace the current rigid 2-column grid with a fluid "Pebble" cluster layout using framer-motion layout animations.

**Changes:**
- **`src/components/ingredient-input/CategoryBrowser.tsx`** — Replace `grid grid-cols-2` with a flexbox-based organic cluster where cards have varying sizes based on ingredient count. Use `framer-motion` `layoutId` and `layout` props for smooth repositioning when cards are added/removed.
- Cards get organic rounded shapes (border-radius variations), subtle size differences, and staggered entrance animations.
- **Mobile:** Transition to a vertical stacked list with staggered `fade-in + slide-up` entrance animations instead of the cluster.
- **Glassmorphism header** on `/select-ingredients` — `backdrop-blur-xl bg-background/70` non-sticky header integrated into the page canvas.

### Phase 2: Spoonacular Magnetic Pairings
**Goal:** When an ingredient is selected, fetch related ingredients via Spoonacular and visually highlight related categories.

**Changes:**
- **`supabase/functions/ingredient-pairings/index.ts`** — New edge function that calls `recipes/findByIngredients` with the selected ingredients, extracts commonly co-occurring ingredient categories, and returns them.
- **`src/hooks/useIngredientPairings.ts`** — New hook that calls the edge function and returns related category names.
- **`src/components/ingredient-input/CategoryBrowser.tsx`** — When pairings data is available:
  - Related categories get `scale(1.03)` + a subtle colored glow (box-shadow pulse)
  - Irrelevant categories dim to `opacity: 0.4`
  - Use `framer-motion` `animate` for smooth transitions

### Phase 3: Admin Category Management
**Goal:** Admin users can add new categories via a "+" button.

**Changes:**
- **`src/components/ingredient-input/CategoryBrowser.tsx`** — Add a "+" card at the end of the cluster, visible only when `useIsAdmin()` returns true.
- **`src/components/ingredient-input/AddCategoryDialog.tsx`** — New dialog with fields: category name, emoji icon, subtitle, hue color picker. Inserts into the `ingredients` table with the new category.
- New categories trigger framer-motion layout animation to smoothly reposition all cards.

### Phase 4: Balance Meter + Camera Disable Mode
**Goal:** Add nutritional balance indicator and handle camera/image search conflict.

**Changes:**
- **`src/components/ingredient-input/BalanceMeter.tsx`** — New component showing a simple visual meter of how balanced the selection is (protein/carbs/veggies ratio based on selected ingredient categories). On mobile, this lives inside a floating bottom drawer.
- **`src/components/ingredient-input/CategoryBrowser.tsx`** — Accept a `disabled` prop. When true (camera mode active), all category cards get `opacity: 0.3`, `pointer-events: none`, and a banner says "בחירה ידנית מנוטרלת — מצב מצלמה פעיל".

### Notes
- Spoonacular API key already exists as a Supabase secret (`SPOONACULAR_API_KEY`). The user-provided key will be updated there.
- No database schema changes needed for Phase 1-2. Phase 3 uses existing `ingredients` table.
- Each phase is independently shippable.
