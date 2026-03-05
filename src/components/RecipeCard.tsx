import { useState } from "react";
import { Clock, Users, ChefHat, Plus, Minus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubstitutionSection from "@/components/SubstitutionSection";

interface Substitution {
  original: string;
  alternative: string;
  reason: string;
}

/** Structured ingredient (preferred — stored as JSON in DB) */
export interface StructuredIngredient {
  name: string;
  amount?: string | number;
  unit?: string;
}

export interface RecipeCardData {
  id: number | string;
  title: string;
  description: string;
  time: string;
  difficulty: string;
  servings: number;
  image: string;
  /** Accepts either structured objects or legacy flat strings */
  ingredients: (StructuredIngredient | string)[];
  substitutions: Substitution[];
  why_it_works?: string;
  reliability_score?: "high" | "medium" | "creative";
  spoonacular_verified?: boolean;
  source?: "local" | "ai" | "spoonacular";
  used_count?: number;
  missed_count?: number;
  used_ingredient_names?: string[];
}

interface RecipeCardProps {
  recipe: RecipeCardData;
  onStartCooking: () => void;
}

// ─── Ingredient Scaling (pure math, no AI) ────────────────────────────────────

/**
 * Parse a legacy flat string like "2 כוסות קמח" into structured parts.
 * Used only when the ingredient is stored as a plain string (backwards-compat).
 */
const parseLegacyIngredient = (
ingredient: string)
: {amount: number | null;unit: string;name: string;} => {
  const hebrewNumbers: Record<string, number> = {
    חצי: 0.5,
    רבע: 0.25,
    שליש: 0.333
  };

  const fractionMap: Record<string, number> = {
    "½": 0.5,
    "¼": 0.25,
    "¾": 0.75
  };

  const match = ingredient.match(/^([\d.½¼¾]+|חצי|רבע|שליש)?\s*(.*)$/);
  if (!match) return { amount: null, unit: "", name: ingredient };

  let amount: number | null = null;
  const rest = match[2] || ingredient;

  if (match[1]) {
    if (hebrewNumbers[match[1]] !== undefined) {
      amount = hebrewNumbers[match[1]];
    } else if (fractionMap[match[1]] !== undefined) {
      amount = fractionMap[match[1]];
    } else {
      amount = parseFloat(match[1]);
    }
  }

  const unitMatch = rest.match(
    /^(כוס|כוסות|כפית|כפיות|כף|כפות|גרם|ק"ג|מ"ל|ליטר|יחידה|יחידות|ביצה|ביצים)?\s*(.*)$/
  );

  if (unitMatch) {
    return { amount, unit: unitMatch[1] || "", name: unitMatch[2] || rest };
  }
  return { amount, unit: "", name: rest };
};

/** Format a number nicely: integers as integers, known fractions as symbols */
const formatNumber = (n: number): string => {
  if (n === Math.floor(n)) return n.toString();
  if (n === 0.5) return "½";
  if (n === 0.25) return "¼";
  if (n === 0.75) return "¾";
  return n.toFixed(1).replace(".0", "");
};

/**
 * Scale and format a single ingredient for display.
 * Works with both structured JSON ingredients and legacy flat strings.
 *
 * @param ingredient  Either a StructuredIngredient or a legacy string
 * @param scaleFactor multiplier = requestedServings / originalServings
 */
const scaleIngredient = (
ingredient: StructuredIngredient | string,
scaleFactor: number)
: string => {
  // ── Structured path (preferred) ──────────────────────────────────────────
  if (typeof ingredient === "object") {
    const { name, amount, unit } = ingredient;

    if (amount == null || amount === "" || amount === undefined) {
      // No amount — just show name (e.g. "לפי הטעם")
      return [unit, name].filter(Boolean).join(" ");
    }

    const numericAmount =
    typeof amount === "number" ? amount : parseFloat(String(amount));

    if (isNaN(numericAmount)) {
      // Non-numeric amount like "לפי הטעם" — show as-is
      return [amount, unit, name].filter(Boolean).join(" ");
    }

    const scaled = numericAmount * scaleFactor;
    return [formatNumber(scaled), unit, name].filter(Boolean).join(" ");
  }

  // ── Legacy string path (backwards compatibility) ──────────────────────────
  const { amount, unit, name } = parseLegacyIngredient(ingredient);
  if (amount === null) return ingredient;

  const scaled = amount * scaleFactor;
  return [formatNumber(scaled), unit, name].filter(Boolean).join(" ");
};

/** Returns the plain display string for an ingredient (no scaling) */
const ingredientToString = (ing: StructuredIngredient | string): string => {
  if (typeof ing === "string") return ing;
  return [ing.amount, ing.unit, ing.name].filter(Boolean).join(" ");
};

// ─── Component ────────────────────────────────────────────────────────────────

const RecipeCard = ({ recipe, onStartCooking }: RecipeCardProps) => {
  const [servings, setServings] = useState(recipe.servings);
  const baseServings = recipe.servings;
  const scaleFactor = servings / baseServings;

  const incrementServings = () => setServings((prev) => Math.min(prev + 1, 20));
  const decrementServings = () => setServings((prev) => Math.max(prev - 1, 1));

  return (
    <div className="animate-slide-up max-w-2xl mx-auto bg-card rounded-2xl shadow-lg border border-border p-6">
      {/* Recipe Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="text-6xl">{recipe.image}</div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">{recipe.title}</h2>
          <p className="text-muted-foreground">{recipe.description}</p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex gap-6 mb-6 pb-6 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5 text-primary" />
          <span>{recipe.time}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ChefHat className="w-5 h-5 text-secondary" />
          <span>{recipe.difficulty}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-5 h-5 text-primary" />
          <span>{servings} מנות</span>
        </div>
      </div>

      {/* Ingredient Match Badge */}
      {recipe.used_count != null && recipe.missed_count != null &&
      (() => {
        // Strict intersection: only count names that exist in the recipe's actual ingredients list
        const recipeIngNames = new Set(
          recipe.ingredients.map(ing =>
            (typeof ing === "string" ? ing : ing.name).trim()
          )
        );
        const strictUsedNames = (recipe.used_ingredient_names || []).filter(name =>
          {
            const trimmed = name.trim();
            for (const riName of recipeIngNames) {
              if (riName === trimmed || riName.includes(trimmed) || trimmed.includes(riName)) return true;
            }
            return false;
          }
        );
        const strictUsedCount = strictUsedNames.length;
        const total = strictUsedCount + recipe.missed_count;
        const coverage = total > 0 ? strictUsedCount / total : 0;
        const colorClass = coverage >= 0.8 ?
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
        coverage >= 0.5 ?
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
        "bg-muted text-muted-foreground";
        return (
          <div className={`px-4 py-3 rounded-xl mb-6 ${colorClass}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">
                  {strictUsedCount} מתוך {total} מהמרכיבים שבחרת נמצאים במתכון
                </span>
              </div>
              {strictUsedNames.length > 0 &&
            <div className="flex flex-wrap gap-1.5 mt-1">
                  {strictUsedNames.map((name, i) =>
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/60 dark:bg-white/10">
                      ✓ {name}
                    </span>
              )}
                </div>
            }
            </div>);

      })()
      }

      {/* Ingredients List with Servings Adjuster */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-foreground">מצרכים</h3>

          {/* Servings Adjuster */}
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">מנות</span>
            <div className="flex items-center gap-2">
              <button
                onClick={incrementServings}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                aria-label="הוסף מנה">

                <Plus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-lg text-foreground">
                {servings}
              </span>
              <button
                onClick={decrementServings}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                aria-label="הפחת מנה">

                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, index) =>
          <li
            key={index}
            className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${
            index % 2 === 0 ? "bg-muted/30" : ""}`
            }>

              <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
              <span className="text-foreground">
                {scaleIngredient(ingredient, scaleFactor)}
              </span>
            </li>
          )}
        </ul>
      </div>


      {/* Smart Substitutions */}
      {recipe.substitutions && recipe.substitutions.length > 0 && (
        <div className="mb-6">
          <SubstitutionSection
            substitutions={recipe.substitutions}
            ingredients={recipe.ingredients.map(ing =>
              typeof ing === "string" ? ing : ingredientToString(ing)
            )}
            recipeTitle={recipe.title}
          />
        </div>
      )}

      {/* Start Cooking Button */}
      <Button
        variant="hero"
        size="xl"
        className="w-full"
        onClick={onStartCooking}>

        <ChefHat className="w-6 h-6" />
        בואו נבשל!
      </Button>
    </div>);

};

export default RecipeCard;