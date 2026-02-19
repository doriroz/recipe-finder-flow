
## Cookbook Draft Auto-Save & Resume Feature

### The Problem

Currently, the entire cookbook builder state lives exclusively in React `useState` inside `useCookbook.ts`. This means:
- If the user selects 8 recipes, customizes the cover title, picks a theme, and then navigates away, closes the tab, or gets distracted — **everything is lost**
- On the next visit to `/cookbook`, they start completely from scratch

### Solution: `localStorage` Draft Persistence

The cleanest, simplest approach is to persist the draft into `localStorage` tied to the logged-in user's ID. This requires no database changes, no new tables, no edge functions — it works entirely on the client side.

**Why `localStorage` and not Supabase?**
- The cookbook draft is large (nested objects with gallery item references) and changes frequently on every click. Syncing to Supabase on every change would be slow and wasteful.
- Gallery items (`UserGalleryItem`) are already stored in Supabase — we only need to save the IDs of selected recipes plus the settings/notes. When resuming, we re-hydrate the full objects from the gallery query.
- `localStorage` is per-browser, which is the correct scope for a draft — the user is on their device building their book.

### What Gets Saved (Draft Schema)

```typescript
interface CookbookDraft {
  userId: string;               // scopes draft to this user
  step: CookbookBuilderStep;    // which step they left on
  selectedItems: string[];      // IDs of chosen gallery items
  recipeOrder: string[];        // ordered IDs (after reordering in customize step)
  personalNotes: Record<string, string>; // galleryItemId → personalNote
  settings: CookbookSettings;  // title, subtitle, theme, toggles
  savedAt: string;             // ISO timestamp for "saved X minutes ago" display
}
```

Note: We do NOT save the full `CookbookRecipe[]` array (which contains the full gallery item objects) — we only save the IDs and notes. The full objects are re-fetched from Supabase on load and re-hydrated.

### Resume Banner UI

When the user visits `/cookbook` and a valid draft exists for their user ID, a banner appears at the top of the selection step:

```
┌──────────────────────────────────────────────────────────────────┐
│  📚  יש לך טיוטה שמורה — 6 מתכונים, נשמרה לפני 2 שעות         │
│  [המשך מהמקום שעצרת]                    [התחל מחדש]             │
└──────────────────────────────────────────────────────────────────┘
```

- "המשך מהמקום שעצרת" → restores the full draft state and jumps to the saved step
- "התחל מחדש" → clears the draft from localStorage and resets to empty state
- If no draft exists → no banner, normal empty start

### Auto-Save Timing

The draft is saved to `localStorage` automatically:
- Whenever `selectedItems` changes
- Whenever `settings` changes
- Whenever `recipes` (notes/order) changes
- Whenever the `step` changes

This is done with a `useEffect` that watches these values and writes to `localStorage` with a debounce of 500ms to avoid excessive writes during rapid changes.

### Technical Implementation

#### 1. `src/hooks/useCookbook.ts` — Add persistence layer

**Storage key:** `cookbook_draft_${userId}` (user-scoped)

**On hook initialization:**
```typescript
// Load draft from localStorage on mount
const loadDraft = (userId: string): CookbookDraft | null => {
  try {
    const raw = localStorage.getItem(`cookbook_draft_${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as CookbookDraft;
  } catch {
    return null;
  }
};
```

**Initial state:** Instead of always starting with `defaultSettings` and empty arrays, the hook will accept a `userId` parameter. On initialization, it checks for a saved draft and sets state from it if found.

**Auto-save effect:**
```typescript
useEffect(() => {
  if (!userId) return;
  const draft: CookbookDraft = {
    userId,
    step,
    selectedItems,
    recipeOrder: recipes.map(r => r.galleryItem.id),
    personalNotes: Object.fromEntries(
      recipes.map(r => [r.galleryItem.id, r.personalNote || ""])
    ),
    settings,
    savedAt: new Date().toISOString(),
  };
  const timer = setTimeout(() => {
    localStorage.setItem(`cookbook_draft_${userId}`, JSON.stringify(draft));
  }, 500);
  return () => clearTimeout(timer);
}, [step, selectedItems, recipes, settings, userId]);
```

**New `clearDraft` function:**
```typescript
const clearDraft = useCallback(() => {
  if (userId) localStorage.removeItem(`cookbook_draft_${userId}`);
  reset(); // existing reset function
}, [userId, reset]);
```

**New exported values:** `hasDraft: boolean`, `draftSavedAt: string | null`, `clearDraft`, `resumeDraft` (restores state from draft + takes gallery items to re-hydrate recipes).

#### 2. `src/pages/CookbookBuilder.tsx` — Show resume banner

- Pass `user?.id` into `useCookbook`
- After gallery loads, call `cookbook.resumeDraft(galleryItems)` if the user clicks "המשך"
- Show the resume banner when `cookbook.hasDraft` is true and step is "select"
- Wire "התחל מחדש" to `cookbook.clearDraft()`
- After checkout completes (cookbook is "done"), call `cookbook.clearDraft()` to clean up

#### 3. Draft Hydration on Resume

When the user clicks "המשך מהמקום שעצרת":

```typescript
const resumeDraft = useCallback((galleryItems: UserGalleryItem[]) => {
  if (!userId) return;
  const draft = loadDraft(userId);
  if (!draft) return;
  
  setSelectedItems(draft.selectedItems);
  setSettings(draft.settings);
  setStep(draft.step);
  
  // Re-hydrate full recipe objects from gallery + restore notes and order
  const orderedRecipes = draft.recipeOrder
    .map((id, index) => {
      const item = galleryItems.find(g => g.id === id);
      if (!item) return null;
      return {
        galleryItem: item,
        pageNumber: index + 1,
        personalNote: draft.personalNotes[id] || "",
      };
    })
    .filter(Boolean) as CookbookRecipe[];
  
  setRecipes(orderedRecipes);
}, [userId]);
```

### Files to Modify

1. **`src/hooks/useCookbook.ts`**
   - Accept `userId?: string` parameter
   - Add `loadDraft` / `saveDraft` internal helpers
   - Add auto-save `useEffect` (debounced 500ms)
   - Add `hasDraft`, `draftSavedAt` derived state
   - Add `resumeDraft(galleryItems)` function
   - Add `clearDraft()` function (replaces plain `reset`)

2. **`src/pages/CookbookBuilder.tsx`**
   - Pass `user?.id` to `useCookbook()`
   - Add resume banner UI (shown when `hasDraft` is true on the select step)
   - Wire "המשך" → `cookbook.resumeDraft(galleryItems)` 
   - Wire "התחל מחדש" → `cookbook.clearDraft()`
   - After checkout closes successfully → call `cookbook.clearDraft()`

### What Does NOT Change

- All Supabase tables — no schema changes needed
- Gallery fetch logic — unchanged
- All step components (CookbookCoverEditor, CookbookPreview, etc.) — unchanged
- Recipe generation, cooking mode — unaffected
- The draft is silently cleared if the user completes the checkout flow

### Edge Cases Handled

- **Gallery item deleted after draft saved:** The `find()` in `resumeDraft` returns `null` for missing items, which is filtered out — the resume just skips deleted recipes
- **Different user on same browser:** Draft key includes `userId`, so users don't see each other's drafts
- **Corrupted localStorage:** `try/catch` in `loadDraft` returns `null` safely
- **Not logged in:** Hook skips all persistence (no `userId`)
