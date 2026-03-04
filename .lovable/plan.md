

## Plan: Soften Anchor Logic + Merge Pipeline + Repaint Recipe Page

### Part 1: Soften Anchor Rejection Logic

**Files: `generate-and-save-recipe/index.ts` + `debug-matching/index.ts`**

Currently, both `applyChefLogicLocal` (lines 360-376) and `scoreCandidatesWithChefLogic` (lines 836-858) hard-reject recipes when an anchor is missing. Change to:

**Replace hard rejection with soft penalty:**
- Remove the `continue` statements for RULE 1 (missing anchor) and RULE 1b (reverse anchor)
- Instead, penalize `structuralBonus` by -0.15 per missing anchor
- After scoring, only accept if: `coverage >= 0.5 AND usedCount >= 2 AND finalScore >= 0.55`
- Recipes that fail these thresholds still get rejected, but good partial matches survive

**In `applyChefLogicLocal` (lines 360-376):**
```text
// OLD: if (missedAnchors.length > 0) continue;
// NEW: Track anchor penalties for structuralBonus
let anchorPenalty = missedAnchors.length * 0.15;
// Also check reverse anchors, add to anchorPenalty instead of continue
structuralBonus = structuralBonus - anchorPenalty;
// After computing finalScore:
if (coverage < 0.5 || usedCount < 2 || finalScore < 0.55) continue;
```

Same change in `scoreCandidatesWithChefLogic` (lines 836-858) for Spoonacular candidates.

Same change in `debug-matching/index.ts` `debugChefLogic` and `liveStep2` functions.

Scoring weights remain untouched: `0.55*coverage + 0.20*precision + 0.15*(1-burdenPenalty) + 0.10*structuralBonus`.

---

### Part 2: Merge Local + API Pipeline

**File: `generate-and-save-recipe/index.ts` (lines 1191-1381)**

Currently Step 1 returns immediately if local results exist. Change to:

1. Run Step 1 (local matching) and store results with their `finalScore`
2. If best local score < 0.8, also run Step 2 (Spoonacular API)
3. Merge all candidates into one array
4. Sort by `finalScore` descending
5. Return top 3 overall

```text
// Pseudocode for new flow:
const localResults = applyChefLogicLocal(...)  // scored array
const bestLocalScore = localResults[0]?.finalScore || 0

let allCandidates = [...process local results into response format]

if (bestLocalScore < 0.8 && SPOONACULAR_API_KEY) {
  // Run Step 2
  const spoonacularResults = [...process spoonacular candidates]
  allCandidates = [...allCandidates, ...spoonacularResults]
}

// Sort merged results by finalScore
allCandidates.sort((a, b) => b.finalScore - a.finalScore)
const top3 = allCandidates.slice(0, 3)

if (top3.length > 0) return top3
// else fall through to Step 3 fallback
```

This requires storing `finalScore` on each response recipe item temporarily for sorting. The `RecipeResultItem` type and response shape stay the same.

---

### Part 3: Repaint Recipe Page

**Reference image analysis:** The user crossed out the bottom section of the recipe card. The desired layout keeps:
- Header with back button + logo
- Badge + context line
- Recipe title + description + quick stats (time, difficulty, servings)
- Ingredient match indicator (green/amber chips)
- Ingredients list with servings adjuster
- "Let's Cook" button

**Remove/hide (crossed out in image):**
- Reliability score + source badge row
- Chef's Tip (why_it_works)
- Diet Filter section
- Substitutions section
- AI disclaimer text

The Magic Chef card (left side in image) stays as-is in the carousel for partial matches.

**File: `src/components/RecipeCard.tsx`**

Remove lines 286-335 (reliability score, chef tip, diet filter, substitutions, AI disclaimer). Keep the clean flow: header → match badge → ingredients → cook button.

Also refine visual styling to match the image's cleaner, rounder card aesthetic:
- Softer card with more rounded corners
- Cleaner spacing between sections
- The "Let's Cook" button remains full-width at the bottom

---

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-and-save-recipe/index.ts` | Soften anchor rejection in `applyChefLogicLocal` + `scoreCandidatesWithChefLogic`; merge local+API pipeline |
| `supabase/functions/debug-matching/index.ts` | Mirror softened anchor logic in `debugChefLogic` + `liveStep2` |
| `src/components/RecipeCard.tsx` | Remove crossed-out sections (reliability, chef tip, diet, substitutions, disclaimer) |

### Deployment
- Redeploy both edge functions
- No database changes

