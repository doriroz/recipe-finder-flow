import { cn } from "@/lib/utils";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
}

interface IngredientChipProps {
  ingredient: Ingredient;
  isSelected: boolean;
  onClick: () => void;
}

const IngredientChip = ({ ingredient, isSelected, onClick }: IngredientChipProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "ingredient-chip",
        isSelected && "ingredient-chip-selected"
      )}
    >
      <span className="text-2xl">{ingredient.emoji}</span>
      <span className="font-medium text-foreground">{ingredient.name}</span>
      {isSelected && (
        <span className="mr-auto text-primary text-lg">✓</span>
      )}
    </button>
  );
};

export default IngredientChip;
