import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
  popularityScore: number;
}

interface CategoryBrowserProps {
  ingredients: Ingredient[];
  selected: Ingredient[];
  onToggle: (ingredient: Ingredient) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  "ירקות": "🥦",
  "חלבונים": "🍗",
  "חלבי": "🧀",
  "דגנים": "🌾",
  "תבלינים": "🧂",
  "שימורים": "🥫",
  "פירות": "🍎",
  "שמנים": "🫒",
  "אחר": "✨",
};

const CategoryBrowser = ({ ingredients, selected, onToggle }: CategoryBrowserProps) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(ingredients.map((i) => i.category)));

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
        <span>📂</span>
        עיון לפי קטגוריה
      </h3>
      <div className="space-y-2">
        {categories.map((cat) => {
          const catIngredients = ingredients
            .filter((i) => i.category === cat)
            .sort((a, b) => b.popularityScore - a.popularityScore);
          const isOpen = openCategories.has(cat);
          const selectedCount = catIngredients.filter((i) =>
            selected.some((s) => s.id === i.id)
          ).length;

          return (
            <div
              key={cat}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft"
            >
              {/* Trigger */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <span className="text-xl">{CATEGORY_ICONS[cat] ?? "🍽️"}</span>
                <span className="flex-1 text-right font-medium text-foreground">{cat}</span>
                {selectedCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                    {selectedCount}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-1">
                  {catIngredients.length}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Content */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {catIngredients.map((ing) => {
                      const isSelected = selected.some((s) => s.id === ing.id);
                      return (
                        <button
                          key={ing.id}
                          onClick={() => onToggle(ing)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border-2 transition-all duration-200",
                            isSelected
                              ? "bg-accent border-primary text-accent-foreground font-medium"
                              : "bg-background border-border hover:border-primary/40 text-foreground"
                          )}
                        >
                          <span>{ing.emoji}</span>
                          <span>{ing.name}</span>
                          {isSelected && <span className="text-primary">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBrowser;
