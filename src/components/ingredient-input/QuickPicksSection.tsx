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
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
        <span>⭐</span>
        מצרכים פופולריים
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {picks.map((ing) => {
          const isSelected = selected.some((s) => s.id === ing.id);
          return (
            <button
              key={ing.id}
              onClick={() => onToggle(ing)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border-2 shrink-0",
                "transition-all duration-200 min-w-[72px]",
                "shadow-soft hover:shadow-elevated",
                isSelected
                  ? "bg-accent border-primary text-accent-foreground"
                  : "bg-card border-border hover:border-primary/40"
              )}
            >
              <span className="text-2xl">{ing.emoji}</span>
              <span className="text-xs font-medium text-foreground leading-tight text-center">
                {ing.name}
              </span>
              {isSelected && (
                <span className="text-primary text-xs font-bold">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickPicksSection;
