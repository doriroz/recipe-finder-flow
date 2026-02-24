
Goal: make recipe selection feel like a true “best match” to the 5 ingredients the user picked, so the generated recipe and smart substitutions are clearly connected.

What I found from your latest run:
- Request sent: ["עגבניה","תפוח אדמה","עוף","אורז","פסטה"]
- Function selected: “Hearty Minestrone Soup”
- It used 4 of your 5 ingredients, but still had 12 missed ingredients (18 total)
- Current selection logic sorts only by `usedIngredientCount`, so a recipe can win even if it needs many extra ingredients.
- Current acceptance threshold is too loose (`minRequired = max(2, ceil(30% of user list))`), which passes recipes that still feel far from your input.

Implementation plan

1) Tighten ingredient matching quality in Spoonacular candidate selection
- File: `supabase/functions/generate-and-save-recipe/index.ts`
- In `fetchRecipeFromSpoonacular(...)`, replace the “sort by usedIngredientCount only” with a composite scoring model that rewards overlap and penalizes extra required ingredients.
- For each candidate from `findByIngredients`, compute:
  - `used = usedIngredientCount`
  - `missed = missedIngredientCount`
  - `coverage = used / userCount` (how much of your selected list is used)
  - `precision = used / (used + missed)` (how focused the recipe is on your selected set)
  - weighted score (example): `score = coverage * 0.7 + precision * 0.3`
- Sort by this score (not just used count), with deterministic tie-breakers:
  1) higher score
  2) higher used
  3) lower missed

2) Add hard rejection rules so “18-ingredient detours” are blocked
- Keep existing “minimum used ingredients” rule, but strengthen it.
- Add additional guardrails before accepting best candidate:
  - minimum coverage (for example `>= 0.6` for 5 selected ingredients)
  - minimum precision (for example `>= 0.35`)
  - maximum missed ingredients cap (for example `<= userCount + 3`)
- If best candidate fails these guards, return “no matching recipe” instead of serving a weak match.
- This is better UX than returning a recipe that feels unrelated.

3) Improve Spoonacular query parameters for practical match size
- Keep `ranking=1` and `number=5`.
- Add `ignorePantry=true` in `findByIngredients` request to avoid over-penalizing pantry staples and improve meaningful matching.
- Optionally increase candidates to `number=8` if needed for better choices before filtering.

4) Normalize translated ingredient input before Spoonacular call
- Current logs show MyMemory output like `"Potatoes. "` and `"Chicken."`.
- Add normalization on translated ingredient strings:
  - trim whitespace
  - remove trailing punctuation (`. , ; :`)
  - collapse double spaces
- This improves query quality and avoids accidental mismatch due to punctuation artifacts.

5) Upgrade diagnostics so we can tune quickly with real logs
- Expand candidate logging to include:
  - used, missed, coverage, precision, final score
  - rejection reason when a candidate is discarded
- Keep selected recipe log explicit:
  - “selected X because coverage=..., precision=..., missed=...”
- This makes production debugging straightforward if users still report weak matches.

6) Keep substitutions logic unchanged (by design)
- Substitutions should remain based on the selected recipe ingredients.
- Once recipe matching quality improves, substitution relevance will improve automatically.

Technical change scope
- Primary file: `supabase/functions/generate-and-save-recipe/index.ts`
- No DB schema changes required
- No frontend changes required for this fix

Validation plan after implementation
1) Reproduce with your exact set:
- tomato, potato, chicken, rice, pasta
- Expect either:
  - a tighter recipe with materially fewer extra ingredients, or
  - a clear “no good match found” response (instead of unrelated 18-ingredient recipe)

2) Run 3 scenario checks:
- 5 mixed ingredients (protein + carb + veg)
- 3 focused ingredients (e.g., chicken + rice + onion)
- 2 ingredients (ensure fallback still works and not over-restrictive)

3) Confirm substitutions feel connected:
- substitutions should reference ingredients that actually appear in the accepted recipe

Risk and mitigation
- Risk: thresholds too strict may return “no match” too often.
- Mitigation:
  - start with moderate values
  - inspect logs for score distribution
  - adjust weights/caps quickly without architectural changes
