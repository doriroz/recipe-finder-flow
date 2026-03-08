

## Plan: AI-Only Recipe Generation + Free Tries System + Upgrade Page

### Summary
Replace the existing local+Spoonacular matching pipeline with AI-only generation. Users get 3 free AI recipe generations (resetting daily). On the 4th attempt, redirect to a new `/upgrade` page that also serves as the payment page for cookbook purchases.

### Changes

#### 1. New Page: `/upgrade` (Upgrade/Payment Page)
**File: `src/pages/Upgrade.tsx`** (new)

A shared upgrade page for:
- Purchasing more AI recipe credits
- Purchasing printed/premium cookbook

Includes:
- Friendly Hebrew copy explaining the value
- Pricing cards (e.g., "10 credits" / "unlimited monthly" — mocked for now)
- A section for cookbook purchase (reuse existing export options from `CookbookCheckout`)
- Back button to home

**File: `src/App.tsx`** — Add `<Route path="/upgrade" element={<Upgrade />} />`

#### 2. Simplify Edge Function: AI-Only Generation
**File: `supabase/functions/generate-and-save-recipe/index.ts`**

Replace the main pipeline (lines 967-1198) — remove local DB scoring, Spoonacular API calls, and merging logic. Instead:
- Translate ingredients Hebrew → English
- Call the existing `generateCreativeFallback()` AI function directly
- Save to `recipes` table
- Return single recipe with `reliability_score: "creative"` and `source: "ai"`
- Keep the `forceCreative` path as-is (it already does this)
- Keep image analysis path as-is
- Credit cost: 0 for the first 3 daily tries, then blocked

#### 3. Daily Free Tries Tracking
**Edge function logic change**: Instead of the current credit deduction for recipe generation (currently 0 credits), count daily AI recipe generations per user from `ai_usage_logs`. If count >= 3 today, return a specific error code/message like `{ error: "tries_exhausted", redirect: "/upgrade" }`.

No DB schema change needed — `ai_usage_logs` already tracks `action_type` and `created_at` per user. We count rows where `action_type = 'recipe_generation'` and `source = 'ai'` for today.

#### 4. Frontend: Handle "tries exhausted" Response
**File: `src/hooks/useGenerateRecipe.ts`**

When the response contains `tries_exhausted`:
- Show a toast explaining tries are used up
- Navigate to `/upgrade`

#### 5. UI Indicators

**File: `src/components/ingredient-input/SelectedIngredientsBar.tsx`**
- Change CTA button text to indicate AI: "✨ מצא לי מתכון עם AI" 
- Show remaining tries counter below/next to button: "נותרו X ניסיונות היום"

**File: `src/pages/IngredientInput.tsx`**
- Fetch daily usage count to display remaining tries
- Pass `remainingTries` to `SelectedIngredientsBar`

**File: `src/pages/LandingPage.tsx`**
- Change "בואו נתחיל לבשל" button text to something like "✨ בואו נבשל עם AI" to hint at the AI-powered experience

**File: `src/components/CreditCounter.tsx`**
- Update to show daily tries remaining instead of (or alongside) credits

#### 6. Recipe Result: AI Disclaimer
**File: `src/pages/RecipeResult.tsx`**
- Show a banner/notice that the recipe was AI-generated and may need adjustments: "🤖 המתכון נוצר באמצעות בינה מלאכותית — ייתכנו שינויים קלים בכמויות או בשלבים"

### Files to Create/Modify
- **New**: `src/pages/Upgrade.tsx`
- **Modify**: `src/App.tsx` (add route)
- **Modify**: `supabase/functions/generate-and-save-recipe/index.ts` (simplify to AI-only + daily tries check)
- **Modify**: `src/hooks/useGenerateRecipe.ts` (handle tries_exhausted)
- **Modify**: `src/pages/IngredientInput.tsx` (fetch + pass remaining tries)
- **Modify**: `src/components/ingredient-input/SelectedIngredientsBar.tsx` (AI CTA + tries counter)
- **Modify**: `src/pages/LandingPage.tsx` (button text)
- **Modify**: `src/pages/RecipeResult.tsx` (AI disclaimer banner)
- **Modify**: `src/components/CreditCounter.tsx` (show tries)

