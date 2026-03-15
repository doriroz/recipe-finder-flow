

## Navigation Flow Analysis

### Current Flow Summary

| From | To | Trigger |
|---|---|---|
| Home | /ingredients | "Fridge Challenge with AI" button |
| Home | /categories | "Search Recipe" button (logged-in only) |
| Home | /challenges | Feature card click |
| Home | /cookbook | Feature card click |
| /ingredients | /recipe | AI generates recipe |
| /categories | /recipe | Click any search/category result |
| /recipe | /cooking | "Start Cooking" button |
| /cooking | /complete | Finish last step |
| /cooking | / (Home) | Exit button |
| /challenges | /recipe (via AI) | "Retry" button triggers generateRecipe |
| /challenges | /cooking | "Cook This" button |

### Issues Found

#### 1. CookingMode exit goes to Home, not back to recipe
When a user exits cooking mode mid-way, they're sent to `/` (Home) instead of back to `/recipe`. This breaks the expected back-navigation. They lose context of which recipe they were viewing.

#### 2. FridgeChallenges "Cook This" navigates to /cooking without recipe context
The "Cook This" button navigates to `/cooking?id={recipe_id}`, but if the `recipe_id` is null (challenge saved without a recipe), it would break. There is no null guard.

#### 3. PostCooking has no clear "next" navigation
After completing cooking (`/complete`), the page has no visible navigation path back to Home or to the recipe. This is a dead-end unless the user manually navigates.

#### 4. Redundant back paths from RecipeResult
`RecipeResult` uses `location.state.from` to determine the back button destination, defaulting to `/ingredients`. This works but creates an implicit coupling -- if a new page links to `/recipe` without setting `from`, the back button goes to `/ingredients` even if the user came from elsewhere.

#### 5. FridgeChallenges "Retry" creates a potential loop
Clicking "Retry" on a challenge triggers `generateRecipe()`, which navigates to `/recipe` with new results AND saves a new fridge challenge. This means each retry creates a duplicate challenge entry, potentially filling the challenges page with near-identical cards.

### Recommended Fixes

1. **CookingMode exit**: Navigate to `/recipe?id={recipeId}` instead of `/` so the user returns to their recipe.
2. **FridgeChallenges null guard**: Disable "Cook This" when `recipe_id` is null.
3. **PostCooking navigation**: Add a "Back to Home" button and optionally a "Save to Gallery" CTA.
4. **Retry deduplication**: Skip saving a new fridge challenge when the generation was triggered from a retry (pass a flag like `skipChallengeSave`).

