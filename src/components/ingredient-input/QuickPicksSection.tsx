import { cn } from "@/lib/utils";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
  popularityScore: number;
}

interface QuickPicksSectionProps {
  ingredients: Ingredient[];
  selected: Ingredient[];
  onToggle: (ingredient: Ingredient) => void;
}

const QuickPicksSection = ({ ingredients, selected, onToggle }: QuickPicksSectionProps) => {
  // Top 12 by popularityScore
  const picks = [...ingredients]
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 12);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-0.5">
      {picks.map((ing) => {
        const isSelected = selected.some((s) => s.id === ing.id);
        return (
          <button
            key={ing.id}
            onClick={() => onToggle(ing)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-full border shrink-0",
              "transition-all duration-200 text-sm whitespace-nowrap",
              isSelected
                ? "bg-accent border-primary text-accent-foreground font-medium"
                : "bg-card border-border hover:border-primary/40 text-foreground"
            )}
          >
            <span className="text-base leading-none">{ing.emoji}</span>
            <span>{ing.name}</span>
            {isSelected && <span className="text-primary text-xs">✓</span>}
          </button>
        );
      })}
    </div>
  );
};

export default QuickPicksSection;
