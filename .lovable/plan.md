# Refactor Signup to Server-Side Edge Function

## Goal

Replace the client-side `supabase.auth.signUp(...)` call in `src/pages/Login.tsx` with a server-side Edge Function that uses the `SUPABASE_SERVICE_ROLE_KEY` to create users via the Admin API with `email_confirm: true`. After creation, the client signs the user in with email/password so a normal session is established.

## Why this approach

- `email_confirm: true` (Admin API) marks the user as already verified — no confirmation email required, no dependency on Supabase's email rate limits or SMTP.
- Service role stays server-side only (never reaches the browser).
- Centralizes signup policy (validation, future rate limiting, future profile/role creation) in one controlled place.

## Changes

### 1. New Edge Function: `supabase/functions/signup/index.ts`

Responsibilities:
- Accept `POST { email, password }` (JSON).
- CORS handling (OPTIONS + headers on every response).
- Validate input with Zod:
  - `email`: valid email, max 255
  - `password`: min 6, max 72 (Supabase's bcrypt limit)
- Create an admin client with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
- Call `admin.auth.admin.createUser({ email, password, email_confirm: true })`.
- Map errors to friendly Hebrew messages (already-registered, weak password, invalid email, generic).
- Return `{ success: true }` on 200, `{ error: "<hebrew>" }` on 400/409/500.
- Do NOT return the user object or any tokens (client will sign in next).

Notes:
- No JWT verification needed (public signup endpoint). Will not modify `supabase/config.toml` — Lovable defaults to `verify_jwt = false`, which is what we want here.
- No new secrets needed — `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` already exist.

### 2. Update `src/pages/Login.tsx`

In the `signup` branch of `handleSubmit`:
- Replace `supabase.auth.signUp(...)` with `supabase.functions.invoke("signup", { body: { email, password } })`.
- On success, immediately call `supabase.auth.signInWithPassword({ email, password })` to establish a session.
- On success of sign-in: toast "ברוכים הבאים! 🎉" and `navigate(redirectTo, { replace: true })` (matches login flow — no more "check your email" message since confirmation is bypassed).
- Extend the existing friendly-error mapping to handle the new error strings returned by the function (already-registered → "כבר קיים חשבון…", weak password → existing "Password should be" branch, etc.).

No other files change. `useAuth` continues to work via `onAuthStateChange`.

## Security considerations

- Service role key remains server-side only (Edge Function env).
- Endpoint is intentionally public (anyone can sign up — same posture as the previous client-side `signUp`). If you later want to throttle abuse, we can add per-IP rate limiting in the function; out of scope here.
- Input validated with Zod before hitting the Admin API.
- Function returns no tokens or sensitive user fields.

## Out of scope

- Password reset flow (still uses `resetPasswordForEmail` directly — unchanged).
- Login flow (unchanged — still client-side `signInWithPassword`).
- Profile/roles table creation on signup (none exists today; not adding now).
- SMTP / Resend configuration (separate dashboard task you already have).

## Files touched

- `supabase/functions/signup/index.ts` (new)
- `src/pages/Login.tsx` (signup branch only)
