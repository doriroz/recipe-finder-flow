import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecipeCard, { RecipeCardData } from "@/components/RecipeCard";
import { RecipeResultItem } from "@/types/recipe";
import { calculateDifficulty } from "@/lib/calculateDifficulty";

interface RecipeCarouselProps {
  recipeItems: RecipeResultItem[];
  onStartCooking: (recipeId: string) => void;
  onGenerateAI?: () => void;
  userIngredientCount?: number;
}

const badgeStyles: Record<string, string> = {
  "מוכן לבישול": "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300",
  "כמעט מוכן": "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border-amber-300",
  "חסרים 3 מצרכים": "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200 border-orange-300",
  "המלצת השף": "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border-amber-300",
  "התאמה מצוינת": "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300",
  "אפשרות יצירתית": "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200 border-violet-300",
  "השראה למצרך שלך": "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200 border-blue-300",
  "בסיס מצוין": "bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-200 border-teal-300",
};

const badgeEmoji: Record<string, string> = {
  "מוכן לבישול": "✅",
  "כמעט מוכן": "🔶",
  "חסרים 3 מצרכים": "📋",
  "המלצת השף": "⭐",
  "התאמה מצוינת": "✨",
  "אפשרות יצירתית": "🎨",
  "השראה למצרך שלך": "✨",
  "בסיס מצוין": "🌟",
};

function toDisplayRecipe(item: RecipeResultItem): RecipeCardData {
  const recipe = item.recipe;
  const computedDifficulty = calculateDifficulty(
    recipe.instructions.length,
    recipe.ingredients.length,
    recipe.instructions
  );

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.cooking_time
      ? `מתכון מהיר ב-${recipe.cooking_time} דקות`
      : "מתכון מותאם אישית",
    time: recipe.cooking_time ? `${recipe.cooking_time} דקות` : "30 דקות",
    difficulty: computedDifficulty,
    servings: 4,
    image: "🍳",
    ingredients: recipe.ingredients,
    substitutions: (recipe.substitutions as any) || [],
    why_it_works: item.why_it_works,
    reliability_score: item.reliability_score,
    spoonacular_verified: item.spoonacular_verified,
    source: item.source,
    used_count: item.used_count,
    missed_count: item.missed_count,
    used_ingredient_names: item.used_ingredient_names,
  };
}

function MagicChefCard({ onGenerateAI }: { onGenerateAI: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-6 text-white shadow-xl"
    >
      {/* Sparkle decorations */}
      <div className="absolute top-2 left-4 text-white/30 text-2xl animate-pulse">✦</div>
      <div className="absolute bottom-3 right-6 text-white/20 text-xl animate-pulse" style={{ animationDelay: "0.5s" }}>✧</div>
      <div className="absolute top-4 right-12 text-white/25 text-lg animate-pulse" style={{ animationDelay: "1s" }}>✦</div>

      <div className="relative z-10 text-center space-y-3">
        <div className="text-3xl">👨‍🍳</div>
        <h3 className="text-lg font-bold">מעדיפים התאמה מושלמת?</h3>
        <p className="text-sm text-white/90 leading-relaxed">
          צרו מתכון מותאם אישית עם AI על בסיס המצרכים שלכם!
        </p>
        <Button
          onClick={onGenerateAI}
          size="lg"
          className="bg-white text-purple-700 hover:bg-white/90 font-bold px-8 py-4 text-base rounded-xl shadow-lg transition-all hover:scale-105"
        >
          <Sparkles className="w-5 h-5 ml-2 animate-pulse" />
          צור מתכון AI אישי
        </Button>
      </div>
    </motion.div>
  );
}

const RecipeCarousel = ({ recipeItems, onStartCooking, onGenerateAI }: RecipeCarouselProps) => {
  const [viewMode, setViewMode] = useState<"carousel" | "recipeDetail">("carousel");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(prev + 1, recipeItems.length - 1));
  }, [recipeItems.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const selectRecipe = (index: number) => {
    setSelectedIndex(index);
    setViewMode("recipeDetail");
  };

  const backToCarousel = () => {
    setViewMode("carousel");
  };

  // Single recipe — render directly
  if (recipeItems.length === 1) {
    const display = toDisplayRecipe(recipeItems[0]);
    const activeBadge = recipeItems[0].badge;

    return (
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="text-center mb-6">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${badgeStyles[activeBadge] || badgeStyles["אפשרות יצירתית"]}`}>
              {badgeEmoji[activeBadge]} {activeBadge}
            </span>
            {recipeItems[0].contextLine && (
              <p className="text-muted-foreground text-sm mt-2">{recipeItems[0].contextLine}</p>
            )}
          </div>
          <RecipeCard recipe={display} onStartCooking={() => onStartCooking(recipeItems[0].recipe.id)} />
        </motion.div>



      </div>
    );
  }

  // Detail view
  if (viewMode === "recipeDetail") {
    const item = recipeItems[selectedIndex];
    const display = toDisplayRecipe(item);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          onClick={backToCarousel}
          className="mb-4 flex items-center gap-2"
        >
          <ChevronRight className="w-4 h-4" />
          חזרה לבחירת מתכונים
        </Button>
        <div className="text-center mb-6">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${badgeStyles[item.badge] || badgeStyles["אפשרות יצירתית"]}`}>
            {badgeEmoji[item.badge]} {item.badge}
          </span>
          {item.contextLine && (
            <p className="text-muted-foreground text-sm mt-2">{item.contextLine}</p>
          )}
        </div>
        <RecipeCard recipe={display} onStartCooking={() => onStartCooking(item.recipe.id)} />
      </motion.div>
    );
  }

  // Carousel view
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground mb-1">השף ממליץ</h2>
        <p className="text-muted-foreground text-sm">
          מצאנו {recipeItems.length} מתכונים מתאימים — בחרו את המועדף
        </p>
      </div>

      <div className="relative">
        {/* Navigation arrows */}
        {activeIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors -mr-3"
          >
            <ArrowRight className="w-5 h-5 text-foreground" />
          </button>
        )}
        {activeIndex < recipeItems.length - 1 && (
          <button
            onClick={goNext}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors -ml-3"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Cards */}
        <div className="overflow-hidden px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {recipeItems.map((item, index) => {
                const isActive = index === activeIndex;
                const recipe = item.recipe;
                const computedDifficulty = calculateDifficulty(
                  recipe.instructions.length,
                  recipe.ingredients.length,
                  recipe.instructions
                );

                return (
                  <motion.div
                    key={item.recipe.id}
                    animate={{
                      scale: isActive ? 1 : 0.92,
                      opacity: isActive ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.2 }}
                    onClick={() => selectRecipe(index)}
                    className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                      isActive
                        ? "border-primary bg-card shadow-lg"
                        : "border-border bg-card/60"
                    }`}
                  >
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badgeStyles[item.badge] || badgeStyles["אפשרות יצירתית"]}`}>
                        {badgeEmoji[item.badge]} {item.badge}
                      </span>
                      {isActive && (
                        <span className="text-xs text-primary font-medium">לחצו לפרטים →</span>
                      )}
                    </div>

                    {/* Title & context */}
                    <h3 className="text-lg font-bold text-foreground mb-1">{recipe.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.contextLine}</p>

                    {/* Quick stats */}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>⏱ {recipe.cooking_time ? `${recipe.cooking_time} דקות` : "30 דקות"}</span>
                      <span>📊 {computedDifficulty}</span>
                      <span>🥘 {recipe.ingredients.length} מצרכים</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-4">
        {recipeItems.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === activeIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>



    </div>
  );
};

export default RecipeCarousel;
