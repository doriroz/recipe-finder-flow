## Completed: Navigation Flow Fixes

### What was done

1. **CookingMode exit**: Now navigates to `/recipe?id={recipeId}` instead of `/` so users return to their recipe context
2. **FridgeChallenges null guard**: Already existed (line 223) — no change needed
3. **PostCooking navigation**: Already had Home button — no change needed
4. **Retry deduplication**: Added `skipChallengeSave` flag to `useGenerateRecipe`; FridgeChallenges retry passes `skipChallengeSave: true` to prevent duplicate challenge entries
