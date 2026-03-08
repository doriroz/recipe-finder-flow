

## Plan: Replace Drawer with Floating Modal for Category Recipes

The recipe list that opens when clicking a category card should use the same floating modal pattern as the ingredient `CategoryBrowser` — not a bottom drawer.

### What Changes

**Single file: `src/pages/CategorySelection.tsx`**

1. **Remove** the `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, and `ScrollArea` imports
2. **Add** a portal-based floating modal identical to `CategoryBrowser`'s pattern:
   - `createPortal` to `document.body`
   - Blurred backdrop (`bg-black/60 backdrop-blur-sm`)
   - Centered card with the category's pastel HSL background (`rounded-3xl`, `max-height: 80vh`)
   - Header: emoji + Hebrew name + subtitle + X close button
   - Scrollable recipe list where each recipe row is a rounded pill (`bg-white/30`, hover `bg-white/50`) showing title, cooking time, difficulty, ingredient count
   - Spring animations (`scale 0.82→1`, `opacity`, `y`) on enter/exit via `AnimatePresence`
   - ESC key handler + body scroll lock

This matches the existing ingredient modal 1:1 in layout, colors, animations, and interaction — just displays recipe info instead of ingredient checkboxes.

### Files

| File | Action |
|------|--------|
| `src/pages/CategorySelection.tsx` | Rewrite modal section — replace Drawer with floating portal modal |

