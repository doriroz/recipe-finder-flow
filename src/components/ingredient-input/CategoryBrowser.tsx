import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(ingredients.map((i) => i.category)));

  const toggleCategory = (cat: string) => {
    setOpenCategory((prev) => (prev === cat ? null : cat));
  };

  return (
    <div className="space-y-3">
      {/* 2-column grid of category cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {categories.map((cat, idx) => {
          const catIngredients = ingredients
            .filter((i) => i.category === cat)
            .sort((a, b) => b.popularityScore - a.popularityScore);
          const isOpen = openCategory === cat;
          const selectedCount = catIngredients.filter((i) =>
            selected.some((s) => s.id === i.id)
          ).length;

          return (
            <motion.div
              key={cat}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: idx * 0.04, ease: "easeOut" }}
              className={cn(
                "rounded-2xl border overflow-hidden transition-colors duration-200",
                isOpen
                  ? "border-primary/40 bg-card shadow-md col-span-2"
                  : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
              )}
            >
              {/* Card header — always visible */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-2 px-4 py-3.5 transition-colors"
              >
                {/* Big emoji + name */}
                <span className="text-2xl leading-none">{CATEGORY_ICONS[cat] ?? "🍽️"}</span>
                <div className="flex-1 text-right min-w-0">
                  <p className="font-semibold text-foreground text-sm leading-tight">{cat}</p>
                  <p className="text-xs text-muted-foreground">{catIngredients.length} מצרכים</p>
                </div>
                {selectedCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold shrink-0">
                    {selectedCount}
                  </span>
                )}
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground text-xs shrink-0"
                >
                  ▾
                </motion.span>
              </button>

              {/* Expandable ingredient grid */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-border/60">
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {catIngredients.map((ing) => {
                          const isSelected = selected.some((s) => s.id === ing.id);
                          return (
                            <motion.button
                              key={ing.id}
                              layout
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.15 }}
                              onClick={() => onToggle(ing)}
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm border transition-all duration-200",
                                isSelected
                                  ? "bg-accent border-primary text-accent-foreground font-medium"
                                  : "bg-muted/60 border-transparent hover:border-primary/30 text-foreground"
                              )}
                            >
                              <span className="text-sm">{ing.emoji}</span>
                              <span>{ing.name}</span>
                              {isSelected && (
                                <span className="text-primary text-xs font-bold">✓</span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBrowser;
