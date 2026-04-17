import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, X, Clock, ChefHat, Leaf, Loader2, SearchX, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CUISINE_CATEGORIES, CuisineCategory, CategoryRecipe } from "@/data/categoryRecipes";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRecipeSearch, SearchRecipeResult } from "@/hooks/useRecipeSearch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

const CUISINE_SIDEBAR_DATA: Record<string, { spices: { name: string; emoji: string }[]; tip: string }> = {
  italian: {
    spices: [
      { name: "בזיליקום", emoji: "🌿" },
      { name: "אורגנו", emoji: "🍃" },
      { name: "שום", emoji: "🧄" },
    ],
    tip: "השתמשו בשמן זית איכותי כדי להעלות את הארומה של כל מנה איטלקית.",
  },
  asian: {
    spices: [
      { name: "ג׳ינג׳ר", emoji: "🫚" },
      { name: "רוטב סויה", emoji: "🥢" },
      { name: "שומשום", emoji: "🌰" },
    ],
    tip: "חממו את המחבת היטב לפני הטיגון כדי לקבל את הטעם המעושן האופייני.",
  },
  mediterranean: {
    spices: [
      { name: "זעתר", emoji: "🌿" },
      { name: "סומאק", emoji: "🔴" },
      { name: "כמון", emoji: "🟤" },
    ],
    tip: "הוסיפו מיץ לימון טרי בסוף הבישול לרעננות מקסימלית.",
  },
  american: {
    spices: [
      { name: "פפריקה מעושנת", emoji: "🌶️" },
      { name: "מלח שום", emoji: "🧂" },
      { name: "פלפל שחור", emoji: "⚫" },
    ],
    tip: "תנו לבשר לנוח 5 דקות אחרי הצלייה כדי לשמור על העסיסיות.",
  },
  mexican: {
    spices: [
      { name: "צ׳ילי", emoji: "🌶️" },
      { name: "כוסברה", emoji: "🌿" },
      { name: "ליים", emoji: "🍋" },
    ],
    tip: "שלבו חמוץ ומתוק — ליים טרי עם דבש זה הסוד למקסיקני אותנטי.",
  },
  breakfast: {
    spices: [
      { name: "קינמון", emoji: "🟫" },
      { name: "וניל", emoji: "🍦" },
      { name: "אגוז מוסקט", emoji: "🥜" },
    ],
    tip: "ביצים בטמפרטורת החדר מתערבבות טוב יותר ונותנות תוצאה אוורירית.",
  },
  desserts: {
    spices: [
      { name: "וניל", emoji: "🍦" },
      { name: "קקאו", emoji: "🍫" },
      { name: "קינמון", emoji: "🟫" },
    ],
    tip: "נפו את הקמח תמיד — זה ההבדל בין עוגה כבדה לעוגה אווירית.",
  },
  salads: {
    spices: [
      { name: "שמיר", emoji: "🌿" },
      { name: "נענע", emoji: "🍃" },
      { name: "שומשום", emoji: "🌰" },
    ],
    tip: "הוסיפו את הרוטב רק רגע לפני ההגשה כדי לשמור על הפריכות.",
  },
  soups: {
    spices: [
      { name: "כורכום", emoji: "🟡" },
      { name: "עלי דפנה", emoji: "🍃" },
      { name: "טימין", emoji: "🌿" },
    ],
    tip: "בשלו על אש נמוכה ולאט — סבלנות היא הסוד למרק מושלם.",
  },
};

