

## Restrict Credit Reset to Admin Only

### Problem
Currently any authenticated user can reset their own credits to 10 for free via the profile page. The requirement is that only administrators can reset credits; regular users would need to pay.

### Changes

**1. Edge Function (`supabase/functions/reset-credits/index.ts`)**

Add admin check after authenticating the user:
- Use the `adminClient` (service role) to query `user_roles` table for the calling user
- If the user does not have the `admin` role, return 403 with a message like "רק מנהלים יכולים לאפס קרדיטים" (Only admins can reset credits)
- Optionally accept a `target_user_id` in the request body so an admin can reset credits for any user (defaults to the admin's own ID)

**2. User Profile Page (`src/pages/UserProfile.tsx`)**

- Remove the "Reset Credits" button and `handleResetCredits` function entirely for regular users
- Conditionally show the reset button only if the user is an admin (using the existing `useIsAdmin` hook)
- For non-admin users, replace the reset button with a message like "לרכישת קרדיטים נוספים, צרו קשר" (To purchase more credits, contact us) or a future payment link

### Technical Details

**Edge Function changes:**
```typescript
// After getting userId from claims, check admin role
const { data: roleData } = await adminClient
  .from("user_roles")
  .select("role")
  .eq("user_id", userId)
  .eq("role", "admin")
  .maybeSingle();

if (!roleData) {
  return new Response(
    JSON.stringify({ error: "רק מנהלים יכולים לאפס קרדיטים" }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Optionally allow admin to reset for another user
const body = await req.json().catch(() => ({}));
const targetUserId = body.target_user_id || userId;
```

**Profile page changes:**
- Import `useIsAdmin` hook
- Wrap the credit reset section: show reset button only when `isAdmin` is true
- For regular users, show remaining credits count and a "contact us" message instead

