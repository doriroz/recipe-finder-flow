

## Fix: Incorrect Measurements and Duplicate Substitutions

### Problem 1: Measurements in Imperial Units

The recipe shows "1 פאונד פסטה פנה" (1 pound penne pasta) and "½ פאונד חמאה" (half pound butter). These are raw Spoonacular values transliterated to Hebrew instead of converted to metric units that Israeli users expect.

**Root cause**: In `fetchRecipeFromSpoonacular`, the ingredient amounts and units are taken directly from Spoonacular (`ing.amount`, `ing.unit`) and only translated. No unit conversion happens.

**Fix**: Add an imperial-to-metric conversion step before translation.

- Convert pounds to grams (1 lb = 454g)
- Convert ounces to grams (1 oz = 28g)  
- Convert fluid ounces to ml (1 fl oz = 30ml)
- Convert cups to ml for liquids or grams for solids (approximate: 1 cup = 240ml)
- Convert tablespoons/teaspoons to Hebrew equivalents directly (tbsp = "כף", tsp = "כפית") -- skip AI translation for these
- Round converted amounts to clean numbers (e.g., 227g becomes 230g, 420g stays 420g)

This conversion happens in `fetchRecipeFromSpoonacular` at line 551-555, before the AI translation call.

### Problem 2: Duplicate Substitutions

The "Smart Substitutions" section shows 4 cards all for "חמאה" (butter):
- חמאה -> שמן זית
- חמאה -> מרגרינה  
- חמאה -> שמן קוקוס
- חמאה -> מרגרינה טבעונית

This happens because the DB has 5 entries for butter, and `findSubstitutionsFromDB` returns up to 4 matches. All 4 slots get used by the same ingredient.

**Fix**: In `findSubstitutionsFromDB`, limit to **1 substitution per original ingredient**. This way, if the recipe has 4 different ingredients with substitutions, the user sees 4 diverse suggestions instead of 4 variations of the same one.

- After matching, group results by `original` ingredient
- Take only the first (best) alternative per original
- Then slice to max 4 total

### Files Changed

- `supabase/functions/generate-and-save-recipe/index.ts`:
  1. Add `convertToMetric(amount, unit)` helper function
  2. Apply conversion in `fetchRecipeFromSpoonacular` before translation
  3. For known Hebrew units (tbsp/tsp), skip AI translation and use direct mapping
  4. In `findSubstitutionsFromDB`, deduplicate by original ingredient (1 sub per ingredient)

### Unit Conversion Table

```text
pound/lb     -> grams (x454, round to nearest 10)
ounce/oz     -> grams (x28, round to nearest 5)  
cup/cups     -> ml (x240) or keep as כוס/כוסות
tablespoon   -> כף/כפות (direct Hebrew, no AI needed)
teaspoon     -> כפית/כפיות (direct Hebrew, no AI needed)
quart        -> ml (x946)
pint         -> ml (x473)
```

### Substitution Dedup Example

Before (current):
- חמאה -> שמן זית
- חמאה -> מרגרינה
- חמאה -> שמן קוקוס
- חמאה -> מרגרינה טבעונית

After (fixed):
- חמאה -> שמן זית
- פסטה -> אטריות אורז (if pasta is in recipe)
- נקניקיות -> טופו מעושן (if sausage is in recipe)
- תפוחי אדמה -> בטטה (if potato is in recipe)

