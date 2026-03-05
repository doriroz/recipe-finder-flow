

## Plan: Simplified Scoring + Restore Substitutions + Layout Match

### What the user wants

1. **Restore SubstitutionSection** to RecipeCard — it was removed by mistake in the previous edit
2. **Repaint the recipe page** to match the reference image (recipe card with substitutions + Magic Chef card side-by-side on desktop)
3. **Completely replace the scoring logic** with a simple formula across both edge functions
4. **Sync debug-matching** to use the same simplified logic

### Part 1: New Simple Scoring Formula

Replace ALL Chef Logic scoring in `generate-and-save-recipe/index.ts` and `debug-matching/index.ts`.

**New rules (replaces `applyChefLogicLocal`, `scoreCandidatesWithChefLogic`, and `debugChefLogic`):**

```
matchCount = number of user ingredient keys found in recipe
missingCount = recipe ingredients NOT in user's selection
score = matchCount - (missingCount * 0.5)
Reject ONLY if matchCount == 0
```

**Remove entirely:**
- Anchor ingredient rules (CORE_ANCHOR sets, `isCoreAnchorHe`, `isCoreAnchorEn`, anchor penalties)
- Staple ingredient filtering from scoring (keep sets only for display/debug info)
- 50% coverage threshold
- Burden rules (maxBurden, burdenPenalty, burdenRatio)
- structuralBonus / protein detection
- Complexity rule for "Special" recipes
- `findFallbackInspiration` function (Step 3 fallback)

**New pipeline flow in `generate-and-save-recipe`:**
1. Always search local recipe_library — score all, collect those with matchCount > 0
2. If fewer than 10 local results found, call Spoonacular API
3. Save Spoonacular results to recipe_library for caching (existing `saveSpoonacularToLibrary`)
4. Merge local + API into one list
5. Sort by score descending
6. Return top 3
7. If zero results after merge → return "no match" error (no Step 3 fallback)

**Badge assignment:**
- score >= 3.0 → "המלצת השף"
- score >= 1.5 → "התאמה מצוינת"  
- else → "אפשרות יצירתית"

### Part 2: Restore SubstitutionSection in RecipeCard

Add back the SubstitutionSection component import and render it after the ingredients list, before the "Let's Cook" button. The image clearly shows the smart substitutions section.

**File: `src/components/RecipeCard.tsx`**
- Import `SubstitutionSection`
- Render it between ingredients list and button, passing `substitutions`, `ingredients` (as string[]), and `recipeTitle`

### Part 3: Recipe Page Layout (match reference image)

The reference image shows on desktop: Magic Chef card on the LEFT, Recipe card on the RIGHT, side by side. On mobile: stacked.

**File: `src/pages/RecipeResult.tsx`** (multi-recipe carousel section)
- Use a 2-column grid on `lg` screens: left = MagicChefCard (sticky), right = RecipeCarousel
- On mobile: MagicChefCard below the carousel (existing behavior)

**File: `src/components/RecipeCarousel.tsx`**
- No major changes needed, the MagicChefCard already exists

### Part 4: Sync debug-matching

**File: `supabase/functions/debug-matching/index.ts`**
- Replace `debugChefLogic` with the same simple formula: `score = matchCount - (missingCount * 0.5)`, reject only if matchCount == 0
- Replace `liveStep2` scoring with the same formula
- Remove Step 3 simulation (no longer needed)
- Keep translation/API call logic unchanged
- Update the formula reference in the response

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-and-save-recipe/index.ts` | Replace scoring with simple formula, remove anchors/burden/thresholds, new merge pipeline |
| `supabase/functions/debug-matching/index.ts` | Mirror simplified scoring, remove Step 3 |
| `src/components/RecipeCard.tsx` | Restore SubstitutionSection |
| `src/pages/RecipeResult.tsx` | 2-column layout for Magic Chef + recipe on desktop |

### Deployment
- Redeploy both edge functions
- No database changes

