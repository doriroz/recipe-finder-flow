// Curated Hebrew chef-pairings whitelist.
// Spoonacular's findByIngredients returns CO-OCCURRING ingredients (e.g.
// tomato + yellow cheese both appear in pizza), which is not the same as a
// genuine culinary pairing. We only show the "טיפ של השף" toast when the
// suggested pairing exists in this hand-curated list.

// Map: source ingredient (Hebrew) -> set of ingredients that genuinely shine with it.
const PAIRINGS: Record<string, string[]> = {
  "עגבניה": ["בזיליקום", "גבינת מוצרלה", "שום", "שמן זית", "בצל", "אורגנו"],
  "עגבניות שרי": ["בזיליקום", "גבינת מוצרלה", "שמן זית", "בלסמי"],
  "בצל": ["שום", "שמן זית", "פטריות", "גזר", "סלרי"],
  "שום": ["שמן זית", "בצל", "רוזמרין", "תימין", "לימון"],
  "פלפל": ["בצל", "שום", "שמן זית"],
  "תפוח אדמה": ["רוזמרין", "חמאה", "שום", "שמן זית"],
  "בטטה": ["קינמון", "דבש", "ג'ינג'ר", "שמן זית"],
  "גזר": ["ג'ינג'ר", "כמון", "דבש"],
  "פטריות": ["שום", "חמאה", "תימין", "בצל"],
  "ברוקולי": ["שום", "לימון", "שמן זית", "פרמזן"],
  "כרובית": ["כורכום", "כמון", "שמן זית", "לימון"],
  "קישוא": ["שום", "שמן זית", "פרמזן", "לימון"],
  "חצילים": ["שום", "טחינה", "שמן זית", "לימון"],
  "אבוקדו": ["לימון", "מלח", "עגבניה", "בצל"],

  "עוף": ["לימון", "שום", "רוזמרין", "תימין", "פפריקה מתוקה", "דבש"],
  "חזה עוף": ["לימון", "שום", "פפריקה מתוקה", "תימין"],
  "שריות עוף": ["שום", "פפריקה מתוקה", "דבש", "סויה"],
  "בשר טחון": ["בצל", "שום", "כמון", "פפריקה מתוקה", "פטרוזיליה"],
  "בשר בקר": ["שום", "רוזמרין", "פלפל שחור", "בצל"],
  "סלמון": ["לימון", "דבש", "שמיר", "שום"],
  "טונה": ["לימון", "שמן זית", "בצל"],
  "ביצה": ["חמאה", "בצל ירוק", "פרמזן"],

  "פסטה": ["פרמזן", "שום", "בזיליקום", "שמן זית", "עגבניה"],
  "אורז": ["בצל", "שום", "כורכום"],
  "קינואה": ["לימון", "פטרוזיליה", "שמן זית"],

  "גבינת מוצרלה": ["עגבניה", "בזיליקום", "שמן זית"],
  "פרמזן": ["פסטה", "ברוקולי", "שום"],
  "יוגורט": ["דבש", "תות שדה", "בננה", "גרנולה"],

  "לימון": ["עוף", "סלמון", "שום"],
  "תפוח": ["קינמון", "דבש", "וניל"],
  "בננה": ["שוקולד", "קינמון", "דבש"],
  "תות שדה": ["שוקולד", "וניל", "יוגורט"],
  "שוקולד": ["וניל", "תות שדה", "בננה"],
};

// Build a lookup index for fast directional checks.
const INDEX: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>();
  for (const [src, partners] of Object.entries(PAIRINGS)) {
    if (!m.has(src)) m.set(src, new Set());
    for (const p of partners) {
      m.get(src)!.add(p);
      // Symmetric — a goes with b implies b goes with a.
      if (!m.has(p)) m.set(p, new Set());
      m.get(p)!.add(src);
    }
  }
  return m;
})();

/** Returns true if `partner` is a curated culinary pairing for `source`. */
export function isCuratedPairing(source: string, partner: string): boolean {
  return INDEX.get(source)?.has(partner) ?? false;
}

/**
 * Given a source ingredient and a list of candidate Hebrew partners
 * (already filtered/translated from Spoonacular), return the first one that
 * is in the curated whitelist — or undefined if none qualify.
 */
export function pickCuratedPairing(source: string, candidates: string[]): string | undefined {
  const allowed = INDEX.get(source);
  if (!allowed) return undefined;
  for (const c of candidates) {
    if (allowed.has(c)) return c;
  }
  return undefined;
}