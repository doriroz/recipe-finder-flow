

## Replace MyMemory with AI Translation + DB Cache

### Overview

Replace unreliable MyMemory translation with AI translation via the Lovable Gateway, and cache every translation in a new `translation_cache` DB table. On subsequent requests, cached translations are served instantly (no AI call, no cost). Over time, nearly all translations come from cache for free.

### Step 1: Create `translation_cache` table

New table with columns:
- `id` (uuid, primary key)
- `source_text` (text, not null) -- the English text
- `translated_text` (text, not null) -- the Hebrew result
- `lang_pair` (text, not null, default `'en|he'`)
- `created_at` (timestamptz, default now())

Add a unique index on `(source_text, lang_pair)` for fast lookups and to prevent duplicates.

RLS: Allow SELECT for everyone (public cache), INSERT/UPDATE only via service role (edge functions use `supabaseAdmin`).

### Step 2: Update `generate-and-save-recipe/index.ts`

1. **Remove** `translateEach` function (lines 41-48)
2. **Keep** `translateText` (MyMemory) only for Hebrew-to-English direction (ingredient input to Spoonacular, line 345)
3. **Add** `translateRecipeWithAI` function:
   - Takes `apiKey`, `supabaseAdmin`, `title`, `ingredients` (name + unit), `steps`
   - First, checks `translation_cache` for each text. Any cache hits are used directly
   - For cache misses: sends one AI call to `ai.gateway.lovable.dev` with all untranslated texts
   - Saves all new translations back to `translation_cache`
   - Returns fully translated recipe data (title, ingredient names, units, steps)
4. **Update** `fetchRecipeFromSpoonacular` (line 334):
   - Accept `apiKey` and `supabaseAdmin` parameters
   - Replace `translateEach(textsToTranslate, "en|he")` (line 385) with `translateRecipeWithAI`
   - Units (`ing.unit`, line 394) will now also be translated (currently passed through in English)
5. **In main handler** (line 540): pass `LOVABLE_API_KEY` and `supabaseAdmin` to `fetchRecipeFromSpoonacular`
6. **Log** translation usage: `logAiUsage(supabaseAdmin, userId, "translation", tokensUsed, 0, "ai")` -- 0 credits to user

### Step 3: Update `search-recipe/index.ts`

1. **Keep** `translateText` (MyMemory) for Hebrew-to-English search query (line 137) -- works fine for short Hebrew terms
2. **Add** same `translateRecipeWithAI` function with DB cache logic
3. **Replace** the per-string MyMemory loop (lines 158-162) with `translateRecipeWithAI`
4. **Units** in search results (line 171) will also be translated
5. Requires reading `LOVABLE_API_KEY` from `Deno.env.get("LOVABLE_API_KEY")`

### How the Cache Works

```text
Recipe comes from Spoonacular (English)
          |
          v
Check translation_cache for each text
          |
     +----+----+
     |         |
  Cache HIT  Cache MISS
  (use it)    (collect)
     |         |
     |         v
     |    One AI call for all misses
     |         |
     |         v
     |    Save to translation_cache
     |         |
     +----+----+
          |
          v
    Return Hebrew recipe
```

- First time "olive oil" appears: AI translates, saved to cache
- Every future recipe with "olive oil": instant from DB, no AI cost
- Common ingredients/units get cached quickly (first few days)
- After ~50-100 recipes, most translations come from cache

### AI Translation Prompt

```text
System: You are a cooking/food translator. Translate from English to Hebrew.
Return a JSON object with a "translations" array matching the input order.

User: {"texts": ["Penne Arrabiata", "penne pasta", "cups", "parsley", "sprigs", "Boil the pasta until al dente."]}
```

Response:
```json
{"translations": ["פנה אראביאטה", "פסטה פנה", "כוסות", "פטרוזיליה", "ענפים", "הרתיחו את הפסטה עד שתהיה אל דנטה."]}
```

### Cost

- Only cache misses trigger AI calls (~300-500 tokens each)
- After initial ramp-up, most requests are 100% cached (zero cost)
- For 100 users/day: estimated $0.10-$0.50/month (much less than before due to caching)
- User credits: 0 deducted for translation

### Files Changed

- **Migration**: Create `translation_cache` table with unique index
- **`supabase/functions/generate-and-save-recipe/index.ts`**: Replace MyMemory with AI + cache for en-to-he
- **`supabase/functions/search-recipe/index.ts`**: Same replacement

