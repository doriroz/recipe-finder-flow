

## Replace 🍳 Emoji with ChefHat Icon Across All Pages

**Problem**: Inner pages use the `🍳` emoji next to "מה שיש" branding, which renders inconsistently and looks like a magnifying glass on some devices. The landing page uses the proper `ChefHat` Lucide icon instead.

**Fix**: Replace every `מה שיש 🍳` text branding with `מה שיש` text + `<ChefHat>` icon component, matching the landing page style.

### Files to update:

1. **`src/pages/IngredientInput.tsx`** — Replace `מה שיש 🍳` with text + ChefHat icon (already imports ChefHat)

2. **`src/pages/Gallery.tsx`** — Replace both instances of `מה שיש 🍳` (logged-in and logged-out headers), add ChefHat import

3. **`src/pages/CookbookBuilder.tsx`** — Replace both instances, add ChefHat import

4. **`src/pages/CategorySelection.tsx`** — Replace one instance, add ChefHat import

5. **`src/pages/UserProfile.tsx`** — Replace both instances, add ChefHat import

6. **`src/pages/FridgeChallenges.tsx`** — Replace the branding instance, add ChefHat import

### Pattern for each replacement:

**Before:**
```tsx
<span className="font-bold text-foreground">מה שיש 🍳</span>
```

**After:**
```tsx
<div className="flex items-center gap-2">
  <ChefHat className="w-6 h-6 text-primary" />
  <span className="font-bold text-foreground">מה שיש</span>
</div>
```

This matches the style used in `RecipeResult.tsx`, `PostCooking.tsx`, and `Login.tsx`.

