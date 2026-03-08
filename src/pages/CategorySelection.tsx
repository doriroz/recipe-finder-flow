import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, X, Clock, ChefHat, Leaf, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CUISINE_CATEGORIES, CuisineCategory, CategoryRecipe } from "@/data/categoryRecipes";
import { useNavigate } from "react-router-dom";
import { useRecipeSearch } from "@/hooks/useRecipeSearch";
import { toast } from "@/hooks/use-toast";

const CategorySelection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CuisineCategory | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState<string | null>(null);
  const { search, saveGeneratedRecipe } = useRecipeSearch();

  const handleRecipeClick = async (recipe: CategoryRecipe) => {
    if (loadingRecipe) return;
    setLoadingRecipe(recipe.title);
    try {
      const results = await search(recipe.title);
      if (!results || results.length === 0) {
        toast({ title: "לא נמצא מתכון", description: "נסו לחפש מתכון אחר", variant: "destructive" });
        return;
      }
      const savedId = await saveGeneratedRecipe(results[0]);
      if (!savedId) {
        toast({ title: "שגיאה בשמירת המתכון", variant: "destructive" });
        return;
      }
      setSelectedCategory(null);
      navigate(`/recipe?id=${savedId}`, {
        state: { source: "spoonacular", spoonacular_verified: true, from: "/categories" },
      });
    } catch {
      toast({ title: "שגיאה בחיפוש המתכון", variant: "destructive" });
    } finally {
      setLoadingRecipe(null);
    }
  };

  const filtered = query.trim()
    ? CUISINE_CATEGORIES.filter(
        (cat) =>
          cat.nameHe.includes(query.trim()) ||
          cat.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          cat.subtitle.includes(query.trim())
      )
    : CUISINE_CATEGORIES;

  const closeModal = useCallback(() => setSelectedCategory(null), []);

  useEffect(() => {
    if (!selectedCategory) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedCategory, closeModal]);

  useEffect(() => {
    if (selectedCategory) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-muted" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-muted px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">בחירת קטגוריה 🍽️</h1>
            <button
              onClick={() => navigate(-1)}
              className="rounded-full p-2 hover:bg-accent transition-colors text-muted-foreground"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חפשו מטבח או מתכון..."
              className={cn(
                "w-full bg-card border border-border rounded-full py-4 pr-12 pl-12 text-foreground",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "transition-all"
              )}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div className="max-w-lg mx-auto px-4 pb-8 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{
                opacity: { duration: 0.22, delay: idx * 0.04 },
                y: { duration: 0.22, delay: idx * 0.04 },
                scale: { type: "spring", stiffness: 400, damping: 25 },
              }}
              onClick={() => setSelectedCategory(cat)}
              className="rounded-2xl overflow-hidden cursor-pointer select-none flex flex-col items-center justify-center text-center p-5 gap-2 relative"
              style={{
                background: `hsl(${cat.hue})`,
                minHeight: "120px",
                boxShadow: "0 2px 10px -2px hsl(0 0% 0% / 0.12)",
              }}
            >
              <span className="text-4xl leading-none">{cat.emoji}</span>
              <div>
                <p className="font-bold text-foreground text-sm leading-tight">{cat.nameHe}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.subtitle}</p>
              </div>
              <span className="text-[10px] text-muted-foreground/70">
                {cat.recipes.length} מתכונים
              </span>
            </motion.button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">לא נמצאו קטגוריות תואמות</p>
        )}
      </div>

      {/* Floating modal — portal */}
      {createPortal(
        <AnimatePresence>
          {selectedCategory && (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeModal}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={selectedCategory.nameHe}
                dir="rtl"
                className="fixed z-50 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[440px] top-[8%] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{
                  background: `hsl(${selectedCategory.hue})`,
                  maxHeight: "80vh",
                }}
                initial={{ scale: 0.82, opacity: 0, y: 28 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 16 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl leading-none">{selectedCategory.emoji}</span>
                    <div className="text-right">
                      <p className="font-bold text-foreground text-lg leading-tight">{selectedCategory.nameHe}</p>
                      <p className="text-xs text-muted-foreground">{selectedCategory.subtitle}</p>
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

                <div
                  className="h-px mx-5 shrink-0"
                  style={{
                    background: `hsl(${selectedCategory.hue.split(" ")[0]} ${selectedCategory.hue.split(" ")[1]} 65%)`,
                  }}
                />

                {/* Recipe list */}
                <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1">
                  {selectedCategory.recipes.map((recipe, i) => (
                    <motion.div
                      key={recipe.title}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.18 }}
                      onClick={() => handleRecipeClick(recipe)}
                      className={cn(
                        "w-full flex flex-col gap-1.5 px-4 py-3 rounded-2xl bg-white/30 hover:bg-white/50 border border-transparent transition-all duration-150 text-right cursor-pointer",
                        loadingRecipe && loadingRecipe !== recipe.title && "opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-foreground text-sm">{recipe.title}</p>
                        {loadingRecipe === recipe.title && (
                          <Loader2 className="w-4 h-4 animate-spin text-foreground/70" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {recipe.cookingTime} דק׳
                        </span>
                        <span className="flex items-center gap-1">
                          <ChefHat className="w-3.5 h-3.5" />
                          {recipe.difficulty}
                        </span>
                        <span className="flex items-center gap-1">
                          <Leaf className="w-3.5 h-3.5" />
                          {recipe.ingredients.length} מצרכים
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default CategorySelection;
