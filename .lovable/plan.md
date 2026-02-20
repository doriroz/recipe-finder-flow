
## Fix Credit Error Crash and Add Credit Renewal

### Problem
Two issues:
1. **App crashes (error boundary)** when credits are insufficient -- the toast shows the right message ("אין מספיק קרדיטים") but the app also triggers an error boundary crash. The `error.context.json()` call may be failing because the Supabase client's `FunctionsHttpError.context` is a Response object that could already be consumed, causing an uncaught error.
2. **No way to renew credits** -- when credits run out, there's no option for the user to get more.

### Solution

**1. Fix error handling in `useGenerateRecipe.ts` to prevent crash**

The current code calls `error.context?.json?.()` which can throw if the Response body was already consumed. We need to make this more defensive. Additionally, check `data` first -- Supabase `functions.invoke` may return the error body in `data` even on non-2xx responses.

Updated error handling:
```typescript
if (error) {
  console.error("Edge function error:", error);
  let errorMessage = "שגיאה ביצירת המתכון. נסו שוב.";
  try {
    // Try reading from error.context (Response object)
    if (error.context && typeof error.context.json === 'function') {
      const errorBody = await error.context.json();
      if (errorBody?.error) errorMessage = errorBody.error;
    }
  } catch (e) {
    // Response may already be consumed, try message
    if (error.message && error.message !== "Edge Function returned a non-2xx status code") {
      errorMessage = error.message;
    }
  }

  // Check if it's a credit error -- show special toast with renewal option
  if (errorMessage.includes("קרדיטים")) {
    toast.error(errorMessage, {
      action: {
        label: "חידוש קרדיטים",
        onClick: () => navigate("/profile"),
      },
      duration: 8000,
    });
  } else {
    toast.error(errorMessage);
  }
  return;
}
```

Also wrap `data` check to handle credit errors:
```typescript
if (data?.error) {
  if (data.error.includes?.("קרדיטים")) {
    toast.error(data.error, {
      action: { label: "חידוש קרדיטים", onClick: () => navigate("/profile") },
      duration: 8000,
    });
  } else {
    toast.error(data.error);
  }
  return;
}
```

**2. Add credit renewal section to User Profile page**

Add a "Credit Management" section to the existing UserProfile page with:
- Current credit balance display
- A "Reset credits" button that calls a new edge function
- Info text explaining daily usage limits

**3. Create `reset-credits` edge function**

A simple edge function that resets the user's credits to 10 (the default). This gives users a self-service way to get more credits.
- Validates authentication
- Updates `credits_remaining` to 10 in `user_credits`
- Returns the updated balance

**4. Enhance `CreditCounter` component**

When credits are 0, show the counter in red with a clickable link to the profile page for renewal.

### Technical Details

**Files to modify:**
- `src/hooks/useGenerateRecipe.ts` -- defensive error handling + credit-specific toast with action button
- `src/components/CreditCounter.tsx` -- red styling at 0 credits, clickable to navigate to profile
- `src/pages/UserProfile.tsx` -- add credit management section with reset button

**Files to create:**
- `supabase/functions/reset-credits/index.ts` -- edge function to reset user credits to 10

**`supabase/config.toml`** -- add `reset-credits` function entry with `verify_jwt = false`
