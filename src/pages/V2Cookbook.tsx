import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Search, Plus, BookOpen, Trash2, ArrowRight, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useV2Cookbook } from "@/hooks/useV2Cookbook";
import { SOURCE_BADGES } from "@/types/v2cookbook";
import type { V2CookbookRecipe, RecipeSource } from "@/types/v2cookbook";
import { toast } from "sonner";

const V2Cookbook = () => {
  const navigate = useNavigate();
  const { recipes, removeRecipe, refresh } = useV2Cookbook();
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<RecipeSource | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<V2CookbookRecipe | null>(null);

  const filtered = useMemo(() => {
    let list = recipes;
    if (filterSource) list = list.filter((r) => r.source === filterSource);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((ing) => ing.toLowerCase().includes(q)) ||
          (r.cuisineCategory && r.cuisineCategory.toLowerCase().includes(q))
      );
    }
    return list;
  }, [recipes, search, filterSource]);

  const handleDelete = (id: string) => {
    removeRecipe(id);
    toast.success("המתכון הוסר מהספר");
    if (selectedRecipe?.id === id) setSelectedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-accent via-background to-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/v2-dashboard")}>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">הספר שלי</h1>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">{recipes.length} מתכונים</Badge>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפשו מתכון..."
            className="pr-9 rounded-xl"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filterSource === null ? "default" : "outline"}
            className="rounded-full text-xs"
            onClick={() => setFilterSource(null)}
          >
            הכל
          </Button>
          {(Object.entries(SOURCE_BADGES) as [RecipeSource, typeof SOURCE_BADGES.ai][]).map(([key, val]) => (
            <Button
              key={key}
              size="sm"
              variant={filterSource === key ? "default" : "outline"}
              className="rounded-full text-xs gap-1"
              onClick={() => setFilterSource(filterSource === key ? null : key)}
            >
              {val.emoji} {val.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {recipes.length === 0 ? "הספר ריק — הוסיפו מתכון ראשון!" : "אין תוצאות לחיפוש"}
            </p>
            {recipes.length === 0 && (
              <Button className="rounded-xl" onClick={() => navigate("/v2-dashboard")}>
                הוסיפו מתכון
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((recipe) => {
              const badge = SOURCE_BADGES[recipe.source];
              return (
                <Card
                  key={recipe.id}
                  className="rounded-2xl border border-border hover:shadow-elevated transition-all cursor-pointer overflow-hidden group"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  {/* Heritage photo */}
                  {recipe.heritageImageUrl && (
                    <div className="h-36 overflow-hidden">
                      <img
                        src={recipe.heritageImageUrl}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-foreground leading-tight">{recipe.title}</h3>
                      <Badge className={`${badge.color} shrink-0 text-[10px]`}>
                        {badge.emoji} {badge.label}
                      </Badge>
                    </div>
                    {recipe.cuisineCategory && (
                      <p className="text-xs text-muted-foreground">{recipe.cuisineCategory}</p>
                    )}
                    {recipe.story && (
                      <p className="text-xs text-muted-foreground line-clamp-2">"{recipe.story}"</p>
                    )}
                    {recipe.ingredients.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {recipe.ingredients.slice(0, 4).join(", ")}
                        {recipe.ingredients.length > 4 && ` +${recipe.ingredients.length - 4}`}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      {recipe.cookingTime && (
                        <span className="text-xs text-muted-foreground">⏱ {recipe.cookingTime} דק׳</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/v2-dashboard")}
        className="fixed bottom-20 left-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-elevated hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={(o) => !o && setSelectedRecipe(null)}>
        <DialogContent className="max-w-lg backdrop-blur-sm bg-background/95 rounded-2xl max-h-[85vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl">{selectedRecipe.title}</DialogTitle>
                  <Badge className={SOURCE_BADGES[selectedRecipe.source].color + " text-[10px]"}>
                    {SOURCE_BADGES[selectedRecipe.source].emoji} {SOURCE_BADGES[selectedRecipe.source].label}
                  </Badge>
                </div>
                {selectedRecipe.story && (
                  <DialogDescription>"{selectedRecipe.story}"</DialogDescription>
                )}
              </DialogHeader>

              {selectedRecipe.heritageImageUrl && (
                <img src={selectedRecipe.heritageImageUrl} alt={selectedRecipe.title} className="w-full max-h-56 object-contain rounded-xl border border-border" />
              )}

              {selectedRecipe.ingredients.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">מצרכים</h4>
                  <ul className="space-y-1 text-sm text-foreground">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedRecipe.instructions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">שלבי הכנה</h4>
                  <ol className="space-y-2 text-sm text-foreground">
                    {selectedRecipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedRecipe.ocrText && (
                <div className="p-3 rounded-xl bg-sage-light border border-secondary/20">
                  <p className="text-xs font-medium text-secondary mb-1">טקסט מקורי שחולץ:</p>
                  <p className="text-xs text-foreground whitespace-pre-line">{selectedRecipe.ocrText}</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default V2Cookbook;
