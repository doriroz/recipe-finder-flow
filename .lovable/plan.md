
## Sync Main Logic with Debug: Full Coverage Plan

### Problem
The debug page only tests Step 1 (Hebrew local matching). The actual bugs users see come from Steps 2 and 3, which are invisible to the debug tool. Critically, Step 3 (Local Fallback) bypasses ALL Chef Logic rules entirely.

### Fix 1: Apply Chef Logic to Step 3 Fallback (Backend)

**File: `supabase/functions/generate-and-save-recipe/index.ts` (lines 444-486)**

The `findFallbackInspiration` function currently grabs the first "Everyday" recipe matching ONE anchor. It must enforce the bidirectional anchor rule at minimum.

Changes:
- After finding a recipe with the user's primary anchor, verify ALL user-selected anchors are present in the recipe
- If a user selected Rice + Eggplant + Pasta, the fallback must contain all three (or skip that candidate)
- If no recipe satisfies this, return null (triggering Step 4 AI instead)
- Also reject fallback candidates with zero non-anchor ingredient overlap

### Fix 2: Expand Debug to Cover All 4 Steps (Backend + Frontend)

**File: `supabase/functions/debug-matching/index.ts`**

Add three new sections to the debug output:

A) **Step 2 Simulation**: Run `scoreCandidatesWithChefLogic` against the English anchor/staple lists using translated ingredient names. Show which Spoonacular-style candidates would pass or fail. (No actual Spoonacular API call needed -- just test the English-side filtering logic against the local library's English names if available.)

B) **Step 3 Simulation**: Run `findFallbackInspiration` (the fixed version) and show:
- Which anchor was selected as "primary"
- Which fallback recipe was chosen and why
- Whether it would have been rejected by the strict rules

C) **Step Summary**: Add a top-level summary showing which step would have been reached in a real run (e.g., "Step 1: 0 results -> Step 2: 0 results -> Step 3: Fallback triggered").

**File: `src/pages/DebugMatching.tsx`**

Add UI sections for:
- A "Waterfall Summary" card showing which step would fire
- A "Step 3 Fallback" table showing the fallback candidate and its anchor analysis
- Color-coded step indicators (green = results found, red = no results, grey = skipped)

### Fix 3: Keep Anchor/Staple Lists in One Place

Currently both edge functions duplicate the STAPLE and ANCHOR sets. Any update to one must be manually mirrored to the other.

Create a shared constants approach:
- In the debug function, add a comment block at the top: "IMPORTANT: These lists MUST match generate-and-save-recipe/index.ts"
- Add the English anchor/staple lists to debug-matching (currently missing entirely) so Step 2 can be simulated
- Add `CORE_ANCHOR_INGREDIENTS_EN` and `STAPLE_INGREDIENTS_EN` to the debug function

### Technical Details

**Step 3 fix (main function):**
```text
function findFallbackInspiration(userIngredients, library):
  userAnchors = userIngredients.filter(isCoreAnchorHe)
  if no anchors: return null

  for each recipe in library:
    skip if "Special"
    recipeIngs = recipe.ingredient_names
    
    // NEW: Check ALL user anchors are in recipe
    allAnchorsPresent = true
    for each anchor in userAnchors:
      if recipe doesn't contain anchor:
        allAnchorsPresent = false
        break
    if not allAnchorsPresent: continue
    
    // Existing: compute usedNames
    if usedNames.length === 0: continue  // zero-match guard
    
    return scored result
  
  return null  // no valid fallback -> triggers Step 4
```

**Debug expansion (debug function):**
- Add `simulateStep3` function that runs the fixed fallback logic and returns the candidate with metadata
- Add `waterfall` field to response: `{ step1Count, step2Count, step3Result, wouldReachStep }`
- Response shape adds: `fallback: { recipe, anchorsChecked, passed, reason } | null`

**Debug UI additions:**
- New "Waterfall Flow" card at the top of results showing step progression
- New "Step 3 Analysis" card showing the fallback candidate details
- Badge on each step: "X results" or "No results -- skipped to next step"

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-and-save-recipe/index.ts` | Fix `findFallbackInspiration` to enforce bidirectional anchor rule and zero-match guard |
| `supabase/functions/debug-matching/index.ts` | Add English lists, Step 3 simulation, waterfall summary |
| `src/pages/DebugMatching.tsx` | Add waterfall summary card, Step 3 analysis table |

### Deployment
- Both edge functions will be redeployed
- No database changes needed
