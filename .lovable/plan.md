

## Make Category Selection page consistent with Ingredient Input page layout

**Problem**: The `/categories` page has a completely different layout structure from `/ingredients` — different background color, different header style, different container width, and no app branding. They should feel like sibling pages of the same app.

### Changes to `src/pages/CategorySelection.tsx`

1. **Match the header**: Replace the custom gradient header with the same app header pattern used in `/ingredients`:
   - Same `bg-gradient-to-l from-primary/10 via-accent to-card` gradient with border and shadow
   - Same layout: back button ("חזרה") on the right, branding ("מה שיש 🍳") + CreditCounter on the left
   - Remove the standalone `dir="rtl"` (already set globally in CSS)

2. **Match the background**: Change `bg-muted` to `bg-background` to match the ingredients page

3. **Match the container**: Replace `max-w-lg mx-auto` with `container mx-auto` for consistent width

4. **Match the search bar**: Move the search input into the `<main>` content area below the header (same position as IngredientSearchInput on the ingredients page), using the same padding and spacing

5. **Keep the page title**: Add "בחירת קטגוריה 🍽️" as a centered subtitle below the header, similar to how the ingredients page has its tab bar

6. **Preserve all existing functionality**: Search, category grid, modal — all behavior stays the same, only the outer shell changes

