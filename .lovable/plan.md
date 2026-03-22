

## Fix Cookbook Page Header Height Consistency

**Problem**: The `/cookbook` header is taller than other pages because the `CookbookStepIndicator` component is rendered *inside* the `<header>` element, adding extra height.

**Fix** in `src/pages/CookbookBuilder.tsx`:

Move the `<CookbookStepIndicator>` component **outside** the `<header>` tag, placing it between the header and the main content. This keeps the header height identical to `/categories`, `/gallery`, `/profile`, and `/ingredients`, while the step indicator becomes a separate section below.

Specifically:
- Close the `</header>` tag after the nav row (line 135)
- Place `<CookbookStepIndicator>` as a standalone element between `</header>` and `<main>`

Same fix applies to the not-logged-in return block (lines ~70-109) — though that block doesn't have the step indicator, so no change needed there.

