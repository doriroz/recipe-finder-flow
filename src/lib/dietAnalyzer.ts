/**
 * Diet Analyzer
 * Analyzes recipe ingredients against known non-conforming ingredient lists
 * and maps them to substitutions from our ingredient_substitutions table.
 */

export type DietType = "gluten-free" | "vegan" | "low-sugar";

export interface DietAnalysis {
  diet: DietType;
  label: string;
  emoji: string;
  isConvertible: boolean;   // can be made compatible with substitutions
  isNativelyCompatible: boolean; // already compatible without changes
  problematicIngredients: string[];
  substitutions: Record<string, string>; // original -> suggested substitution
  color: string;
}

// --- Gluten-containing ingredients ---
const GLUTEN_INGREDIENTS = [
  "קמח", "קמח חיטה", "קמח לבן", "קמח מלא",
  "פסטה", "ספגטי", "פנה", "מקרוני", "נודלס",
  "לחם", "פרוסת לחם", "פרוסות לחם",
  "פירורי לחם", "ביסקוויט",
  "שיבולת שועל", "כוסמין",
  "רוטב סויה",
  "בירה",
  "קוסקוס",
  "בורגול",
  "שעורה",
  "שיפון",
];

// --- Non-vegan ingredients ---
const NON_VEGAN_INGREDIENTS = [
  "ביצה", "ביצים", "ביצה טרופה",
  "חלב", "חלב פרה", "חלב עז",
  "שמנת", "שמנת חמוצה", "שמנת מתוקה",
  "חמאה",
  "יוגורט",
  "גבינה", "גבינה צהובה", "גבינת שמנת", "גבינה לבנה", "גבינת פטה",
  "דבש",
  "ג׳לטין",
  "קצפת",
  "מיונז",
  "עוף", "חזה עוף", "ירך עוף",
  "בשר", "בשר טחון", "סטייק", "כבש",
  "דגים", "טונה", "סלמון", "בקלה",
  "שרימפס", "ים", "פירות ים",
  "בייקון",
];

// --- High-sugar ingredients ---
const HIGH_SUGAR_INGREDIENTS = [
  "סוכר", "סוכר לבן", "סוכר חום",
  "דבש",
  "סירופ", "סירופ גלוקוז", "סירופ מייפל",
  "ממרח שוקולד", "נוטלה",
  "שוקולד חלב",
  "שוקולד לבן",
  "ריבה",
  "קרמל",
  "עוגיות", "עוגה",
  "סוכריות",
  "גלידה",
  "לאפה",
];

// Substitution map: problematic ingredient -> known substitute
const GLUTEN_SUBSTITUTIONS: Record<string, string> = {
  "קמח חיטה": "קמח שקדים",
  "קמח": "קמח שקדים",
  "קמח לבן": "קמח אורז",
  "פסטה": "פסטה אורז",
  "פסטה רגילה": "פסטה אורז",
  "לחם": "לחם אורז",
  "פירורי לחם": "פירורי לחם אורז",
  "שיבולת שועל": "שיבולת שועל ללא גלוטן",
  "רוטב סויה": "תמרי",
};

const VEGAN_SUBSTITUTIONS: Record<string, string> = {
  "ביצה": "ביצת פשתן",
  "ביצים": "ביצת פשתן",
  "חלב": "חלב שקדים",
  "חלב פרה": "חלב שקדים",
  "שמנת": "שמנת קוקוס",
  "שמנת מתוקה": "שמנת קוקוס",
  "שמנת חמוצה": "יוגורט קוקוס",
  "חמאה": "שמן קוקוס",
  "יוגורט": "יוגורט קוקוס",
  "גבינה צהובה": "גבינת קשיו",
  "דבש": "סירופ אגבה",
  "ג׳לטין": "אגר-אגר",
  "קצפת": "קצפת קוקוס",
  "מיונז": "יוגורט יווני",
  "בשר טחון": "עדשים מבושלות",
};

const LOW_SUGAR_SUBSTITUTIONS: Record<string, string> = {
  "סוכר": "אריתריטול",
  "סוכר לבן": "אריתריטול",
  "סוכר חום": "אריתריטול חום",
  "דבש": "סירופ אגבה",
  "סירופ גלוקוז": "סירופ אגבה",
  "ממרח שוקולד": "ממרח שוקולד ללא סוכר",
  "שוקולד חלב": "שוקולד מריר 85%",
};

function normalizeIngredient(ingredient: string): string {
  // Strip amounts, units, strip extra whitespace, lowercase
  return ingredient
    .replace(/^[\d.,½¼¾\s]+/, "")
    .replace(/^(כוס|כוסות|כפית|כפיות|כף|כפות|גרם|ק"ג|מ"ל|ליטר|יחידה|יחידות|ביצה|ביצים)\s+/, "")
    .trim()
    .toLowerCase();
}

function findProblematic(
  ingredientList: string[],
  problematicSet: string[]
): { found: string[]; raw: string[] } {
  const found: string[] = [];
  const raw: string[] = [];

  for (const ing of ingredientList) {
    const norm = normalizeIngredient(ing);
    const matched = problematicSet.find(
      (p) => norm.includes(p.toLowerCase()) || p.toLowerCase().includes(norm)
    );
    if (matched) {
      found.push(matched);
      raw.push(ing);
    }
  }
  return { found, raw };
}

export function analyzeDiet(
  ingredientList: string[],
  diet: DietType
): DietAnalysis {
  let problematicSet: string[];
  let substitutionMap: Record<string, string>;
  let label: string;
  let emoji: string;
  let color: string;

  switch (diet) {
    case "gluten-free":
      problematicSet = GLUTEN_INGREDIENTS;
      substitutionMap = GLUTEN_SUBSTITUTIONS;
      label = "ללא גלוטן";
      emoji = "🌾";
      color = "amber";
      break;
    case "vegan":
      problematicSet = NON_VEGAN_INGREDIENTS;
      substitutionMap = VEGAN_SUBSTITUTIONS;
      label = "טבעוני";
      emoji = "🌱";
      color = "green";
      break;
    case "low-sugar":
      problematicSet = HIGH_SUGAR_INGREDIENTS;
      substitutionMap = LOW_SUGAR_SUBSTITUTIONS;
      label = "דל-סוכר";
      emoji = "🍬";
      color = "blue";
      break;
  }

  const { found: problematic, raw } = findProblematic(ingredientList, problematicSet);

  const isNativelyCompatible = problematic.length === 0;

  // Check which problematic ingredients have known substitutions
  const availableSubstitutions: Record<string, string> = {};
  for (const p of problematic) {
    if (substitutionMap[p]) {
      availableSubstitutions[p] = substitutionMap[p];
    }
  }

  const isConvertible =
    isNativelyCompatible ||
    (problematic.length > 0 && problematic.every((p) => substitutionMap[p]));

  return {
    diet,
    label,
    emoji,
    isConvertible,
    isNativelyCompatible,
    problematicIngredients: raw,
    substitutions: availableSubstitutions,
    color,
  };
}

export function analyzeAllDiets(ingredientList: string[]): DietAnalysis[] {
  const diets: DietType[] = ["gluten-free", "vegan", "low-sugar"];
  return diets.map((d) => analyzeDiet(ingredientList, d));
}
