import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
  popularityScore: number;
}

interface SelectedIngredientsSidebarProps {
  selected: Ingredient[];
  onRemove: (id: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
}

const SelectedIngredientsSidebar = ({
  selected,
  onRemove,
  onGenerate,
  isGenerating,
  canGenerate,
}: SelectedIngredientsSidebarProps) => {
  return (
    <div className="h-screen sticky top-0 bg-card border-r border-border flex flex-col" dir="rtl">
      {/* Header */}
      <div className="px-5 py-5 border-b border-border">
        <h2 className="font-bold text-foreground text-base">בריות מתכורים!</h2>
      </div>

      {/* Selected list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            בחרו מצרכים כדי להתחיל 🧑‍🍳
          </p>
        ) : (
          selected.map((ing) => (
            <div
              key={ing.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/60 group"
            >
              <span className="text-lg leading-none">{ing.emoji}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{ing.name}</span>
              <button
                onClick={() => onRemove(ing.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5"
                aria-label={`הסר ${ing.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* CTA */}
      <div className="px-4 py-4 border-t border-border">
        <Button
          variant="hero"
          className="w-full"
          disabled={!canGenerate || isGenerating}
          onClick={onGenerate}
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating
            ? "יוצר מתכון..."
            : `מצא לי מתכונים!`}
          {canGenerate && !isGenerating && (
            <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs mr-1">
              {selected.length} מצרכים
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SelectedIngredientsSidebar;
