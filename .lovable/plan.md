

## Fix: Remove Duplicate Egg from Ingredients Data

### The Problem

"ביצה" (egg) appears **twice** in `src/data/mockData.ts`:
- `id: 2` — category "חלבי" (dairy), score 96
- `id: 39` — category "חלבונים" (proteins), score 96

Both score high enough to land in the Quick Picks top 12, so the user sees egg listed twice.

### The Fix

**`src/data/mockData.ts`** — Remove the duplicate entry:
- **Keep** `id: 39` in "חלבונים" (proteins) — egg is more naturally a protein
- **Remove** `id: 2` from "חלבי" (dairy)

This is a one-line deletion. No other files need to change since all components reference ingredients by `id`, and no code hardcodes `id: 2`.

### Alternative (if egg should appear in both categories)

If you want egg to stay in both categories (e.g., for the Category Browser), instead of removing the duplicate, we could add **name-based deduplication** in `QuickPicksSection.tsx` — filter out items with the same `name` before slicing the top 12. But the simpler fix is just removing the duplicate entry.

