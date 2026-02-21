

## Replace AI with Spoonacular + MyMemory Translation in Recipe Search

### What Changes
The "Find a Recipe" search function currently uses Gemini AI (costs credits) to generate recipe suggestions when fewer than 3 results are found in your saved recipes. We will replace this with:
- **Spoonacular API** to find real, verified recipes (already configured)
- **MyMemory Translation API** (free, no key needed) to translate results from English to Hebrew

### Why MyMemory over LibreTranslate
- Completely free, no API key required
- 5,000 characters per day (anonymous) -- enough for roughly 10 recipe searches daily
- More stable than LibreTranslate's public instance
- If the daily limit is reached, recipes will display in English as a fallback (the app won't break)

### How It Works

```text
User searches "pasta" 
    |
    v
Search saved recipes in DB (unchanged)
    |
    v
Fewer than 3 results?
    |--- No --> Return results (done)
    |--- Yes --> Call Spoonacular complexSearch API
                    |
                    v
                Translate titles, ingredients, instructions
                via MyMemory (free, no key)
                    |
                    v
                Return combined results sorted by difficulty
```

### Fallback Behavior (When Translation Limit Reached)
- Spoonacular results will still appear, just in English
- The app continues to work normally -- no errors, no crashes
- A small note could indicate the recipe is from an external source

### Technical Details

**File modified: `supabase/functions/search-recipe/index.ts`**

Replace lines 107-173 (the AI generation block) with:

1. **`translateText` helper function** -- calls `https://api.mymemory.translated.net/get?q=TEXT&langpair=en|he`
   - Returns translated text on success
   - Returns original English text on failure (graceful fallback)

2. **Spoonacular search logic:**
   - Call `https://api.spoonacular.com/recipes/complexSearch` with:
     - `query` = search term (translated to English first via MyMemory)
     - `number` = 3 minus existing results count
     - `addRecipeInformation=true`
     - `fillIngredients=true`
     - `instructionsRequired=true`
   - Uses existing `SPOONACULAR_API_KEY` secret

3. **Batch translation** -- combine title + ingredient names + instruction steps into one MyMemory call (newline-separated) to minimize API usage

4. **Map Spoonacular fields to existing `RecipeResult` interface:**
   - `title` -- translated to Hebrew
   - `extendedIngredients` mapped to `ingredients` array (names translated)
   - `analyzedInstructions[0].steps` mapped to `instructions` (translated)
   - `readyInMinutes` mapped to `cooking_time`
   - `difficulty` -- estimated from cooking time + step count
   - `source` -- set to `"generated"` (to distinguish from user's saved recipes)

5. **Remove `LOVABLE_API_KEY` dependency** from this function entirely -- no AI credits consumed

**No other files need to change** -- the frontend (`RecipeSearchOverlay`, `useRecipeSearch`) already handles the `RecipeResult` interface as-is.

