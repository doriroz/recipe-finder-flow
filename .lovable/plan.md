

## Fix Credit Error Handling and Improve User Experience

### Problem
Two issues are happening when you try to generate a recipe:

1. **You have 1 credit remaining, but recipe generation needs 2 credits** -- this is the actual cause of the error
2. **The app shows a generic error message** ("שגיאה ביצירת המתכון. נסו שוב") instead of the real one ("אין מספיק קרדיטים") because the edge function returns a 403 status, which the Supabase client treats as a thrown error -- the response body with the actual message is never read

### Solution

**1. Fix `useGenerateRecipe.ts` to extract the real error message from non-2xx responses**

Currently the code does:
```
if (error) {
  toast.error("שגיאה ביצירת המתכון. נסו שוב.");
  return;
}
```

The Supabase `functions.invoke` wraps non-2xx responses as a `FunctionsHttpError` object. The actual response body (with the credit message) can be read from `error.context.json()`. We will update the error handler to:
- Check if the error is a `FunctionsHttpError`
- Extract the JSON body from the response context
- Show the real error message (e.g., "אין מספיק קרדיטים") to the user via toast

**2. Add credits to your account via a database update**

Run a SQL update to give you more credits so you can continue testing:
```sql
UPDATE user_credits
SET credits_remaining = 10
WHERE user_id = '6fdb9b43-2072-4274-a177-cd98d48088fa';
```

### Technical Details

**File: `src/hooks/useGenerateRecipe.ts`** (lines 31-35)

Replace the generic error handling:
```typescript
if (error) {
  console.error("Edge function error:", error);
  // Try to extract the real error message from the response
  let errorMessage = "שגיאה ביצירת המתכון. נסו שוב.";
  try {
    const errorBody = await error.context?.json?.();
    if (errorBody?.error) {
      errorMessage = errorBody.error;
    }
  } catch {}
  toast.error(errorMessage);
  return;
}
```

This way, when the edge function returns "אין מספיק קרדיטים (נדרשים 2, נותרו 1)", users will see exactly that message instead of a confusing generic error.

**Database: Reset credits for your account**

A one-time SQL update to restore your credits to 10.

