

## Add "Create a Cookbook" Feature Card to Landing Page

### What
Add a 4th feature card to the landing page's features grid, promoting the cookbook builder. It will match the existing card style with an emoji icon, title, and description.

### Changes

**`src/pages/LandingPage.tsx`**:
1. Add a 4th item to the `features` array:
   - `{ icon: "📖", title: "צרו ספר מתכונים", description: "אספו מתכונים והפכו אותם לספר אישי" }`
2. Update the grid from `md:grid-cols-3` to `md:grid-cols-4` so all four cards fit in one row.
3. Optionally make the cookbook card clickable, navigating to `/cookbook`.

