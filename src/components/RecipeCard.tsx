import { useState } from "react";
import { Clock, Users, ChefHat, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubstitutionSection from "@/components/SubstitutionSection";
import ChefTip from "@/components/ChefTip";
import ReliabilityScore from "@/components/ReliabilityScore";

interface Substitution {
  original: string;
  alternative: string;
  reason: string;
}

export interface RecipeCardData {
  id: number | string;
  title: string;
  description: string;
  time: string;
  difficulty: string;
  servings: number;
  image: string;
  ingredients: string[];
  substitutions: Substitution[];
  why_it_works?: string;
  reliability_score?: "high" | "medium" | "creative";
  spoonacular_verified?: boolean;
}

interface RecipeCardProps {
  recipe: RecipeCardData;
  onStartCooking: () => void;
}

// Parse ingredient string to extract amount and name
const parseIngredient = (ingredient: string): { amount: number | null; unit: string; name: string } => {
  // Hebrew number words mapping
  const hebrewNumbers: Record<string, number> = {
    'חצי': 0.5,
    'רבע': 0.25,
    'שליש': 0.333,
  };

  // Match patterns like "1 כוס קמח" or "2 כפות סוכר"
  const match = ingredient.match(/^([\d.½¼¾]+|חצי|רבע|שליש)?\s*(.*)$/);
  
  if (!match) {
    return { amount: null, unit: '', name: ingredient };
  }

  let amount: number | null = null;
  let rest = match[2] || ingredient;

  if (match[1]) {
    // Check for Hebrew number words
    if (hebrewNumbers[match[1]]) {
      amount = hebrewNumbers[match[1]];
    } else {
      // Handle fractions
      const fractionMap: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75 };
      const numStr = match[1];
      if (fractionMap[numStr]) {
        amount = fractionMap[numStr];
      } else {
        amount = parseFloat(numStr);
      }
    }
  }

  // Extract unit from the rest (first word is usually the unit)
  const unitMatch = rest.match(/^(כוס|כוסות|כפית|כפיות|כף|כפות|גרם|ק"ג|מ"ל|ליטר|יחידה|יחידות|ביצה|ביצים)?\s*(.*)$/);
  
  if (unitMatch) {
    return { amount, unit: unitMatch[1] || '', name: unitMatch[2] || rest };
  }

  return { amount, unit: '', name: rest };
};

// Format scaled ingredient
const formatScaledIngredient = (ingredient: string, scaleFactor: number): string => {
  const { amount, unit, name } = parseIngredient(ingredient);
  
  if (amount === null) {
    return ingredient;
  }

  const scaledAmount = amount * scaleFactor;
  
  // Format the number nicely
  let formattedAmount: string;
  if (scaledAmount === Math.floor(scaledAmount)) {
    formattedAmount = scaledAmount.toString();
  } else if (scaledAmount === 0.5) {
    formattedAmount = '½';
  } else if (scaledAmount === 0.25) {
    formattedAmount = '¼';
  } else if (scaledAmount === 0.75) {
    formattedAmount = '¾';
  } else {
    formattedAmount = scaledAmount.toFixed(1).replace('.0', '');
  }

  return `${formattedAmount} ${unit} ${name}`.trim();
};

const RecipeCard = ({ recipe, onStartCooking }: RecipeCardProps) => {
  const [servings, setServings] = useState(recipe.servings);
  const baseServings = recipe.servings;
  const scaleFactor = servings / baseServings;

  const incrementServings = () => setServings(prev => Math.min(prev + 1, 20));
  const decrementServings = () => setServings(prev => Math.max(prev - 1, 1));

  return (
    <div className="card-warm animate-slide-up max-w-2xl mx-auto">
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
                aria-label="הוסף מנה"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-lg text-foreground">{servings}</span>
              <button
                onClick={decrementServings}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                aria-label="הפחת מנה"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li 
              key={index} 
              className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${
                index % 2 === 0 ? 'bg-muted/30' : ''
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
              <span className="text-foreground">
                {formatScaledIngredient(ingredient, scaleFactor)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Reliability Score, Spoonacular Badge & Chef's Tip */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {recipe.reliability_score && (
            <ReliabilityScore score={recipe.reliability_score} />
          )}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            recipe.spoonacular_verified
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
          }`}>
            <span>{recipe.spoonacular_verified ? '✅' : '🧪'}</span>
            <span>{recipe.spoonacular_verified ? 'מאומת ע״י Spoonacular' : 'לא אומת – מבוסס AI בלבד'}</span>
          </div>
        </div>
        {recipe.why_it_works && (
          <ChefTip tip={recipe.why_it_works} />
        )}
      </div>

      {/* Smart Substitutions Section */}
      <div className="mb-6">
        <SubstitutionSection
          substitutions={recipe.substitutions || []}
          ingredients={recipe.ingredients}
          recipeTitle={recipe.title}
        />
      </div>

      {/* AI Disclaimer */}
      <p className="text-xs text-muted-foreground text-center mb-4 leading-relaxed">
        המתכון נוצר על ידי בינה מלאכותית ומבוסס על עקרונות בישול קלאסיים. תמיד כדאי להפעיל שיקול דעת במטבח!
      </p>

      {/* Start Cooking Button */}
      <Button 
        variant="hero" 
        size="xl" 
        className="w-full"
        onClick={onStartCooking}
      >
        <ChefHat className="w-6 h-6" />
        בואו נבשל!
      </Button>
    </div>
  );
};

export default RecipeCard;
