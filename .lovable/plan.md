## Completed: Simplified Scoring + Restore Substitutions

### What was done

1. **Simplified scoring** in both edge functions: `score = matchCount - (missingCount * 0.5)`, reject only if matchCount == 0
2. **Removed**: anchor rules, burden rules, coverage thresholds, structuralBonus, complexity rules, Step 3 fallback
3. **New pipeline**: local DB first → Spoonacular API if < 10 local results → merge all → sort by score → return top 3
4. **Restored SubstitutionSection** in RecipeCard between ingredients and cook button
5. **Badge assignment**: score >= 3.0 → "המלצת השף", score >= 1.5 → "התאמה מצוינת", else → "אפשרות יצירתית"
