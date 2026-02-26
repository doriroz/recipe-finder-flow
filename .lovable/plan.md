

## Smart Chef Brain Layer - Dynamic Matching + Structured Fallback

### Problem
The current fixed `minCoverage = 0.6` and `minPrecision = 0.50` thresholds reject too many recipes, especially when users select few ingredients. The system returns "no recipe found" which is unacceptable for the app's purpose.

### Solution Overview
Three-layer improvement to `fetchRecipeFromSpoonacular` in `supabase/functions/generate-and-save-recipe/index.ts`:

1. **Dynamic coverage thresholds** based on ingredient count
2. **Relaxation loop** that retries with lower thresholds
3. **Structured fallback engine** that always returns a recipe

No frontend changes needed. No database changes needed.

---

### Layer 1: Dynamic Coverage + Remove Precision Gate

Replace the fixed thresholds (lines 620-623) with dynamic logic:

```text
userCount <= 2  ->  minCoverage = 0.4
userCount <= 4  ->  minCoverage = 0.5
else            ->  minCoverage = 0.6
```

Remove `minPrecision` as a hard gate entirely. Keep `maxMissed = userCount + 3`.

Add structural scoring bonuses to the composite score:
- +0.05 if recipe contains a protein ingredient (chicken, beef, fish, egg, tofu, etc.)
- +0.05 if `missedIngredientCount <= 3`

### Layer 2: Relaxation Loop (max 2 retries)

If no candidate passes the dynamic threshold, reduce `minCoverage` by 0.1 and retry from the same scored list. Maximum 2 relaxation attempts. This means the absolute floor is:
- 2 ingredients: 0.4 -> 0.3 -> 0.2
- 4 ingredients: 0.5 -> 0.4 -> 0.3
- 6 ingredients: 0.6 -> 0.5 -> 0.4

### Layer 3: Structured Fallback Engine

If after relaxation still no recipe qualifies, instead of returning `null`:

1. Take the top-scored candidate regardless of thresholds
2. If even that fails (no Spoonacular results at all), build a recipe skeleton:
   - Classify user ingredients into categories (protein, carb, vegetable, fat, spice) using simple keyword matching
   - Determine cooking structure based on categories (e.g., protein + carb = skillet/bowl; vegetables only = salad/stir-fry)
   - Use AI (Gemini) to generate a short coherent recipe using the actual ingredient names
   - Mark with `reliability_score: "creative"` so the UI shows it's AI-generated
3. Never return null -- always return a `RecipeResponse`

### Main Handler Update

Remove the 404 "no recipe found" response at line 885-889. Since `fetchRecipeFromSpoonacular` will always return a recipe, this block becomes unreachable. Keep it as a safety net but it should never trigger.

---

### Technical Details

**File: `supabase/functions/generate-and-save-recipe/index.ts`**

Changes within `fetchRecipeFromSpoonacular` function (lines 567-756):

**A. Scoring with bonuses** (after line 606):
```typescript
// Protein detection
const proteinKeywords = ["chicken","beef","pork","fish","salmon","tuna",
  "shrimp","egg","tofu","lamb","turkey","sausage"];
const hasProtein = (c.usedIngredients || []).some(i =>
  proteinKeywords.some(p => i.name?.toLowerCase().includes(p)));
let bonus = 0;
if (hasProtein) bonus += 0.05;
if (missed <= 3) bonus += 0.05;
return { ...c, used, missed, coverage, precision, score: score + bonus };
```

**B. Dynamic threshold + relaxation loop** (replaces lines 620-647):
```typescript
let minCoverage = userCount <= 2 ? 0.4 : userCount <= 4 ? 0.5 : 0.6;
const maxMissed = userCount + 3;

let best = null;
let relaxAttempts = 0;
while (!best && relaxAttempts <= 2) {
  for (const c of scored) {
    if (c.coverage < minCoverage) { /* log rejection */ continue; }
    if (c.missed > maxMissed) { /* log rejection */ continue; }
    best = c;
    break;
  }
  if (!best) {
    minCoverage -= 0.1;
    relaxAttempts++;
    console.log(`Relaxing coverage to ${minCoverage.toFixed(1)}, attempt ${relaxAttempts}`);
  }
}
```

**C. Structured fallback** (after relaxation, if still no `best`):
```typescript
if (!best) {
  // Take top-scored candidate regardless
  best = scored[0] || null;
  if (best) {
    console.log(`FALLBACK: accepting top candidate "${best.title}" despite low scores`);
  }
}
```

**D. Full fallback when no Spoonacular results** (new function ~30 lines):
If `findData` is empty or all API calls fail, generate a creative recipe:
- Categorize ingredients by keyword (protein/carb/veg/fat/spice)
- Pick a cooking style (skillet, bowl, soup, salad, roast)
- Call Gemini to generate a structured recipe with title, ingredients (with amounts), and steps
- Return with `reliability_score: "creative"`

**E. Main handler safety net** (line 885):
Keep the 404 response but it should be unreachable now.

### What stays the same
- Frontend code (RecipeCard, RecipeResult, useGenerateRecipe) -- no changes
- Database schema -- no changes
- Local recipe matching (Step 2) -- no changes
- Translation/cache logic -- no changes
- Spoonacular API calls -- same endpoint, same parameters
- The `source` field will be `"spoonacular"` for relaxed matches and `"ai"` for creative fallbacks

