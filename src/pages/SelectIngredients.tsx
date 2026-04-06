import { useState, useMemo, useCallback } from "react";
import { Search, X, Sparkles, Check, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { ingredients as mockIngredients, type Ingredient } from "@/data/mockData";
import { useCustomIngredients } from "@/hooks/useCustomIngredients";
import { useGenerateRecipe } from "@/hooks/useGenerateRecipe";
import GeneratingRecipeLoader from "@/components/GeneratingRecipeLoader";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import CreditCounter from "@/components/CreditCounter";

const CATEGORY_META: Record<string, { icon: string; hue: string }> = {
  ירקות: { icon: "🥦", hue: "142 45% 82%" },
  חלבונים: { icon: "🍗", hue: "32 65% 82%" },
  חלבי: { icon: "🧀", hue: "200 55% 82%" },
  דגנים: { icon: "🌾", hue: "48 70% 81%" },
  תבלינים: { icon: "🧂", hue: "355 55% 82%" },
  שימורים: { icon: "🥫", hue: "18 60% 81%" },
  פירות: { icon: "🍎", hue: "340 55% 82%" },
  שמנים: { icon: "🫒", hue: "88 50% 81%" },
  אחר: { icon: "✨", hue: "270 45% 82%" },
};

const SelectIngredients = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [pendingSelections, setPendingSelections] = useState<Set<number>>(new Set());
  const { customIngredients } = useCustomIngredients();
  const { generateRecipe, isGenerating } = useGenerateRecipe();

  const allIngredients = useMemo<Ingredient[]>(() => {
    const custom = customIngredients.map((c) => ({ ...c, popularityScore: 50 }));
    const ids = new Set(mockIngredients.map((i) => i.id));
    const uniqueCustom = custom.filter((c) => !ids.has(c.id));
    return [...mockIngredients, ...uniqueCustom];
  }, [customIngredients]);

  const categories = useMemo(() => Array.from(new Set(allIngredients.map((i) => i.category))), [allIngredients]);

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allIngredients.filter((i) => i.name.includes(searchQuery.trim()));
  }, [allIngredients, searchQuery]);

  const toggle = useCallback((ingredient: Ingredient) => {
    setSelected((prev) => {
      const exists = prev.find((i) => i.id === ingredient.id);
      return exists ? prev.filter((i) => i.id !== ingredient.id) : [...prev, ingredient];
    });
  }, []);

  const remove = useCallback((id: number) => {
    setSelected((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const openModal = useCallback(
    (cat: string) => {
      const preSelected = new Set(
        allIngredients.filter((i) => i.category === cat && selected.some((s) => s.id === i.id)).map((i) => i.id),
      );
      setPendingSelections(preSelected);
      setOpenCategory(cat);
    },
    [allIngredients, selected],
  );

  const confirmSelections = useCallback(() => {
    if (!openCategory) return;
    const catIngredients = allIngredients.filter((i) => i.category === openCategory);
    catIngredients.forEach((ing) => {
      const wasSelected = selected.some((s) => s.id === ing.id);
      const isNowPending = pendingSelections.has(ing.id);
      if (!wasSelected && isNowPending) toggle(ing);
      if (wasSelected && !isNowPending) toggle(ing);
    });
    setOpenCategory(null);
    setPendingSelections(new Set());
  }, [openCategory, allIngredients, selected, pendingSelections, toggle]);

  const togglePending = useCallback((id: number) => {
    setPendingSelections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleGenerate = async () => {
    if (selected.length >= 2) {
      await generateRecipe({ ingredients: selected });
    }
  };

  const canGenerate = selected.length >= 2;
  const openMeta = openCategory ? (CATEGORY_META[openCategory] ?? { icon: "🍽️", hue: "30 30% 82%" }) : null;
  const openIngredients = openCategory
    ? allIngredients.filter((i) => i.category === openCategory).sort((a, b) => b.popularityScore - a.popularityScore)
    : [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {isGenerating && <GeneratingRecipeLoader />}

      <div className="flex min-h-screen">
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Search bar - fixed height, no chips */}
          <div className="bg-card border-b border-border px-4 md:px-8 flex items-center" style={{ height: "70px" }}>
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="מה יש לכם במקרר היום?"
                    className="pr-10 rounded-2xl h-12 text-base border-border bg-muted/30 focus:bg-card"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-2xl shrink-0 border-border hover:bg-accent"
                  onClick={() => navigate("/ingredients")}
                  title="מצא מתכון מתמונה"
                >
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </Button>
                <CreditCounter />
              </div>

              {/* Search results dropdown */}
              {searchQuery.trim() && filteredBySearch.length > 0 && (
                <div className="relative">
                  <div className="absolute top-2 left-0 right-0 z-20 bg-card border border-border rounded-2xl shadow-sm max-h-48 overflow-y-auto">
                    {filteredBySearch.map((ing) => {
                      const isSelected = selected.some((s) => s.id === ing.id);
                      return (
                        <button
                          key={ing.id}
                          onClick={() => {
                            toggle(ing);
                            setSearchQuery("");
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-muted/60 transition-colors",
                            isSelected && "bg-accent",
                          )}
                        >
                          <span className="text-xl">{ing.emoji}</span>
                          <span className="flex-1 text-sm font-medium text-foreground">{ing.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category grid */}
          <main className="flex-1 overflow-y-auto pb-32 md:pb-8">
            <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">
              <h2 className="text-lg font-bold text-foreground mb-4">בחרו קטגוריה</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const meta = CATEGORY_META[cat] ?? { icon: "🍽️", hue: "30 30% 82%" };
                  const catIngredients = allIngredients.filter((i) => i.category === cat);
                  const selectedCount = catIngredients.filter((i) => selected.some((s) => s.id === i.id)).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => openModal(cat)}
                      className="relative rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer select-none"
                      style={{
                        background: `hsl(${meta.hue})`,
                        minHeight: "140px",
                        boxShadow: "0 2px 10px -2px hsl(0 0% 0% / 0.08)",
                      }}
                    >
                      {selectedCount > 0 && (
                        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                          {selectedCount}
                        </span>
                      )}
                      <span className="text-5xl">{meta.icon}</span>
                      <span className="font-semibold text-foreground text-sm">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </main>
        </div>

        {/* Desktop sidebar - right side */}
        {!isMobile && (
          <div className="w-72 lg:w-80 shrink-0 h-screen sticky top-0 bg-card border-l border-border flex flex-col order-first animate-slide-in-right">
            <div
              className="px-5 border-b border-border flex items-center bg-gradient-to-l from-primary/10 via-accent/60 to-card"
              style={{ height: "70px" }}
            >
              <h2 className="font-bold text-primary text-base">המצרכים שלי</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              {selected.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">בחרו מצרכים כדי להתחיל 🧑‍🍳</p>
              ) : (
                selected.map((ing, index) => (
                  <div
                    key={ing.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/60 group animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  >
                    <span className="text-lg leading-none">{ing.emoji}</span>
                    <span className="flex-1 text-sm font-medium text-foreground">{ing.name}</span>
                    <button
                      onClick={() => remove(ing.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5"
                      aria-label={`הסר ${ing.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-4 border-t border-border">
              <Button
                variant="hero"
                className="w-full"
                disabled={!canGenerate || isGenerating}
                onClick={handleGenerate}
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? "יוצר מתכון..." : "מצא לי מתכונים!"}
                {canGenerate && !isGenerating && (
                  <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs mr-1">
                    {selected.length} מצרכים
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile floating bottom bar */}
      {isMobile && (
        <div className="fixed bottom-16 inset-x-0 z-30 px-4 pb-3">
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-lg p-3 space-y-2">
            {selected.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {selected.map((ing) => (
                  <span
                    key={ing.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground border border-primary/20 shrink-0"
                  >
                    <span>{ing.emoji}</span>
                    <span>{ing.name}</span>
                    <button
                      onClick={() => remove(ing.id)}
                      className="mr-0.5 hover:text-destructive"
                      aria-label={`הסר ${ing.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Button variant="hero" className="w-full" disabled={!canGenerate || isGenerating} onClick={handleGenerate}>
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "יוצר מתכון..." : "מצא לי מתכונים!"}
              {canGenerate && !isGenerating && (
                <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs mr-1">
                  {selected.length} מצרכים
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Category Dialog */}
      <Dialog
        open={!!openCategory}
        onOpenChange={(open) => {
          if (!open) {
            setOpenCategory(null);
            setPendingSelections(new Set());
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden backdrop-blur-sm">
          {openCategory && openMeta && (
            <>
              <div className="px-6 pt-6 pb-4" style={{ background: `hsl(${openMeta.hue})` }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-right">
                    <span className="text-3xl">{openMeta.icon}</span>
                    <span className="text-lg font-bold text-foreground">{openCategory}</span>
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="max-h-[50vh] overflow-y-auto px-4 py-3 space-y-1">
                {openIngredients.map((ing) => {
                  const isPending = pendingSelections.has(ing.id);
                  return (
                    <button
                      key={ing.id}
                      onClick={() => togglePending(ing.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-right",
                        isPending
                          ? "bg-accent border border-primary/30"
                          : "hover:bg-muted/40 border border-transparent",
                      )}
                    >
                      <Checkbox checked={isPending} className="pointer-events-none" />
                      <span className="text-xl">{ing.emoji}</span>
                      <span className="flex-1 text-sm font-medium text-foreground">{ing.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="px-4 pb-5 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  {pendingSelections.size > 0 ? `נבחרו ${pendingSelections.size} מצרכים` : "בחרו מצרכים"}
                </p>
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={pendingSelections.size === 0}
                  onClick={confirmSelections}
                >
                  הוסף מצרכים ({pendingSelections.size})
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelectIngredients;
