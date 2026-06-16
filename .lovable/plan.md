# Make floating illustrations visible (V2 Cooking Mode)

The current `Leaf` + `ChefHat` icons are too subtle (20% opacity, w-8, -16px offset) so they read as invisible. Replace and bump them per your selections.

## Single file change
`src/components/v2cooking/V2InstructionCard.tsx`

- Swap `Leaf` → `Sparkles`, `ChefHat` → `Utensils` (keep Lucide imports clean).
- `Sparkles` in the **top-right** corner: `-top-10 -right-10`, `w-12 h-12`, `text-primary/40`, `strokeWidth={1.5}`.
- `Utensils` in the **bottom-left** corner: `-bottom-10 -left-10`, `w-12 h-12`, `text-primary/40`, `strokeWidth={1.5}`.
- Keep `hidden md:block pointer-events-none` so mobile stays clean and no horizontal scroll.
- Keep the existing `motion.div` wrapper with `className="relative"` (no `overflow-hidden` so icons aren't clipped). The card `<article>` keeps its own `overflow-hidden` — that's fine because icons sit on the wrapper, outside the card.
- Add a soft idle animation via Tailwind: `animate-pulse` on `Sparkles` only (very subtle, matches the "subtle pulse for floating items" project animation memory). `Utensils` stays static.

## Not changing
- No changes to `V2CookingMode.tsx`, layout, spacing, step logic, timers, Wake Lock, or any other component.
- Mobile behavior unchanged (icons hidden < md).
