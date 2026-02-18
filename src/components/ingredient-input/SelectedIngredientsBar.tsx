import { X, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
  popularityScore: number;
}

interface SelectedIngredientsBarProps {
  selected: Ingredient[];
  onRemove: (id: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const SelectedIngredientsBar = ({
  selected,
  onRemove,
  onGenerate,
  isGenerating,
}: SelectedIngredientsBarProps) => {
  const canGenerate = selected.length >= 2;

  // Empty state: slim single-line hint, no CTA
  if (selected.length === 0) {
    return (
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-2.5">
          <p className="text-muted-foreground text-sm text-center">
            בחרו לפחות 2 מצרכים כדי להמשיך...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border shadow-soft">
      <div className="container mx-auto px-4 py-2.5 space-y-2.5">
        {/* Chips row */}
        <div className="flex items-center gap-2 flex-wrap">
          {selected.map((ing) => (
            <span
              key={ing.id}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                "bg-accent text-accent-foreground border border-primary/30",
                "animate-scale-in"
              )}
            >
              <span>{ing.emoji}</span>
              <span>{ing.name}</span>
              <button
                onClick={() => onRemove(ing.id)}
                className="mr-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                aria-label={`הסר ${ing.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* CTA */}
        <Button
          variant="hero"
          className="w-full"
          disabled={!canGenerate || isGenerating}
          onClick={onGenerate}
        >
          <ChefHat className="w-5 h-5" />
          {isGenerating ? "יוצר מתכון..." : "מצא לי מתכון"}
          {canGenerate && !isGenerating && (
            <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs">
              {selected.length}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SelectedIngredientsBar;
