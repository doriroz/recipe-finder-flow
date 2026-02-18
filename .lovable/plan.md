
## Redesign: Ingredient Selection Screen — Cleaner UI

### What's Wrong Today (Diagnosis)

Looking at the current page, there are 6 distinct visual zones stacked vertically before the user can even interact:

1. App header (logo + back button + credit counter)
2. Sticky bar with placeholder text + full-width disabled CTA button (~130px)
3. Page title + subtitle
4. Photo upload toggle link
5. Search input
6. Quick Picks large card grid → Category Browser

**Root problems:**
- The sticky bar wastes space when nothing is selected — it shows a disabled orange button taking the full width with a placeholder hint above it
- The CTA button should appear/grow only when at least 1 ingredient is selected
- Quick Picks cards are oversized (72px min-width, tall cards) making the row feel heavy
- Too many section labels ("⭐ מצרכים פופולריים", "📂 עיון לפי קטגוריה") add noise
- No breathing room between sections — everything uses `space-y-6` uniformly

---

### Proposed Changes

#### 1. `SelectedIngredientsBar.tsx` — Collapse when empty
- **When empty**: show only a slim single-line hint ("בחרו לפחות 2 מצרכים") with no CTA button — reduces height from ~130px to ~40px
- **When ≥1 selected**: show chips row + CTA button (current behavior)
- **When ≥2 selected**: CTA becomes fully active (no change to logic)
- This removes the giant disabled button that dominates the top of the page

#### 2. `IngredientInput.tsx` — Simplify page layout
- Remove the standalone `<h1>` title block — the header already names the app and the search input is self-explanatory
- Move the photo toggle into the header row (as a small icon button) instead of a centered link that breaks the visual flow
- Tighten `space-y-4` instead of `space-y-6`
- Remove extra vertical padding

#### 3. `QuickPicksSection.tsx` — Slimmer pill chips
- Replace tall card buttons (72px wide, ~90px tall, with stacked emoji+name) with compact horizontal pill chips
- New style: `emoji + name` on one line, `px-3 py-2 rounded-full`, similar to the selected ingredient chips
- This reduces the Quick Picks row height from ~100px to ~40px — a massive space saving

#### 4. `CategoryBrowser.tsx` — Tighten category rows
- Remove the large section label "📂 עיון לפי קטגוריה" (redundant — the accordion rows are self-explanatory)
- Category rows: reduce padding from `py-3` to `py-2.5`, shrink emoji from `text-xl` to `text-base`
- Ingredient chips inside categories: reduce from `px-3 py-2` to `px-2.5 py-1.5 text-sm`

---

### Technical Implementation Plan

**Files to modify:**

1. **`src/components/ingredient-input/SelectedIngredientsBar.tsx`**
   - Add conditional rendering: if `selected.length === 0`, render a single slim line (`py-2`, no button)
   - If `selected.length >= 1`, render full bar with chips + button

2. **`src/pages/IngredientInput.tsx`**
   - Move camera icon button into the header's right-side div (next to credit counter and logo)
   - Remove the `<div className="text-center">` title block
   - Change `space-y-6` → `space-y-4` on `<main>`

3. **`src/components/ingredient-input/QuickPicksSection.tsx`**
   - Replace tall `flex-col` cards with single-line pill buttons
   - New layout: `flex items-center gap-2 px-3 py-2 rounded-full border shrink-0`
   - Emoji (text-lg) + name (text-sm) side by side

4. **`src/components/ingredient-input/CategoryBrowser.tsx`**
   - Remove `<h3>` section label at the top
   - Reduce vertical padding on trigger rows
   - Reduce chip size inside open categories

---

### Before / After Visual Summary

```text
BEFORE (approximate heights):
┌─────────────────────────────────────┐
│ Header                    ~52px     │
├─────────────────────────────────────┤
│ Sticky Bar (hint + disabled btn)   │
│                           ~130px   │
├─────────────────────────────────────┤
│ Title + subtitle           ~56px   │
├─────────────────────────────────────┤
│ Photo toggle link          ~32px   │
├─────────────────────────────────────┤
│ Search input               ~56px   │
├─────────────────────────────────────┤
│ Quick Picks (tall cards)   ~116px  │
├─────────────────────────────────────┤
│ Section label              ~32px   │
│ Category rows              ...     │
└─────────────────────────────────────┘
Content starts after ~474px of chrome

AFTER (approximate heights):
┌─────────────────────────────────────┐
│ Header (incl. camera icon) ~52px   │
├─────────────────────────────────────┤
│ Sticky Bar (slim hint only) ~40px  │
├─────────────────────────────────────┤
│ Search input               ~56px   │
├─────────────────────────────────────┤
│ Quick Picks (slim pills)   ~48px   │
├─────────────────────────────────────┤
│ Category rows              ...     │
└─────────────────────────────────────┘
Content starts after ~196px of chrome
```

This is a ~278px reduction in initial chrome, meaning users see nearly 3 more category rows before needing to scroll.

---

### No Logic Changes
- Recipe generation, ingredient toggling, custom ingredient addition, and photo mode all remain unchanged
- Mobile bottom sheet for categories remains unchanged
- All existing props/interfaces stay the same
