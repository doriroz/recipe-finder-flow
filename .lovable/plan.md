

## Plan: Category Card Opens Floating Recipe List

### Problem
Clicking a category card navigates to `/ingredients` — user wants it to open a floating card (modal/sheet) showing that category's mock recipes instead.

### Solution
Add a Drawer (bottom sheet) to `CategorySelection.tsx` that opens when a category card is clicked, displaying the selected category's recipes in a scrollable list.

### Changes — single file: `src/pages/CategorySelection.tsx`

1. **Remove** the `navigate("/ingredients", ...)` onClick
2. **Add state**: `selectedCategory: CuisineCategory | null`
3. **onClick**: set `selectedCategory` to the clicked category
4. **Add a Drawer** (using existing `vaul` Drawer component) that shows when `selectedCategory` is set:
   - Drawer header: category emoji + Hebrew name
   - Scrollable list of recipes, each showing: recipe title, cooking time, difficulty, ingredient count
   - Each recipe card is clickable (for now just visual, future: navigate to recipe detail)
   - Close button / swipe to dismiss

No new files. No route changes.

