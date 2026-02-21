

## Replace AI with Spoonacular in "Let's Start Cooking" + Build AI Usage Monitor

### Part 1: Replace AI in `generate-and-save-recipe`

**What changes**: When the local recipe library match is below 70%, instead of calling Gemini AI (2 credits), we'll use Spoonacular's `findByIngredients` API + `recipe information` endpoint to get a real recipe, then translate it to Hebrew using MyMemory (same approach as the search function).

**What you need from me**: Nothing! The `SPOONACULAR_API_KEY` secret is already configured. No new keys or services needed.

**File: `supabase/functions/generate-and-save-recipe/index.ts`**

Current flow (Step 3, lines 501-577):
1. Check/deduct 2 credits
2. Call Spoonacular to verify (uses AI for translation)
3. Call Gemini AI to generate recipe
4. Save to DB

New flow (Step 3):
1. No credits deducted (free!)
2. Translate Hebrew ingredients to English via MyMemory (free)
3. Call Spoonacular `findByIngredients` to find best matching recipe
4. Fetch full recipe details from Spoonacular `recipes/{id}/information`
5. Translate title, ingredients, instructions back to Hebrew via MyMemory
6. Save to DB
7. Log usage with `source: "spoonacular"` and `credits_used: 0`

**Functions removed:**
- `getDifficultyPrompt` (no longer needed)
- `generateRecipeWithAI` (replaced by Spoonacular)
- `translateIngredients` (replaced by MyMemory)
- `verifyWithSpoonacular` (no longer separate -- Spoonacular IS the source now)

**Functions added:**
- `translateText` (MyMemory, same as in search-recipe)
- `fetchRecipeFromSpoonacular` (findByIngredients + get recipe info)

**Fallback**: If Spoonacular returns no results for the given ingredients, return a friendly error message instead of crashing.

**Image analysis** (camera upload) still uses AI -- this is the only remaining AI usage. It requires vision capabilities that Spoonacular doesn't have.

**Source badge**: Recipes from Spoonacular will have `source: "spoonacular"` so the UI can show a distinct badge.

---

### Part 2: AI Usage Monitor

Build a monitor section in the admin analytics page that shows exactly which actions used AI and which didn't.

**File: `src/pages/AdminAnalytics.tsx`**

Add a new "AI Usage Monitor" section with:
- Summary cards: Total AI calls, Total Local matches, Total Spoonacular calls
- Table showing recent `ai_usage_logs` entries with columns: Date, Action, Source (AI/Local/Spoonacular), Credits Used, Tokens Estimated
- Color-coded source badges: Red for AI, Green for Local, Blue for Spoonacular

**File: `supabase/functions/get-analytics/index.ts`**

Add a new section to the analytics response that queries `ai_usage_logs`:
- Count by source (ai, local, spoonacular)
- Count by action_type
- Recent entries (last 50)
- Total credits consumed

---

### Part 3: UI Updates

**File: `src/components/RecipeCard.tsx`**

Add a new "spoonacular" source badge (blue) alongside existing "local" (turquoise) and "ai" (orange) badges.

**File: `src/pages/RecipeResult.tsx`**

Update the `source` type to include `"spoonacular"` in the navigation state.

---

### What still uses AI after this change

| Feature | Uses AI? | Credits |
|---------|----------|---------|
| Recipe from ingredients (Let's Start Cooking) | No -- Spoonacular | 0 |
| Find a Recipe (search) | No -- Spoonacular | 0 |
| Camera/image ingredient extraction | Yes -- Gemini Vision | 3 |
| Substitution validation (fallback only) | Yes -- Gemini (if not in local DB) | 1 |

### Technical Details

**Edge function changes:**
- `generate-and-save-recipe/index.ts`: Major rewrite of Step 3 (lines 501-577) to use Spoonacular + MyMemory instead of Gemini
- `get-analytics/index.ts`: Add AI usage summary query

**Frontend changes:**
- `AdminAnalytics.tsx`: Add AI usage monitor section with table and summary cards
- `RecipeCard.tsx`: Add "spoonacular" source badge
- `RecipeResult.tsx`: Extend source type

**No database changes needed** -- `ai_usage_logs` table already has the `source` column that can store "spoonacular".

