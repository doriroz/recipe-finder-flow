

## Plan: Fix Navigation Stack (Back Button Pushes Instead of Going Back)

### Problem
When pressing "Back" on the Recipe page, `navigate("/categories")` **pushes** a new history entry instead of going back. This creates the stack: `Landing → Categories → Recipe → Categories(new)`. Then pressing back on Categories returns to Recipe — an infinite loop.

### Fix

**`src/pages/RecipeResult.tsx`** — All three back buttons currently do `navigate(backPath)`. Change to `navigate(-1)` so the browser history pops correctly instead of pushing a duplicate entry.

This affects back buttons in:
- No-match view (~line 102)
- Multi-recipe carousel view (~line 134)
- Legacy single-recipe view (~line 195)

**`src/pages/CategorySelection.tsx`** — Already uses `navigate(-1)`, no change needed.

