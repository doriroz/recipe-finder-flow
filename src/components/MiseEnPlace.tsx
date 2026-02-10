import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import type { RecipeIngredient } from "@/types/recipe";

interface MiseEnPlaceProps {
  ingredients: RecipeIngredient[];
  onReady: () => void;
}

const MiseEnPlace = ({ ingredients, onReady }: MiseEnPlaceProps) => {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const allChecked = ingredients.length > 0 && ingredients.every((_, i) => checked[i]);

  const toggle = (index: number) => {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-primary rounded-full p-4 mb-4">
          <ClipboardCheck className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">שלב ההכנות</h2>
        <p className="text-muted-foreground text-center">
          רגע לפני שמתחילים - האם הכל מוכן?
        </p>
      </div>

      <div className="card-warm space-y-3 mb-6">
        {ingredients.map((ingredient, index) => {
          const label = ingredient.amount
            ? `${ingredient.amount}${ingredient.unit ? " " + ingredient.unit : ""} ${ingredient.name}`
            : ingredient.name;

          return (
            <label
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50 border border-transparent data-[checked=true]:border-secondary/30 data-[checked=true]:bg-accent/30"
              data-checked={!!checked[index]}
              onClick={() => toggle(index)}
            >
              <Checkbox
                checked={!!checked[index]}
                onCheckedChange={() => toggle(index)}
                className="h-5 w-5"
                onClick={(e) => e.stopPropagation()}
              />
              <span
                className={`text-lg transition-all duration-200 ${
                  checked[index] ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {label}
              </span>
            </label>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground mb-4">
        {Object.values(checked).filter(Boolean).length} / {ingredients.length} פריטים מוכנים
      </div>

      <Button
        variant="hero"
        size="lg"
        className="w-full"
        onClick={onReady}
        disabled={!allChecked}
      >
        יאללה, מתחילים לבשל!
        <ArrowLeft className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default MiseEnPlace;
