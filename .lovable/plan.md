## Completed: Grouped Scoring with Ingredient Limits

### What was done

1. **New scoring formula**: `score = usedCount - missingCount` (no 0.5 multiplier)
2. **10-ingredient limit**: Skip any recipe with more than 10 total ingredients
3. **missingCount > 3 filter**: Reject recipes missing more than 3 ingredients
4. **Grouped output**: Recipes grouped into Cook Now (0 missing), Almost Ready (1-2 missing), Needs Three (3 missing) — top 3 per group
5. **New badges**: "מוכן לבישול", "כמעט מוכן", "חסרים 3 מצרכים"
6. **Fallback**: When no recipes pass filters, return friendly message + 3 popular recipes + showAIButton
7. **Always include** `showAIButton: true` in response
8. **Synced** debug-matching with same logic
