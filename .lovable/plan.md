

## Plan: New Scoring Logic with Grouping, Ingredient Limit, and Fallback

### Changes Summary

Update the scoring/filtering in both edge functions to use the new rules. The response format changes to include grouped recipes. No UI component files are modified.

---

### Part 1: Update `generate-and-save-recipe/index.ts`

**Scoring function `scoreLocalRecipes`** (lines 259-311):
- Add filter: skip recipes with `> 10 total ingredients`
- Change score formula: `score = usedCount - missingCount` (remove the `* 0.5`)
- Add filter: reject if `missingCount > 3`
- Keep existing: reject if `matchCount == 0`

**Scoring function `scoreSpoonacularCandidates`** (lines 329-362):
- Add filter: skip if `(used + missed) > 10` total ingredients
- Change score formula: `score = used - missed`
- Add filter: reject if `missed > 3`

**Badge assignment** in both scoring functions:
- `missingCount == 0` → badge = `"מוכן לבישול"` (Cook Now)
- `missingCount <= 2` → badge = `"כמעט מוכן"` (Almost Ready)
- `missingCount == 3` → badge = `"חסרים 3 מצרכים"` (Needs Three)

**Context lines**:
- `missingCount == 0` → `"כל המצרכים אצלך!"`
- `missingCount == 1` → `"חסר רק מצרך אחד"`
- `missingCount == 2` → `"חסרים 2 מצרכים"`
- `missingCount == 3` → `"חסרים 3 מצרכים"`

**Pipeline** (lines 959-1144):
- After merging local + API candidates and sorting by score, group into 3 sections:
  - `cookNow`: missingCount == 0 → take top 3
  - `almostReady`: missingCount 1-2 → take top 3
  - `needsThree`: missingCount == 3 → take top 3
- Flatten groups into a single `recipes` array (cookNow first, then almostReady, then needsThree)
- Add `group` field to each recipe result item for frontend grouping

**Fallback** (lines 1140-1144):
- If zero recipes after filtering, return a response with:
  - `noMatch: true`
  - `message: "לא נמצאו מתכונים מתאימים למצרכים שבחרת"`
  - `popularRecipes`: top 3 from all candidates sorted by `usedCount desc, missingCount asc` (ignoring the missingCount > 3 filter)
  - `showAIButton: true`

**Always include** `showAIButton: true` in the response so the frontend always shows the AI button.

---

### Part 2: Update `debug-matching/index.ts`

Mirror the same changes:
- `debugSimpleScoring`: add 10-ingredient limit, `score = matchCount - missingCount`, reject if `missingCount > 3`
- `liveStep2`: add 10-ingredient limit on `(used + missed)`, `score = used - missed`, reject if `missed > 3`
- Update badge assignment to use new group-based badges
- Update formula description in response

---

### Part 3: Update `src/types/recipe.ts`

- Add new badge types: `"מוכן לבישול"`, `"כמעט מוכן"`, `"חסרים 3 מצרכים"`
- Add `group?: "cookNow" | "almostReady" | "needsThree" | "popular"` to `RecipeResultItem`

---

### Part 4: Update `src/components/RecipeCarousel.tsx`

Add new badge styles for the 3 new badges to `badgeStyles` and `badgeEmoji` maps. This is data-only, not a structural UI change.

---

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-and-save-recipe/index.ts` | New scoring formula, 10-ingredient limit, missingCount > 3 filter, grouped output, fallback with popular recipes |
| `supabase/functions/debug-matching/index.ts` | Mirror scoring changes |
| `src/types/recipe.ts` | Add group field and new badge types |
| `src/components/RecipeCarousel.tsx` | Add badge styles for new group badges (data only) |

### Deployment
- Redeploy both edge functions
- No database changes

