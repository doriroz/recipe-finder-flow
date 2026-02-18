import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const CATEGORY_META: Record<string, { icon: string; subtitle: string; hue: string }> = {
  "ירקות":   { icon: "🥦", subtitle: "טריים ומזינים",     hue: "142 40% 94%" },
  "חלבונים": { icon: "🍗", subtitle: "בשר, דגים וביצים",  hue: "32 70% 94%"  },
  "חלבי":    { icon: "🧀", subtitle: "גבינות וחלב",        hue: "200 60% 94%" },
  "דגנים":   { icon: "🌾", subtitle: "פחמימות ואנרגיה",   hue: "48 80% 93%"  },
  "תבלינים": { icon: "🧂", subtitle: "ארומה וטעם",         hue: "355 60% 94%" },
  "שימורים": { icon: "🥫", subtitle: "מוכנים לשימוש",      hue: "18 65% 93%"  },
  "פירות":   { icon: "🍎", subtitle: "מתוק וטרי",          hue: "340 60% 94%" },
  "שמנים":   { icon: "🫒", subtitle: "שמנים ורטבים",       hue: "88 45% 93%"  },
  "אחר":     { icon: "✨", subtitle: "עוד מצרכים",         hue: "270 50% 94%" },
};

const CategoryBrowser = ({ ingredients, selected, onToggle }: CategoryBrowserProps) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(ingredients.map((i) => i.category)));

  const toggleCategory = (cat: string) => {
    setOpenCategory((prev) => (prev === cat ? null : cat));
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((cat, idx) => {
        const meta = CATEGORY_META[cat] ?? { icon: "🍽️", subtitle: "מצרכים שונים", hue: "30 30% 94%" };
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              layout: { type: "spring", stiffness: 320, damping: 30 },
              opacity: { duration: 0.22, delay: idx * 0.04 },
              y: { duration: 0.22, delay: idx * 0.04 },
            }}
            className={cn(
              "rounded-2xl overflow-hidden cursor-pointer select-none",
              isOpen && "col-span-2"
            )}
            style={{
              background: `hsl(${meta.hue})`,
              boxShadow: isOpen
                ? "0 4px 20px -4px hsl(0 0% 0% / 0.10)"
                : "0 2px 8px -2px hsl(0 0% 0% / 0.06)",
            }}
          >
            {/* Card header — always visible */}
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex flex-col items-center justify-center text-center p-5 gap-2 relative"
              style={{ minHeight: isOpen ? undefined : "120px" }}
            >
              {/* Selected badge */}
              {selectedCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold leading-none"
                >
                  {selectedCount}
                </motion.span>
              )}

              {/* Big emoji */}
              <motion.span
                className="text-4xl leading-none"
                animate={{ scale: isOpen ? 0.8 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                {meta.icon}
              </motion.span>

              {/* Category name */}
              <div>
                <p className="font-bold text-foreground text-sm leading-tight">{cat}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
              </div>

              {/* Chevron */}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="text-muted-foreground"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            {/* Expandable ingredient panel */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.8 }}
                  className="overflow-hidden"
                >
                  <div
                    className="px-4 pb-5 pt-1 border-t"
                    style={{ borderColor: `hsl(${meta.hue.split(" ")[0]} ${parseInt(meta.hue.split(" ")[1]) + 20}% ${Math.max(parseInt(meta.hue.split(" ")[2]) - 12, 50)}%)` }}
                  >
                    <div className="flex flex-wrap gap-2 mt-3">
                      {catIngredients.map((ing, i) => {
                        const isSelected = selected.some((s) => s.id === ing.id);
                        return (
                          <motion.button
                            key={ing.id}
                            initial={{ scale: 0.75, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.025, type: "spring", stiffness: 350, damping: 22 }}
                            onClick={(e) => { e.stopPropagation(); onToggle(ing); }}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-150",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm"
                                : "bg-card/80 border-border hover:border-primary/40 text-foreground"
                            )}
                          >
                            <span className="text-sm leading-none">{ing.emoji}</span>
                            <span>{ing.name}</span>
                            {isSelected && <span className="text-xs font-bold opacity-80">✓</span>}
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
  );
};

export default CategoryBrowser;
