import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, ChefHat, Loader2, Sparkles, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRecipeSearch, SearchRecipeResult } from "@/hooks/useRecipeSearch";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface RecipeSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSelect?: (recipeId: string) => void;
}

const difficultyColors: Record<string, string> = {
  "קל": "bg-green-100 text-green-700 border-green-200",
  "בינוני": "bg-amber-100 text-amber-700 border-amber-200",
  "מאתגר": "bg-red-100 text-red-700 border-red-200",
};

const RecipeSearchOverlay = ({ isOpen, onClose, onRecipeSelect }: RecipeSearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { search, saveGeneratedRecipe, clearResults, isSearching, results, error } = useRecipeSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery("");
      clearResults();
    }
  }, [isOpen, clearResults]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSearch = async () => {
    if (query.trim().length >= 2) {
      await search(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelectRecipe = async (recipe: SearchRecipeResult) => {
    let recipeId = recipe.id;

    // If it's a generated recipe, save it first
    if (recipe.source === "generated") {
      const savedId = await saveGeneratedRecipe(recipe);
      if (savedId) {
        recipeId = savedId;
      } else {
        // Still navigate with generated data in state
        navigate("/recipe", { state: { recipe, fromSearch: true } });
        onClose();
        return;
      }
    }

    if (onRecipeSelect) {
      onRecipeSelect(recipeId);
    }

    // Navigate to recipe page
    navigate(`/recipe?id=${recipeId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />

      {/* Search Container */}
      <div className="relative w-full max-w-2xl animate-slide-up" style={{ animationDuration: "0.3s" }}>
        {/* Search Input Card */}
        <div className="bg-card rounded-2xl shadow-elevated border border-border/50 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-border/50">
            <div className={cn(
              "p-2 rounded-xl transition-all duration-300",
              isSearching ? "bg-primary/20 animate-pulse" : "bg-primary/10"
            )}>
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-primary" />
              )}
            </div>

            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="חפשו מתכון... (למשל: פסטה, עוף בתנור)"
              className="flex-1 border-0 bg-transparent text-lg placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isSearching}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 rounded-xl hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Results */}
          {(results.length > 0 || error) && (
            <div className="max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="p-4 text-center text-destructive">
                  {error}
                </div>
              )}

              {results.length > 0 && (
                <div className="p-2">
                  {results.map((recipe, index) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe)}
                      className="w-full text-right p-4 rounded-xl hover:bg-muted/50 transition-all duration-200 flex items-start gap-4 group animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Recipe Icon */}
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        recipe.source === "generated" 
                          ? "bg-secondary/20 group-hover:bg-secondary/30" 
                          : "bg-primary/10 group-hover:bg-primary/20"
                      )}>
                        {recipe.source === "generated" ? (
                          <Sparkles className="w-5 h-5 text-secondary" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-primary" />
                        )}
                      </div>

                      {/* Recipe Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {recipe.title}
                          </h3>
                          {recipe.source === "generated" && (
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full shrink-0">
                              חדש
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {/* Difficulty */}
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs border",
                            difficultyColors[recipe.difficulty] || difficultyColors["בינוני"]
                          )}>
                            {recipe.difficulty}
                          </span>

                          {/* Cooking Time */}
                          {recipe.cooking_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {recipe.cooking_time} דק׳
                            </span>
                          )}

                          {/* Ingredients Count */}
                          <span className="flex items-center gap-1">
                            <ChefHat className="w-3.5 h-3.5" />
                            {recipe.ingredients?.length || 0} מצרכים
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state after search */}
          {!isSearching && query.length >= 2 && results.length === 0 && !error && (
            <div className="p-8 text-center text-muted-foreground">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>לא נמצאו מתכונים. נסו לחפש משהו אחר!</p>
            </div>
          )}

          {/* Initial hint */}
          {query.length < 2 && results.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm">הקלידו לפחות 2 תווים ולחצו Enter לחיפוש</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeSearchOverlay;
