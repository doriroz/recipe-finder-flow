import { Clock, Users, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Substitution {
  original: string;
  alternative: string;
  reason: string;
}

interface Recipe {
  id: number;
  title: string;
  description: string;
  time: string;
  difficulty: string;
  servings: number;
  image: string;
  ingredients: string[];
  substitutions: Substitution[];
}

interface RecipeCardProps {
  recipe: Recipe;
  onStartCooking: () => void;
}

const RecipeCard = ({ recipe, onStartCooking }: RecipeCardProps) => {
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
          <span>{recipe.servings} מנות</span>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 text-foreground">מצרכים</h3>
        <ul className="grid grid-cols-2 gap-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-center gap-2 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              {ingredient}
            </li>
          ))}
        </ul>
      </div>

      {/* Smart Substitutions */}
      <div className="bg-sage-light rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-sage-dark">
          <span>💡</span>
          החלפות חכמות
        </h3>
        <div className="space-y-3">
          {recipe.substitutions.map((sub, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="bg-card rounded-lg p-3 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{sub.original}</span>
                  <span className="text-muted-foreground">←</span>
                  <span className="font-medium text-secondary">{sub.alternative}</span>
                </div>
                <p className="text-sm text-muted-foreground">{sub.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

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
