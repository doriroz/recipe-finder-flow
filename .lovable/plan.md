

## Fix Bugs on Fridge Challenges Page

Three bug fixes, no design changes to the cards:

### 1. Remove "מתכון חדש" button
In `src/pages/FridgeChallenges.tsx`, remove the "מתכון חדש" `<Button>` from the actions section. Keep only "לבשל" and "שיתוף". This gives the share button proper space.

### 2. Fix share button
The current share implementation opens a custom Dialog with WhatsApp/Facebook/Copy buttons. The issue is likely that `navigator.clipboard.writeText` fails in iframe/non-HTTPS contexts silently.

**Fix**: Use `navigator.share()` (Web Share API) as the primary method — it works natively on mobile and shows the OS share sheet. Fall back to the existing dialog only on desktop where Web Share isn't available. For the copy fallback, use a hidden textarea + `document.execCommand('copy')` as a backup when clipboard API fails.

### 3. Fix delete dialog RTL
In `src/components/ui/alert-dialog.tsx`:
- `AlertDialogHeader`: change `sm:text-left` → `sm:text-right`
- `AlertDialogFooter`: change `sm:space-x-2` → `gap-2` and add `sm:flex-row-reverse` for proper RTL button order

### Files to change
- `src/pages/FridgeChallenges.tsx` — remove button, fix share logic
- `src/components/ui/alert-dialog.tsx` — RTL alignment fixes

