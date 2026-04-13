import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, X, Clock, ChefHat, Leaf, Loader2, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { CUISINE_CATEGORIES, CuisineCategory, CategoryRecipe } from "@/data/categoryRecipes";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRecipeSearch, SearchRecipeResult } from "@/hooks/useRecipeSearch";
import { Button } from "@/components/ui/button";
const CATEGORY_IMAGES: Record<string, string> = {
  italian: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?auto=format&fit=crop&w=600&q=80",
  asian: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=600&q=80",
  mediterranean: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  american: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
  mexican: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80",
  breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80",
  desserts: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
  salads: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
  soups: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
};

const CategorySelection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CuisineCategory | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [savingResult, setSavingResult] = useState<string | null>(null);
  const { search, saveGeneratedRecipe, clearResults, isSearching, results, error } = useRecipeSearch();

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setHasSearched(true);
    await search(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClearQuery = () => {
    setQuery("");
    setHasSearched(false);
    clearResults();
  };

  const handleResultClick = async (result: SearchRecipeResult) => {
    if (savingResult) return;
    setSavingResult(result.id);
    try {
      let recipeId = result.id;
      if (result.source === "generated") {
        const savedId = await saveGeneratedRecipe(result);
        if (!savedId) {
          toast({ title: "שגיאה בשמירת המתכון", variant: "destructive" });
          return;
        }
        recipeId = savedId;
      }
      navigate(`/recipe?id=${recipeId}`, {
        state: { source: "local", from: "/categories" },
      });
    } catch {
      toast({ title: "שגיאה בשמירת המתכון", variant: "destructive" });
    } finally {
      setSavingResult(null);
    }
  };

  const handleRecipeClick = async (recipe: CategoryRecipe) => {
    if (loadingRecipe) return;
    setLoadingRecipe(recipe.title);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({ title: "יש להתחבר כדי לשמור מתכון", variant: "destructive" });
        return;
      }

      const ingredients = recipe.ingredients.map((name) => ({
        name,
        amount: "",
        unit: "",
      }));

      const instructions =
        recipe.instructions && recipe.instructions.length > 0
          ? recipe.instructions
          : [
              `הכינו את כל המצרכים: ${recipe.ingredients.join(", ")}`,
              `בשלו למשך ${recipe.cookingTime} דקות בערך`,
              "הגישו וטעמו!",
            ];

      const { data, error } = await supabase
        .from("recipes")
        .insert({
          title: recipe.title,
          ingredients,
          instructions,
          cooking_time: recipe.cookingTime,
          user_id: session.session.user.id,
        })
        .select("id")
        .single();

      if (error || !data?.id) {
        toast({ title: "שגיאה בשמירת המתכון", variant: "destructive" });
        return;
      }

      setSelectedCategory(null);
      navigate(`/recipe?id=${data.id}`, {
        state: { source: "local", from: "/categories" },
      });
    } catch {
      toast({ title: "שגיאה בשמירת המתכון", variant: "destructive" });
    } finally {
      setLoadingRecipe(null);
    }
  };

  const filtered = query.trim()
    ? CUISINE_CATEGORIES.filter(
        (cat) =>
          cat.nameHe.includes(query.trim()) ||
          cat.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          cat.subtitle.includes(query.trim()),
      )
    : CUISINE_CATEGORIES;

  const closeModal = useCallback(() => setSelectedCategory(null), []);

  useEffect(() => {
    if (!selectedCategory) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedCategory, closeModal]);

  useEffect(() => {
    if (selectedCategory) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      {/* App Header - matching IngredientInput */}
      <header className="bg-gradient-to-l from-primary/10 via-accent to-card border-b border-primary/20 shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 hover:bg-primary/10"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground">מה שיש</span>
            </div>
          </div>
        </div>
      </header>

      {/* Page title bar - matching tab bar position */}
      <div className="sticky top-0 z-30 bg-background border-border" style={{ height: "48px" }}>
        <div className="container mx-auto px-4 flex items-center justify-center h-full">
          <h1 className="text-sm font-semibold text-foreground">בחירת קטגוריה 🍽️</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-4 pb-8">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="חפשו מתכון... (הקישו Enter לחיפוש)"
            className={cn(
              "w-full bg-card border border-border rounded-full py-3 pr-12 pl-12 text-foreground",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-all",
            )}
          />
          {query && (
            <button
              onClick={handleClearQuery}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search results section */}
        {(isSearching || (hasSearched && !isSearching)) && (
          <div>
            {isSearching && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">מחפש מתכונים...</p>
              </div>
            )}

            {!isSearching && hasSearched && error && (
              <div className="text-center py-6">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {!isSearching && hasSearched && !error && results.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8">
                <SearchX className="w-10 h-10 text-muted-foreground/50" />
                <p className="text-foreground font-medium">לא מצאנו מתכונים עבור "{query}" 😕</p>
                <p className="text-muted-foreground text-sm">נסו מילים אחרות או חפשו בקטגוריות למטה</p>
              </div>
            )}

            {!isSearching && hasSearched && results.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">נמצאו {results.length} תוצאות:</p>
                {results.map((result, i) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.18 }}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "w-full flex flex-col gap-1.5 px-4 py-3 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-150 text-right cursor-pointer",
                      savingResult && savingResult !== result.id && "opacity-50 pointer-events-none",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground text-sm">{result.title}</p>
                      {savingResult === result.id && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {result.cooking_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {result.cooking_time} דק׳
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <ChefHat className="w-3.5 h-3.5" />
                        {result.difficulty || "בינוני"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Leaf className="w-3.5 h-3.5" />
                        {result.ingredients.length} מצרכים
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category grid */}
        <div className="max-w-[63rem] mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3">
            {filtered.map((cat, idx) => {
              const imgUrl = CATEGORY_IMAGES[cat.id] || "";
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{
                    opacity: { duration: 0.22, delay: idx * 0.04 },
                    y: { duration: 0.22, delay: idx * 0.04 },
                  }}
                  onClick={() => setSelectedCategory(cat)}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer select-none aspect-[16/9]"
                  style={{ boxShadow: "0 2px 10px -2px hsl(0 0% 0% / 0.12)" }}
                >
                  {/* Background image with hover zoom */}
                  <img
                    src={imgUrl}
                    alt={cat.nameHe}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[400ms] ease-in-out group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                  {/* Static text content */}
                  <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col items-center text-center">
                    <p className="font-bold text-white text-sm leading-tight">{cat.nameHe}</p>
                    <p className="text-xs text-white/80 mt-0.5">{cat.subtitle}</p>
                    <span className="text-[10px] text-white/60 mt-1">{cat.recipes.length} מתכונים</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground mt-8">לא נמצאו קטגוריות תואמות</p>}
      </main>

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
                        loadingRecipe && loadingRecipe !== recipe.title && "opacity-50 pointer-events-none",
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
        document.body,
      )}
    </div>
  );
};

export default CategorySelection;
