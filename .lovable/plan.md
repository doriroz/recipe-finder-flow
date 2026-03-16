

## UX Audit: Critical Issues and Fixes

### Audit Summary

After reviewing all pages and components, here are the issues organized by severity.

---

### Critical Issues (to fix now)

#### 1. 404 Page is in English
The NotFound page displays "Oops! Page not found" and "Return to Home" in English, while the entire app is in Hebrew. This is jarring for the target audience (Hebrew-speaking beginner cooks).

**Fix**: Translate to Hebrew, add a friendly emoji, and use a Button component instead of a plain anchor for consistency.

#### 2. No feedback when "Search Recipe" button is hidden for guests
On the landing page, the "חפשו מתכון" button only appears for logged-in users (`{user && ...}`), but there's no indication to guests that this feature exists or that they need to log in. A first-time user sees only one CTA and may not understand there's more functionality available.

**Fix**: Show the button to all users but navigate to `/login` with a toast message for unauthenticated users explaining they need to log in.

#### 3. Feature cards with no link have no visual distinction
Two of the four feature cards on the landing page (`link: null`) are not clickable but look identical to the clickable ones. Only `cursor-pointer` is conditionally applied, which is subtle. A first-time user will click them expecting something to happen.

**Fix**: Add a subtle visual cue (e.g., "בקרוב" / "Coming soon" badge or make them link to relevant pages — "AI Recipes" could link to `/ingredients`, "Smart Substitutions" is a feature within recipes).

#### 4. Login redirects to `/ingredients` instead of previous page
After login, users are always sent to `/ingredients` regardless of where they came from. If they clicked "Search Recipe" while logged out, they'd expect to land on `/categories`.

**Fix**: Pass a `redirectTo` state when navigating to `/login`, and use it after successful login. Default to `/ingredients` if no redirect is specified.

#### 5. SelectedIngredientsBar overlaps tab bar
The sticky `SelectedIngredientsBar` has `top-0 z-20` and the tabs also have `sticky top-0 z-30`. When ingredients are selected, both bars compete for the top position, causing visual overlap.

**Fix**: Give the tab bar a fixed height and set `SelectedIngredientsBar` to `top-[48px]` (below tabs).

#### 6. No confirmation before deleting a fridge challenge
The delete button on challenge cards (`handleDelete`) immediately deletes without confirmation. This is destructive and could frustrate users who accidentally tap it.

**Fix**: Add a confirmation dialog similar to the Gallery delete flow.

---

### Important Issues (to fix now)

#### 7. Gallery header has 4 items in a row causing layout issues
The Gallery header has back button, title, cookbook button, and download button all in one `justify-between` flex row. On mobile, this gets cramped and the title may not center properly.

**Fix**: Group the two action buttons together on one side.

#### 8. UserProfile "average rating" is hardcoded to "4.5"
The stats section shows `⭐ דירוג ממוצע: 4.5` which is always static. This is misleading.

**Fix**: Either calculate from actual ratings or remove this stat until real data is available.

#### 9. Settings button in UserProfile does nothing
The Settings gear icon in the profile header has no `onClick` handler — it's a dead button.

**Fix**: Remove it or link it to a settings section.

---

### Files to Change

1. **`src/pages/NotFound.tsx`** — Full Hebrew translation with home navigation button
2. **`src/pages/LandingPage.tsx`** — Show search button for all users (redirect guests to login); make non-link feature cards link to `/ingredients` for AI recipes
3. **`src/pages/Login.tsx`** — Accept `redirectTo` from location state, use it after login
4. **`src/pages/FridgeChallenges.tsx`** — Add delete confirmation dialog
5. **`src/pages/Gallery.tsx`** — Fix header layout (group action buttons)
6. **`src/pages/UserProfile.tsx`** — Remove hardcoded rating stat; remove dead Settings button
7. **`src/pages/IngredientInput.tsx`** — Fix sticky bar stacking with proper `top` offset

