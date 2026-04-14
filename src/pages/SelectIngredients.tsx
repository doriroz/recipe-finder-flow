mport { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Sparkles, Check, Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { ingredients as mockIngredients, type Ingredient } from "@/data/mockData";
import { useCustomIngredients } from "@/hooks/useCustomIngredients";
import { useGenerateRecipe } from "@/hooks/useGenerateRecipe";
import { useIngredientPairings } from "@/hooks/useIngredientPairings";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsMobile } from "@/hooks/use-mobile";
import GeneratingRecipeLoader from "@/components/GeneratingRecipeLoader";
import ImageUpload from "@/components/ImageUpload";
import { cn } from "@/lib/utils";

import dairyImg from "@/assets/categories/dairy.jpg";
import vegetablesImg from "@/assets/categories/vegetables.jpg";
import fruitsImg from "@/assets/categories/fruits.jpg";
import grainsImg from "@/assets/categories/grains.jpg";
import proteinsImg from "@/assets/categories/proteins.jpg";
import cannedImg from "@/assets/categories/canned.jpg";
import oilsImg from "@/assets/categories/oils.jpg";
import spicesImg from "@/assets/categories/spices.jpg";
import bakeryImg from "@/assets/categories/bakery.jpg";

const CATEGORY_META: Record<string, { hue: string; subtitle: string; image: string }> = {
  חלבי: { hue: "200 55% 82%", subtitle: "גבינות וחלב", image: dairyImg },
  ירקות: { hue: "142 45% 82%", subtitle: "טריים ומזינים", image: vegetablesImg },
  פירות: { hue: "340 55% 82%", subtitle: "מתוקים וצבעוניים", image: fruitsImg },
  דגנים: { hue: "48 70% 81%", subtitle: "פחמימות ואנרגיה", image: grainsImg },
  חלבונים: { hue: "32 65% 82%", subtitle: "בשר, דגים וביצים", image: proteinsImg },
  שימורים: { hue: "18 60% 81%", subtitle: "מוצרים עמידים", image: cannedImg },
  שמנים: { hue: "88 50% 81%", subtitle: "שומנים בריאים", image: oilsImg },
  תבלינים: { hue: "355 55% 82%", subtitle: "טעמים וריחות", image: spicesImg },
  מאפים: { hue: "30 60% 82%", subtitle: "טרי מהתנור", image: bakeryImg },
  אחר: { hue: "270 45% 82%", subtitle: "עוד מצרכים", image: "" },
};

// Fixed 9 categories to always render
const FIXED_CATEGORIES = ["חלבי", "ירקות", "פירות", "דגנים", "חלבונים", "שימורים", "שמנים", "תבלינים", "מאפים"];

