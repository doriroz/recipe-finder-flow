

## Fix Recipe Matching: Remove Precision Filter, Keep Coverage-Based Ranking

### Problem
With `minPrecision` at 50%, most recipes get rejected because typical recipes have many ingredients beyond what the user selected. This defeats the app's purpose — finding recipes with whatever you have at home. A recipe using 3 out of your 4 ingredients is great even if the recipe itself needs 10 total ingredients.

### Root Cause
**Precision** = "what percentage of the recipe's ingredients did the user provide." A recipe with 10 ingredients where the user has 3 = 30% precision. This metric penalizes complex recipes unfairly.

**Coverage** = "what percentage of the user's ingredients are used." If the user selected 4 and 3 are used = 75% coverage. This is what actually matters for this app.

### Solution
Remove the `minPrecision` threshold entirely. Keep `minCoverage` (60%) as the quality guard, and let the composite score do the ranking. The best-scoring recipe will naturally balance both factors.

### Changes

**Edge Function (`supabase/functions/generate-and-save-recipe/index.ts`)**

- Remove the `minPrecision` variable and its rejection check (lines 622, 632-634)
- Keep `minCoverage = 0.6` and `maxMissed` guards as-is
- This means: at least 60% of the user's ingredients must appear in the recipe, but the recipe can have as many extra ingredients as needed

```text
Before:
  minCoverage = 0.6    -- keep
  minPrecision = 0.50  -- REMOVE
  maxMissed = userCount + 3  -- keep

After:
  minCoverage = 0.6
  maxMissed = userCount + 3
```

The composite score (70% coverage + 30% precision) still ranks recipes that need fewer extra ingredients higher, so the best match is chosen naturally without hard-rejecting everything.

### What stays the same
- Coverage threshold (60%) remains
- maxMissed guard remains
- Scoring formula unchanged
- All frontend code unchanged
- Match badge display unchanged