const CategorySelection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [loadingRecipe, setLoadingRecipe] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [savingResult, setSavingResult] = useState<string | null>(null);
  const { search, saveGeneratedRecipe, clearResults, isSearching, results, error } = useRecipeSearch();

  const selectedCategory = CUISINE_CATEGORIES.find((c) => c.id === selectedCategoryId) || null;
  const sidebarData = selectedCategoryId ? CUISINE_SIDEBAR_DATA[selectedCategoryId] : null;

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

  const handleCardClick = (cat: CuisineCategory) => {
    setSelectedCategoryId((prev) => (prev === cat.id ? null : cat.id));
  };

  const handleViewRecipes = () => {
    if (!selectedCategory) return;
    setShowRecipeDialog(true);
  };

  const handleRecipeClick = async (recipe: CategoryRecipe) => {
    if (loadingRecipe) return;
    setLoadingRecipe(recipe.title);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) {
        toast({ title: "יש להתחבר כדי לצפות במתכון", variant: "destructive" });
        setLoadingRecipe(null);
        return;
      }
      const { data, error } = await supabase
        .from("recipes")
        .insert({
          title: recipe.title,
          ingredients: recipe.ingredients.map((name) => ({ name, quantity: "" })),
          instructions: recipe.instructions,
          cooking_time: recipe.cookingTime,
          user_id: userId,
        })
        .select("id")
        .single();
      if (error || !data) {
        toast({ title: "שגיאה בשמירת המתכון", variant: "destructive" });
        return;
      }
      navigate(`/recipe?id=${data.id}`, { state: { source: "local", from: "/categories" } });
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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* App Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border/50 shadow-soft">
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

      <div className="bg-gradient-to-br from-background via-cream to-accent">
        {/* Page title */}
        {/* bg-background */}
        <div className="sticky top-0 z-30 border-border" style={{ height: "48px" }}>
          <div className="container mx-auto px-4 flex items-center justify-center h-full">
            <h1 className="text-sm font-semibold text-foreground">בחירת קטגוריה 🍽️</h1>
          </div>
        </div>

        {/* Main layout: sidebar (right in RTL = first child) + grid */}
        <div className="flex min-h-[calc(100vh-110px)]">
          {/* Sidebar — first child = right side in RTL */}
          {/* border-l border-border */}
          <aside className="w-[25%] min-w-[280px] max-w-[340px] bg-card flex flex-col h-[calc(100vh-110px)] sticky top-[110px]">
            <AnimatePresence mode="wait">
              {selectedCategory && sidebarData ? (
                <motion.div
                  key={selectedCategory.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col h-full p-5"
                  dir="rtl"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl">{selectedCategory.emoji}</span>
                    <div>
                      <h2 className="font-bold text-foreground text-lg leading-tight">{selectedCategory.nameHe}</h2>
                      <p className="text-xs text-muted-foreground">{selectedCategory.subtitle}</p>
                    </div>
                  </div>
                  <div className="h-px bg-border mb-5" />
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3">🧂 תבלינים מרכזיים</h3>
                    <div className="flex flex-wrap gap-2">
                      {sidebarData.spices.map((spice) => (
                        <div
                          key={spice.name}
                          className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5"
                        >
                          <span className="text-base">{spice.emoji}</span>
                          <span className="text-sm text-foreground font-medium">{spice.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6 bg-accent/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">טיפ של שף</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{sidebarData.tip}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 text-center">
                    {selectedCategory.recipes.length} מתכונים זמינים
                  </p>
                  <div className="mt-auto">
                    <Button
                      onClick={handleViewRecipes}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 font-bold text-sm"
                    >
                      צפה במתכונים ←
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center justify-center h-full p-6 text-center"
                  dir="rtl"
                >
                  <span className="text-4xl mb-4">👨‍🍳</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    בחר מטבח כדי לראות טיפים של שפים ותבלינים מומלצים
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>

          {/* Content area (grid + search) */}
          <main className="flex-1 px-4 py-4 space-y-4 pb-8 overflow-y-auto">
            {/* Search bar — aligned to grid width */}
            <div className="max-w-[63rem] mx-auto px-4 md:px-8">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedCategoryId(null);
                    }
                  }}
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
            </div>

            {/* Search results */}
            {(isSearching || (hasSearched && !isSearching)) && (
              <div className="max-w-[63rem] mx-auto px-4 md:px-8">
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
                  const isSelected = selectedCategoryId === cat.id;
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
                      onClick={() => handleCardClick(cat)}
                      className={cn(
                        "group relative rounded-2xl overflow-hidden cursor-pointer select-none aspect-[16/9] transition-all duration-200",
                        isSelected
                          ? "ring-[3px] ring-primary ring-offset-2 ring-offset-background shadow-lg"
                          : "ring-0",
                      )}
                      style={{ boxShadow: "0 2px 10px -2px hsl(0 0% 0% / 0.12)" }}
                    >
                      <img
                        src={imgUrl}
                        alt={cat.nameHe}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[400ms] ease-in-out group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                      {isSelected && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-md z-10">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
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
            {filtered.length === 0 && !(hasSearched && results.length > 0) && (
              <p className="text-center text-muted-foreground mt-8">לא נמצאו קטגוריות תואמות</p>
            )}
          </main>
        </div>
      </div>

      {/* Recipe popup dialog */}
      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {selectedCategory?.emoji} {selectedCategory?.nameHe}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {selectedCategory?.recipes.map((recipe, i) => (
              <motion.button
                key={recipe.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleRecipeClick(recipe)}
                disabled={!!loadingRecipe}
                className={cn(
                  "w-full flex flex-col gap-1.5 px-4 py-3 rounded-2xl bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-sm transition-all duration-150 text-right",
                  loadingRecipe && loadingRecipe !== recipe.title && "opacity-50 pointer-events-none",
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground text-sm">{recipe.title}</p>
                  {loadingRecipe === recipe.title && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
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
              </motion.button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategorySelection;
