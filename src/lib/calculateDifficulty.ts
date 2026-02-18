/**
 * Local difficulty calculator — no AI needed.
 * Rules:
 *  Easy   (קל)     : ≤5 steps AND ≤7 ingredients AND no advanced techniques
 *  Medium (בינוני)  : 6–8 steps OR >7 ingredients
 *  Hard   (מאתגר)  : >8 steps OR advanced techniques detected
 */

export type DifficultyLevel = "קל" | "בינוני" | "מאתגר";

/** Hebrew keywords that indicate advanced cooking techniques */
const ADVANCED_TECHNIQUE_KEYWORDS = [
  // Baking / pastry
  "אפייה", "אופים", "לאפות", "בצק", "מקפלים", "מרדדים", "מגלגלים",
  // Deep frying
  "טיגון עמוק", "שמן עמוק", "מטגנים בשמן",
  // Whipping / emulsifying
  "מקציפים", "מערבלים", "קצפת", "אמולסיה", "מרנג",
  // Caramelization / sugar work
  "קרמל", "מקרמלים", "שרוף הסוכר", "כבושים",
  // Sous vide / slow cook / pressure
  "ואקום", "סו-ויד", "סוויד", "לחץ", "סיר לחץ",
  // Tempering / chocolate
  "טמפרינג", "שוקולד מומס", "מטמפרים",
  // Roux / béchamel
  "רביכה", "בשמל",
  // Smoking / curing
  "עישון", "כבישה", "מעושן",
];

/**
 * Detects if any instruction step mentions an advanced cooking technique.
 */
function hasAdvancedTechnique(instructions: string[]): boolean {
  const combined = instructions.join(" ").toLowerCase();
  return ADVANCED_TECHNIQUE_KEYWORDS.some((kw) =>
    combined.includes(kw.toLowerCase())
  );
}

/**
 * Calculates recipe difficulty locally.
 *
 * @param stepCount       Number of preparation steps
 * @param ingredientCount Number of distinct ingredients
 * @param instructions    Full instruction text array (for technique detection)
 */
export function calculateDifficulty(
  stepCount: number,
  ingredientCount: number,
  instructions: string[]
): DifficultyLevel {
  const advanced = hasAdvancedTechnique(instructions);

  // Hard: >8 steps OR advanced techniques
  if (stepCount > 8 || advanced) return "מאתגר";

  // Easy: ≤5 steps AND ≤7 ingredients AND no advanced techniques
  if (stepCount <= 5 && ingredientCount <= 7) return "קל";

  // Medium: everything in between
  return "בינוני";
}
