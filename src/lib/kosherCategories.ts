// Kosher-aware ingredient classification.
// Used by the pairing logic to prevent meat ↔ dairy cross-recommendations.
// Fish, eggs, legumes, vegetables, grains, etc. are pareve and always allowed.

export const MEAT_INGREDIENTS = new Set<string>([
  "עוף",
  "בשר טחון",
  "נקניקיות",
  "חזה עוף",
  "שריות עוף",
  "בשר בקר",
]);

export const DAIRY_INGREDIENTS = new Set<string>([
  "גבינה צהובה",
  "חלב",
  "גבינת קוטג'",
  "שמנת חמוצה",
  "יוגורט",
  "חמאה",
  "גבינה לבנה",
  "גבינת מוצרלה",
  "שמנת מתוקה",
  "פרמזן",
]);

export function isMeat(name: string): boolean {
  return MEAT_INGREDIENTS.has(name);
}

export function isDairy(name: string): boolean {
  return DAIRY_INGREDIENTS.has(name);
}

/**
 * Returns true if recommending `candidateName` alongside `selectedNames`
 * would mix meat and dairy.
 */
export function violatesKosher(selectedNames: string[], candidateName: string): boolean {
  const candIsMeat = isMeat(candidateName);
  const candIsDairy = isDairy(candidateName);
  if (!candIsMeat && !candIsDairy) return false;

  const hasMeat = selectedNames.some(isMeat);
  const hasDairy = selectedNames.some(isDairy);

  if (candIsMeat && hasDairy) return true;
  if (candIsDairy && hasMeat) return true;
  return false;
}
