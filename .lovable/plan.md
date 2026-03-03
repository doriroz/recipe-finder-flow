

## Fix Matching Bug + Enhanced Debug + AI Suggestion UX

### Root Cause Analysis

The matching bug has two root causes:

1. **Step 2 debug is fake**: The current `debug-matching` function simulates Step 2 by filtering English-titled recipes from the LOCAL library (only 9 spoonacular entries). It never calls the actual Spoonacular API. The real Step 2 translates Hebrew ingredients via MyMemory, calls `findByIngredients`, then applies Chef Logic. The debug shows none of this.

2. **Small library + strict rules**: With only ~42 recipes (33 Everyday), the strict bidirectional anchor rule + burden limit rejects most candidates. When Step 1 fails and Step 2 also fails (Spoonacular candidates filtered by Chef Logic), the user gets either a weak fallback or nothing.

### Formula Reference (for debug display)

```text
finalScore = 0.55 * coverage + 0.20 * precision + 0.15 * (1 - burdenPenalty) + 0.10 * structuralBonus

Where:
  coverage       = usedCount / userIngredientCount
  precision      = usedCount / totalRecipeIngredients  
  burdenRatio    = (totalRecipeIngredients - usedCount) / userIngredientCount
  maxBurdenRatio = 0.75 (<=3 user ings) | 1.0 (<=5) | 1.5 (6+)
  burdenPenalty  = min(burdenRatio / maxBurdenRatio, 1)
  structuralBonus = +0.05 if protein matched, +0.05 if <=3 non-staple missed
```

---

### Part 1: Fix Debug to Show Real Step 2 (Backend)

**File: `supabase/functions/debug-matching/index.ts`**

Replace the fake Step 2 simulation with a REAL dry-run that:

1. **Translates** Hebrew ingredients to English via MyMemory API (same as main function)
2. **Calls Spoonacular** `findByIngredients` endpoint with the translated ingredients
3. **Applies** `scoreCandidatesWithChefLogic` (same rules as main function)
4. **Returns** full raw data:

```text
step2_live: {
  translationMap: { "אורז": "rice", "עוף": "chicken", ... }
  spoonacularUrl: "https://api.spoonacular.com/recipes/findByIngredients?..."
  spoonacularRawResponse: [ { id, title, usedCount, missedCount, usedIngredients, missedIngredients } ]
  afterChefLogic: [ { title, status, rejectionReason, finalScore, ... } ]
  candidatesBeforeFilter: number
  candidatesAfterFilter: number
}
```

This makes every API call and its result visible on the debug page.

---

### Part 2: Enhanced Debug UI (Frontend)

**File: `src/pages/DebugMatching.tsx`**

Add three new sections to the debug page:

1. **Formula Reference Card** (always visible at top):
   - Shows the exact scoring formula with all weights
   - Shows current maxBurden based on ingredient count
   - Shows which ingredients are detected as anchors vs staples

2. **Step 2 Live Analysis Card**:
   - **Translation Table**: Hebrew input -> English output per ingredient (shows MyMemory result)
   - **Spoonacular Raw Response**: Table showing each candidate with `usedCount`, `missedCount`, `usedIngredients`, `missedIngredients` as returned by the API
   - **Post-Chef-Logic Table**: Same candidates but after filtering, showing accept/reject + reason
   - **API URL**: The exact Spoonacular URL called (with API key masked)

3. **Per-Recipe Score Drill-Down** (expandable rows in accepted tables):
   - Click a recipe row to see: coverage value, precision value, burdenRatio, burdenPenalty, structuralBonus, and how they combine into finalScore

---

### Part 3: Friendly AI Suggestion UX

**File: `src/components/RecipeCarousel.tsx`**

When `showAIButton` is true (Step 3 fallback) or when showing partial matches:

1. **Friendly message with fade-in**: Replace the current plain text with an animated banner:
   - Text: "מצאנו נקודת התחלה מצוינת בשבילך!" ("We found a great starting point for you!")
   - "בסיס מצוין" ("Great Base") tag on the recipe card
   - Smooth `motion.div` fade-in animation

2. **Magic Chef Card**: A gradient card (violet-to-purple) displayed above or below the partial match:
   - Text: "מעדיפים התאמה מושלמת? צרו מתכון מותאם אישית עם AI על בסיס המצרכים שלכם!"
   - Sparkle icon button that triggers `onGenerateAI`
   - Subtle sparkle/glow animation on the button

3. **Badge system update**: Add "בסיס מצוין" to `badgeStyles` and `badgeEmoji` maps with a warm blue/teal style

---

### Technical Details

**Debug Edge Function changes:**

The function needs to:
- Import and use `SPOONACULAR_API_KEY` from secrets
- Call MyMemory translate API (same `translateText` function as main)
- Call Spoonacular `findByIngredients` 
- Apply the same `scoreCandidatesWithChefLogic` filtering
- Return all raw data without saving anything or deducting credits

**New response shape additions:**
```text
{
  // ... existing fields ...
  step2_live: {
    translationMap: Record<string, string>,
    spoonacularUrl: string,           // API key masked
    rawCandidates: SpoonacularCandidate[],
    afterChefLogic: DebugRecipeResult[],
    candidatesBeforeFilter: number,
    candidatesAfterFilter: number,
    error: string | null
  },
  formula: {
    weights: { coverage: 0.55, precision: 0.20, burden: 0.15, structural: 0.10 },
    maxBurden: number,
    maxBurdenRatio: number,
    description: string
  }
}
```

**RecipeCarousel changes:**

- Add "בסיס מצוין" badge style (teal gradient)
- Wrap single-recipe + showAIButton block with friendly message and Magic Chef card
- Use `framer-motion` for fade-in animation (already imported)

---

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/debug-matching/index.ts` | Add real Spoonacular dry-run, translation mapping, formula metadata |
| `src/pages/DebugMatching.tsx` | Formula card, Step 2 live analysis with translation table and raw API data, expandable score drill-down |
| `src/components/RecipeCarousel.tsx` | "Great Base" badge, friendly message banner, Magic Chef AI promotion card with sparkle animation |

### Deployment
- Redeploy `debug-matching` edge function
- No database changes needed

