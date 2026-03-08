

## Plan: Link "חפשו מתכון" Button to Categories Page

The blue-circled button in the screenshot is the "חפשו מתכון" (Search Recipe) outline button in the hero section. Currently it opens the `RecipeSearchOverlay`. Change it to navigate to `/categories` instead.

### Change

**File: `src/pages/LandingPage.tsx`**

Update the hero section's outline button `onClick` from `() => setIsSearchOpen(true)` to `() => navigate("/categories")`.

