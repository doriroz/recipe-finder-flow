

## Fix Camera Button + Category Dialog Colors

### Issue 1: Camera button navigates to wrong page
The camera icon button on `/select-ingredients` (line 137) navigates to `/ingredients` — an old page. It should instead open an inline image-upload panel directly on the current page, similar to how `/ingredients` handles its "photo" tab.

**Fix:** Replace the `navigate("/ingredients")` with an in-page Dialog or inline section that shows the `ImageUpload` component and a "Generate recipe from photo" button. This keeps the user on `/select-ingredients` and provides the photo-to-recipe flow right there.

### Issue 2: Category dialog uses color only in header
Currently the category Dialog only applies the category's hue color to the header area (line 307). The ingredient list items and the confirm button area are plain white/default.

**Fix:** Brush the entire dialog with the category color:
- Give each ingredient row a subtle tinted background on hover using the category hue (e.g., `hsl(hue / 10%)`)
- Tint the selected/checked rows with the category color instead of generic `bg-accent`
- Apply a light category-colored background to the footer/confirm area
- Use the category hue for the confirm button's background instead of the default hero variant

### Files to edit
- **`src/pages/SelectIngredients.tsx`** — both changes happen here:
  1. Add `ImageUpload` import + state for `imageBase64` + a Dialog/section for the camera flow that calls `generateRecipe({ imageBase64 })`
  2. Update the category Dialog to pass category hue colors into row backgrounds, hover states, selected states, and the footer area

### No new files or dependencies needed.

