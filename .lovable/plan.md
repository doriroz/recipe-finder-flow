

## Fix Nonsensical Recipe Instructions

### Root Cause
Spoonacular sometimes returns troll/joke recipes (e.g., "apologize to the egg", "glue with Fevikol"). The AI translator faithfully translates this nonsense to Hebrew, caches it permanently, and saves it to the user's DB. There is no validation layer.

### Three-Part Fix

#### 1. Add instruction validation in the edge function
**`supabase/functions/search-recipe/index.ts`**:
- Add a `validateInstructions()` function that checks each Spoonacular recipe's **original English** instructions BEFORE translation
- Reject recipes where instructions contain known troll patterns: "sorry", "apologize", "fevicol", "fevikol", "glue", "message kijiye", non-Latin scripts (Hindi/Urdu), excessive dots (`....`), or are clearly not cooking instructions
- Also reject if total instruction text is too short (<50 chars) or a single step is too long (>500 chars) without proper sentence structure
- If a recipe fails validation, **skip it entirely** and request more from Spoonacular (increase `number` param by 1-2)

#### 2. Clean up corrupted data
- **Delete the corrupted recipe** (`de916c6a-...` "חביתה בלחם") from the `recipes` table
- **Delete the corrupted translation cache entry** (the Hindi/troll text) from `translation_cache`
- Need to add DELETE RLS policy on `recipes` table first so users can delete their own recipes

#### 3. Delete duplicate saved recipes
- Clean up the many duplicate "חביתה עם ירקות" entries, keeping only the most recent one

### DB Changes
1. **Add DELETE policy on `recipes`** — so users can delete their own recipes (needed for cleanup and future use)
2. **Delete corrupted recipe** `de916c6a-a554-4a64-9b41-4139da02724c`
3. **Delete corrupted cache entries** containing troll text
4. **Delete duplicate recipes** keeping newest per title

### Edge Function Validation Logic
```text
function isNonsenseInstruction(steps: string[]): boolean
  - Check for non-Latin/non-cooking scripts (Hindi, Arabic chars in English text)
  - Check for troll keywords: "sorry", "apologize", "glue", "fevicol", "message"
  - Check for excessive punctuation patterns (4+ dots in a row)
  - Check if average step length < 10 chars
  - Return true if any check fails
```

Apply this BEFORE translation to avoid caching bad translations.