const SelectIngredients = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAdmin } = useIsAdmin();
  const [selected, setSelected] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [pendingSelections, setPendingSelections] = useState<Set<number>>(new Set());
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const { customIngredients } = useCustomIngredients();
  const { generateRecipe, isGenerating } = useGenerateRecipe();

  const allIngredients = useMemo<Ingredient[]>(() => {
    const custom = customIngredients.map((c) => ({ ...c, popularityScore: 50 }));
    const ids = new Set(mockIngredients.map((i) => i.id));
    const uniqueCustom = custom.filter((c) => !ids.has(c.id));
    return [...mockIngredients, ...uniqueCustom];
  }, [customIngredients]);

  console.log("allIngredients : " + allIngredients);
  const categories = useMemo(() => Array.from(new Set(allIngredients.map((i) => i.category))), [allIngredients]);

  const { relatedCategories, hasSelection } = useIngredientPairings(selected, allIngredients);
  console.log("relatedCategories : ");
  console.log(relatedCategories.values().next().value);

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
      if (showImageDialog) return; // disable when camera active
      const preSelected = new Set(
        allIngredients.filter((i) => i.category === cat && selected.some((s) => s.id === i.id)).map((i) => i.id),
      );
      setPendingSelections(preSelected);
      setOpenCategory(cat);
    },
    [allIngredients, selected, showImageDialog],
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

  const handleImageGenerate = async () => {
    if (imageBase64) {
      await generateRecipe({ imageBase64 });
      setShowImageDialog(false);
      setImageBase64(null);
    }
  };

  const canGenerate = selected.length >= 2;
  const openMeta = openCategory
    ? (CATEGORY_META[openCategory] ?? { hue: "30 30% 82%", subtitle: "", image: "" })
    : null;
  const openIngredients = openCategory
    ? allIngredients.filter((i) => i.category === openCategory).sort((a, b) => b.popularityScore - a.popularityScore)
    : [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {isGenerating && <GeneratingRecipeLoader />}

      <div className="flex min-h-screen">
        {/*<header className="bg-gradient-to-l from-primary/10 via-accent to-card border-b border-primary/20 shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-1 hover:bg-primary/10"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <CreditCounter />
              <div className="flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-primary" />
                <span className="font-bold text-foreground">מה שיש</span>
              </div>
            </div>
          </div>
        </div>
      </header> */} 
        {/* Main content */}
        <div className="flex-1 flex flex-col bg-accent">
          {/* Search bar */}
          <div className="border-border px-4 md:px-8 flex items-center" style={{ height: "70px" }}>
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="מה יש לכם במקרר היום?"
                    className="pr-10 rounded-2xl h-12 text-base border-primary bg-muted/30 focus:bg-card"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-2xl shrink-0 border-border bg-primary/50 hover:bg-primary"
                  onClick={() => setShowImageDialog(true)}
                  title="מצא מתכון מתמונה"
                >
                  <Camera className="w-5 h-5 text-white" />
                </Button>
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

          {/* Bento Category Grid */}
          <main className="flex-1 overflow-y-auto pb-32 md:pb-8">
            <div className="max-w-[63rem] mx-auto px-4 md:px-8 py-6">
              <h2 className="text-lg font-bold text-foreground mb-4">בחרו קטגוריה</h2>

              {/* Uniform 3x3 Grid */}
              <div
                className={cn(isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3")}
              >
                {FIXED_CATEGORIES.map((cat, idx) => {
                  const meta = CATEGORY_META[cat] ?? { hue: "30 30% 82%", subtitle: "", image: "" };
                  const catIngredients = allIngredients.filter((i) => i.category === cat);
                  const selectedCount = catIngredients.filter((i) => selected.some((s) => s.id === i.id)).length;

                  // Pairing logic
                  const isRelated = !hasSelection || relatedCategories.has(cat);
                  const isDimmed = hasSelection && !isRelated;
                  const isGlowing = hasSelection && isRelated && selectedCount === 0;
                  const isDisabledByCamera = showImageDialog;

                  return (
                    <motion.button
                      key={cat}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        //opacity: isDimmed ? 0.6 : 1,
                        y: 0,
                        scale: isGlowing ? 1.08 : 1,
                        //filter: isDimmed ? "blur(2px)" : "blur(0px)",
                      }}
                      whileTap={{ scale: isDisabledByCamera ? 1 : 0.97 }}
                      transition={{
                        opacity: { duration: 0.5, ease: "easeOut" },
                        filter: { duration: 0.5, ease: "easeOut" },
                        y: { duration: 0.3, delay: idx * 0.04 },
                        scale: { type: "spring", stiffness: 260, damping: 18, bounce: 0.5 },
                      }}
                      onClick={() => openModal(cat)}
                      disabled={isDisabledByCamera}
                      className={cn(
                        "group relative rounded-2xl overflow-hidden cursor-pointer select-none",
                        "aspect-[16/9]",
                        isDisabledByCamera && "opacity-50 cursor-not-allowed",
                      )}
                      style={{
                        boxShadow: isGlowing
                          ? `0 0 24px 6px hsl(${meta.hue} / 0.55), 0 4px 16px -4px hsl(0 0% 0% / 0.15)`
                          : selectedCount > 0
                            ? `0 0 12px 2px hsl(${meta.hue} / 0.3), 0 2px 10px -2px hsl(0 0% 0% / 0.1)`
                            : "0 4px 12px -2px hsl(0 0% 0% / 0.12)",
                      }}
                    >
                      {/* Background image with zoom-on-hover */}
                      {meta.image && (
                        <img
                          src={meta.image}
                          alt={cat}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.07]"
                        />
                      )}
                      {!meta.image && <div className="absolute inset-0" style={{ background: `hsl(${meta.hue})` }} />}

                      {/* Dark gradient overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />

                      {/* Selected badge */}
                      <AnimatePresence>
                        {selectedCount > 0 && (
                          <motion.span
                            key="badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-full font-bold leading-none"
                          >
                            {selectedCount}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Glow pulse ring for matched categories */}
                      {isGlowing && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                          style={{
                            background: `radial-gradient(ellipse at center, hsl(${meta.hue} / 0.35) 0%, transparent 65%)`,
                          }}
                          animate={{ opacity: [0.4, 0.85, 0.4] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}

                      {/* Text overlay at bottom center */}
                      <div className="absolute bottom-0 inset-x-0 z-10 flex flex-col items-center justify-end pb-3 px-3">
                        <p className="font-bold text-white text-sm leading-tight drop-shadow-md">{cat}</p>
                        <p className="text-xs text-white/80 mt-0.5 drop-shadow-sm">{meta.subtitle}</p>
                      </div>
                    </motion.button>
                  );
                })}

                {/* Admin-only add category button */}
                {isAdmin && !isMobile && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                    style={{ minHeight: "120px" }}
                    onClick={() => {
                      /* TODO: admin add category dialog */
                    }}
                  >
                    <Plus className="w-8 h-8" />
                    <span className="text-xs font-medium">הוסף קטגוריה</span>
                  </motion.button>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="w-72 lg:w-80 shrink-0 h-screen sticky top-0 border-l flex flex-col order-first animate-slide-in-right">
            <div
              className="px-5 border-border flex items-center bg-gradient-to-l from-primary/10 via-accent/60 to-card"
              style={{ height: "70px" }}
            >
              <h2 className="font-bold text-primary text-base">המצרכים שלי</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
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
              {selected.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">בחרו מצרכים כדי להתחיל 🧑‍🍳</p>
              ) : (
                <AnimatePresence>
                  {selected.map((ing, index) => (
                    <motion.div
                      key={ing.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/60 group"
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile floating bottom drawer */}
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

      {/* Image Upload Dialog */}
      <Dialog
        open={showImageDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowImageDialog(false);
            setImageBase64(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 bg-gradient-to-l from-primary/10 to-accent/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-right">
                <Camera className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold text-foreground">מצא מתכון מתמונה</span>
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              צלמו או העלו תמונה של המצרכים שלכם ונמצא לכם מתכון מתאים
            </p>
            <ImageUpload onImageSelect={(base64) => setImageBase64(base64)} disabled={isGenerating} />
            <Button
              variant="hero"
              className="w-full"
              disabled={!imageBase64 || isGenerating}
              onClick={handleImageGenerate}
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "מחפש מתכון..." : "מצא מתכון מהתמונה"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  <DialogTitle className="text-lg font-bold text-foreground text-right">{openCategory}</DialogTitle>
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
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-right border",
                        isPending ? "border-current/30" : "border-transparent",
                      )}
                      style={{
                        backgroundColor: isPending ? `hsl(${openMeta.hue} / 0.45)` : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!isPending) e.currentTarget.style.backgroundColor = `hsl(${openMeta.hue} / 0.2)`;
                      }}
                      onMouseLeave={(e) => {
                        if (!isPending) e.currentTarget.style.backgroundColor = "";
                      }}
                    >
                      <Checkbox checked={isPending} className="pointer-events-none" />
                      <span className="text-xl">{ing.emoji}</span>
                      <span className="flex-1 text-sm font-medium text-foreground">{ing.name}</span>
                    </button>
                  );
                })}
              </div>

              <div
                className="px-4 pb-5 pt-3 border-t"
                style={{ background: `hsl(${openMeta.hue} / 0.15)`, borderColor: `hsl(${openMeta.hue} / 0.3)` }}
              >
                <p className="text-xs text-muted-foreground text-center mb-2">
                  {pendingSelections.size > 0 ? `נבחרו ${pendingSelections.size} מצרכים` : "בחרו מצרכים"}
                </p>
                <Button
                  className="w-full text-white font-bold"
                  disabled={pendingSelections.size === 0}
                  onClick={confirmSelections}
                  style={{
                    backgroundColor: `hsl(${openMeta.hue.replace(/\d+%$/, (m) => `${Math.max(parseInt(m) - 30, 35)}%`)})`,
                  }}
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
