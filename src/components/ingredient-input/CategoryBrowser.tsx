import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  "ירקות":   { icon: "🥦", subtitle: "טריים ומזינים",    hue: "142 45% 82%" },
  "חלבונים": { icon: "🍗", subtitle: "בשר, דגים וביצים", hue: "32 65% 82%"  },
  "חלבי":    { icon: "🧀", subtitle: "גבינות וחלב",       hue: "200 55% 82%" },
  "דגנים":   { icon: "🌾", subtitle: "פחמימות ואנרגיה",  hue: "48 70% 81%"  },
  "תבלינים": { icon: "🧂", subtitle: "ארומה וטעם",        hue: "355 55% 82%" },
  "שימורים": { icon: "🥫", subtitle: "מוכנים לשימוש",     hue: "18 60% 81%"  },
  "פירות":   { icon: "🍎", subtitle: "מתוק וטרי",         hue: "340 55% 82%" },
  "שמנים":   { icon: "🫒", subtitle: "שמנים ורטבים",      hue: "88 50% 81%"  },
  "אחר":     { icon: "✨", subtitle: "עוד מצרכים",        hue: "270 45% 82%" },
};

const CategoryBrowser = ({ ingredients, selected, onToggle }: CategoryBrowserProps) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [pendingSelections, setPendingSelections] = useState<Set<number>>(new Set());

  const categories = Array.from(new Set(ingredients.map((i) => i.category)));

  const openModal = useCallback((cat: string) => {
    const preSelected = new Set(
      ingredients
        .filter((i) => i.category === cat && selected.some((s) => s.id === i.id))
        .map((i) => i.id)
    );
    setPendingSelections(preSelected);
    setOpenCategory(cat);
  }, [ingredients, selected]);

  const closeModal = useCallback(() => {
    setOpenCategory(null);
    setPendingSelections(new Set());
  }, []);

  const confirmSelections = useCallback(() => {
    if (!openCategory) return;
    const catIngredients = ingredients.filter((i) => i.category === openCategory);
    catIngredients.forEach((ing) => {
      const wasSelected = selected.some((s) => s.id === ing.id);
      const isNowPending = pendingSelections.has(ing.id);
      if (!wasSelected && isNowPending) onToggle(ing);
      if (wasSelected && !isNowPending) onToggle(ing);
    });
    closeModal();
  }, [openCategory, ingredients, selected, pendingSelections, onToggle, closeModal]);

  const togglePending = useCallback((id: number) => {
    setPendingSelections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ESC key handler
  useEffect(() => {
    if (!openCategory) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openCategory, closeModal]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (openCategory) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [openCategory]);

  const openMeta = openCategory
    ? (CATEGORY_META[openCategory] ?? { icon: "🍽️", subtitle: "מצרכים שונים", hue: "30 30% 82%" })
    : null;
  const openIngredients = openCategory
    ? ingredients.filter((i) => i.category === openCategory).sort((a, b) => b.popularityScore - a.popularityScore)
    : [];

  return (
    <>
      {/* Static 2-column grid — never changes layout */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat, idx) => {
          const meta = CATEGORY_META[cat] ?? { icon: "🍽️", subtitle: "מצרכים שונים", hue: "30 30% 82%" };
          const catIngredients = ingredients.filter((i) => i.category === cat);
          const selectedCount = catIngredients.filter((i) =>
            selected.some((s) => s.id === i.id)
          ).length;

          return (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{
                opacity: { duration: 0.22, delay: idx * 0.04 },
                y: { duration: 0.22, delay: idx * 0.04 },
                scale: { type: "spring", stiffness: 400, damping: 25 },
              }}
              onClick={() => openModal(cat)}
              className="rounded-2xl overflow-hidden cursor-pointer select-none flex flex-col items-center justify-center text-center p-5 gap-2 relative"
              style={{
                background: `hsl(${meta.hue})`,
                minHeight: "120px",
                boxShadow: "0 2px 10px -2px hsl(0 0% 0% / 0.12)",
              }}
            >
              {/* Selected badge */}
              <AnimatePresence>
                {selectedCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold leading-none"
                  >
                    {selectedCount}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Big emoji */}
              <span className="text-4xl leading-none">{meta.icon}</span>

              {/* Category name */}
              <div>
                <p className="font-bold text-foreground text-sm leading-tight">{cat}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Floating modal — rendered in a portal */}
      {createPortal(
        <AnimatePresence>
          {openCategory && openMeta && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeModal}
              />

              {/* Modal card */}
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={openCategory}
                className="fixed z-50 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[440px] top-[8%] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{
                  background: `hsl(${openMeta.hue})`,
                  maxHeight: "80vh",
                }}
                initial={{ scale: 0.82, opacity: 0, y: 28 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 16 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl leading-none">{openMeta.icon}</span>
                    <div className="text-right">
                      <p className="font-bold text-foreground text-lg leading-tight">{openCategory}</p>
                      <p className="text-xs text-muted-foreground">{openMeta.subtitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    autoFocus
                    className="rounded-full p-2 hover:bg-black/10 transition-colors text-foreground/70 hover:text-foreground"
                    aria-label="סגור"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Divider */}
                <div
                  className="h-px mx-5 shrink-0"
                  style={{ background: `hsl(${openMeta.hue.split(" ")[0]} ${openMeta.hue.split(" ")[1]} 65%)` }}
                />

                {/* Scrollable ingredient list */}
                <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1">
                  {openIngredients.map((ing, i) => {
                    const isPending = pendingSelections.has(ing.id);
                    return (
                      <motion.button
                        key={ing.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025, duration: 0.18 }}
                        onClick={() => togglePending(ing.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-150 text-right",
                          isPending
                            ? "bg-primary/20 border border-primary/40"
                            : "bg-white/30 hover:bg-white/50 border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl leading-none">{ing.emoji}</span>
                          <span className="font-medium text-foreground text-sm">{ing.name}</span>
                        </div>
                        {/* Checkbox indicator */}
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150",
                            isPending
                              ? "bg-primary border-primary"
                              : "border-foreground/30 bg-transparent"
                          )}
                        >
                          {isPending && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Footer — confirm button */}
                <div className="px-4 pb-5 pt-3 shrink-0">
                  <div
                    className="h-px mb-3"
                    style={{ background: `hsl(${openMeta.hue.split(" ")[0]} ${openMeta.hue.split(" ")[1]} 65%)` }}
                  />
                  <Button
                    variant="hero"
                    className="w-full"
                    disabled={pendingSelections.size === 0}
                    onClick={confirmSelections}
                  >
                    {pendingSelections.size > 0
                      ? `הוסף מצרכים (${pendingSelections.size})`
                      : "בחרו מצרכים"}
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default CategoryBrowser;
