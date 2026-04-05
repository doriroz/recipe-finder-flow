import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChefHat,
  Camera,
  BookOpen,
  Globe,
  Sparkles,
  Upload,
  PenLine,
  ArrowLeft,
  Search,
  X,
  Trash2,
  Plus,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CUISINE_CATEGORIES } from "@/data/categoryRecipes";
import { useV2Cookbook } from "@/hooks/useV2Cookbook";
import type { V2CookbookRecipe, RecipeSource } from "@/types/v2cookbook";
import { SOURCE_BADGES } from "@/types/v2cookbook";
import { toast } from "sonner";
import heroBg from "@/assets/v2-hero-bg.jpg";

const INSPIRATION_RECIPES = [
  { url: "https://img.spoonacular.com/recipes/716429-312x231.jpg", title: "בלני אוכמניות", category: "ארוחת בוקר" },
  { url: "https://img.spoonacular.com/recipes/715497-312x231.jpg", title: "פסטה עגבניות שרי", category: "ארוחות מהירות" },
  { url: "https://img.spoonacular.com/recipes/644387-312x231.jpg", title: "סלט ים-תיכוני", category: "בריאות" },
  { url: "https://img.spoonacular.com/recipes/782585-312x231.jpg", title: "מרק עדשים מרוקאי", category: "קלאסיקות משפחתיות" },
  { url: "https://img.spoonacular.com/recipes/716426-312x231.jpg", title: "שקשוקה קלאסית", category: "קלאסיקות משפחתיות" },
  { url: "https://img.spoonacular.com/recipes/795751-312x231.jpg", title: "טאקו מקסיקני", category: "ארוחות מהירות" },
  { url: "https://img.spoonacular.com/recipes/665150-312x231.jpg", title: "עוגת גזר", category: "קינוחים" },
  { url: "https://img.spoonacular.com/recipes/640062-312x231.jpg", title: "קרוקט תפוא״ד", category: "ארוחות מהירות" },
];

const V2Dashboard = () => {
  const navigate = useNavigate();
  const { recipes, addRecipe, addRecipeForce, removeRecipe } = useV2Cookbook();
  const [heritageOpen, setHeritageOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

  // Heritage form state
  const [heritageMode, setHeritageMode] = useState<"choose" | "photo" | "manual">("choose");
  const [heritagePhoto, setHeritagePhoto] = useState<string | null>(null);
  const [heritageTitle, setHeritageTitle] = useState("");
  const [heritageStory, setHeritageStory] = useState("");
  const [heritageIngredients, setHeritageIngredients] = useState("");
  const [heritageSteps, setHeritageSteps] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  // Gallery state
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryFilter, setGalleryFilter] = useState<RecipeSource | null>(null);
  const [commandBarFocused, setCommandBarFocused] = useState(false);

  // Parallax scroll
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Duplicate dialog
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    recipe: V2CookbookRecipe | null;
    existingTitle: string;
  }>({ open: false, recipe: null, existingTitle: "" });

  const filteredRecipes = useMemo(() => {
    let list = recipes;
    if (galleryFilter) list = list.filter((r) => r.source === galleryFilter);
    if (gallerySearch.trim()) {
      const q = gallerySearch.trim().toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.ingredients.some((ing) => ing.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [recipes, gallerySearch, galleryFilter]);

  const trySaveRecipe = (recipe: V2CookbookRecipe) => {
    const result = addRecipe(recipe);
    if (result.isDuplicate) {
      setDuplicateDialog({ open: true, recipe, existingTitle: result.existingTitle || recipe.title });
    } else {
      toast.success("המתכון נשמר לספר שלי! 📖");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setHeritagePhoto(ev.target?.result as string);
      setHeritageMode("photo");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveHeritage = () => {
    if (!heritageTitle.trim()) { toast.error("נא להזין שם למתכון"); return; }
    const recipe: V2CookbookRecipe = {
      id: crypto.randomUUID(), title: heritageTitle, story: heritageStory || undefined,
      ingredients: heritageIngredients.split("\n").filter(Boolean),
      instructions: heritageSteps.split("\n").filter(Boolean),
      source: "heritage", sourceLabel: SOURCE_BADGES.heritage.label,
      heritageImageUrl: heritagePhoto || undefined, ocrText: ocrResult || undefined, createdAt: new Date(),
    };
    trySaveRecipe(recipe); resetHeritageForm(); setHeritageOpen(false);
  };

  const handleSavePhotoOnly = () => {
    if (!heritageTitle.trim()) { toast.error("נא להזין שם למתכון"); return; }
    const recipe: V2CookbookRecipe = {
      id: crypto.randomUUID(), title: heritageTitle, story: heritageStory || undefined,
      ingredients: [], instructions: [], source: "heritage", sourceLabel: SOURCE_BADGES.heritage.label,
      heritageImageUrl: heritagePhoto || undefined, createdAt: new Date(),
    };
    trySaveRecipe(recipe); resetHeritageForm(); setHeritageOpen(false);
  };

  const simulateOCR = () => {
    setOcrLoading(true);
    setTimeout(() => {
      setOcrResult("טקסט שחולץ מהתמונה יופיע כאן...\nניתן לערוך את התוכן לפני השמירה.");
      setOcrLoading(false); toast.success("הטקסט חולץ בהצלחה!");
    }, 2000);
  };

  const resetHeritageForm = () => {
    setHeritageMode("choose"); setHeritagePhoto(null); setHeritageTitle("");
    setHeritageStory(""); setHeritageIngredients(""); setHeritageSteps(""); setOcrResult(null);
  };

  const handleAddLibraryRecipe = (
    cat: (typeof CUISINE_CATEGORIES)[0],
    recipe: (typeof CUISINE_CATEGORIES)[0]["recipes"][0],
  ) => {
    const v2Recipe: V2CookbookRecipe = {
      id: crypto.randomUUID(), title: recipe.title, ingredients: recipe.ingredients,
      instructions: recipe.instructions, cookingTime: recipe.cookingTime,
      difficulty: recipe.difficulty, source: "library", sourceLabel: SOURCE_BADGES.library.label,
      cuisineCategory: cat.nameHe, createdAt: new Date(),
    };
    trySaveRecipe(v2Recipe);
  };

  const selectedCuisineData = CUISINE_CATEGORIES.find((c) => c.id === selectedCuisine);

  const SOURCE_BADGE_STYLES: Record<RecipeSource, string> = {
    ai: "bg-primary/15 text-primary border-primary/20",
    heritage: "bg-sage-light text-sage-dark border-secondary/20",
    library: "bg-orange-light text-orange-dark border-orange-dark/20",
  };

  // Show inspiration when user has fewer than 4 recipes
  const showInspiration = recipes.length < 4;

  return (
    <div ref={containerRef} className="min-h-screen bg-background" dir="rtl">
      {/* ===== ZONE 1: THE ACTIVE ENGINE (HERO) ===== */}
      <section className="relative overflow-hidden">
        {/* Parallax background */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover scale-110 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-background" />
        </div>

        {/* Header bar */}
        <div className="relative z-10">
          <div className="max-w-5xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-primary-foreground">מה שיש</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-1.5 text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/v2-cookbook")}
            >
              <BookOpen className="w-4 h-4" />
              הספר שלי
            </Button>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-14">
          <h1
            className="text-3xl md:text-4xl font-extrabold text-primary-foreground mb-2 animate-fade-in"
          >
            מה נבשל היום? 🍳
          </h1>
          <p className="text-primary-foreground/70 text-sm mb-8 max-w-md animate-fade-in">
            בחרו מצרכים מהמקרר או גלו סגנונות מהמטבח העולמי — והפיקו מתכון מושלם
          </p>

          {/* Glassmorphism action container */}
          <div className="bg-card/20 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-primary-foreground/10 shadow-elevated animate-scale-in">
            <div className="grid grid-cols-2 gap-4">
              {/* Popular Recipes */}
              <button
                onClick={() => { setLibraryOpen(true); setSelectedCuisine(null); }}
                className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-light flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Globe className="w-7 h-7 text-orange-dark" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-primary-foreground text-sm">מתכונים פופולריים</p>
                  <p className="text-[11px] text-primary-foreground/60 mt-0.5">גילוי טעמים מהעולם</p>
                </div>
                <Badge className="bg-orange-light/80 text-orange-dark border-orange-dark/20 text-[10px]">🌍 מהעולם</Badge>
              </button>

              {/* AI Fridge */}
              <button
                onClick={() => navigate("/select-ingredients")}
                className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-primary-foreground text-sm">בנו מתכון מהמקרר</p>
                  <p className="text-[11px] text-primary-foreground/60 mt-0.5">בחירת מצרכים חכמה</p>
                </div>
                <Badge className="bg-accent/80 text-primary border-primary/20 text-[10px]">🤖 עוזר AI</Badge>
              </button>
            </div>

            {/* CTA button */}
            <Button
              variant="hero"
              size="lg"
              className="w-full mt-5 rounded-2xl gap-2 shadow-elevated animate-pulse"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(35 95% 55%) 100%)",
                boxShadow: "0 0 30px hsl(var(--primary) / 0.4)",
              }}
              onClick={() => navigate("/select-ingredients")}
            >
              <ChefHat className="w-5 h-5" />
              בואו נבשל!
            </Button>
            <p className="text-[10px] text-primary-foreground/50 text-center mt-2">
              תהליך: בחירת מצרכים ← הפקת מתכון ← שמירה לספר
            </p>
          </div>
        </div>
      </section>

      {/* ===== ZONE 2: HERITAGE ROW ===== */}
      <section
        className="relative -mt-4 z-10"
        style={{ transform: `translateY(${scrollY * -0.05}px)` }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div
            className="rounded-3xl p-5 md:p-6 border border-border/60 shadow-card"
            style={{
              background: "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--cream)) 50%, hsl(var(--sage-light)) 100%)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sage-light flex items-center justify-center">
                <Camera className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">שימור זיכרון משפחתי</h2>
                <p className="text-xs text-muted-foreground">שמרו מתכוני מורשת ישירות לספר — ללא תהליך בישול</p>
              </div>
              <Badge className="bg-sage-light text-sage-dark border-secondary/20 mr-auto">👵 מורשת משפחתית</Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setHeritageOpen(true); setHeritageMode("choose"); }}
                className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/40 hover:border-secondary/50 hover:shadow-soft transition-all group"
              >
                <Upload className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
                <div className="text-right">
                  <p className="font-medium text-foreground text-sm">העלו תמונה או הקלידו ידנית</p>
                  <p className="text-[11px] text-muted-foreground">צילום מתכון בכתב יד, כרטיסייה ישנה</p>
                </div>
              </button>
              <Button
                onClick={() => { setHeritageOpen(true); setHeritageMode("choose"); }}
                className="rounded-2xl gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6"
              >
                <PenLine className="w-4 h-4" />
                העלאה ישירה
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ZONE 3: THE LIVING VAULT (GALLERY) ===== */}
      <section
        className="relative mt-8 pb-24"
        style={{ transform: `translateY(${scrollY * -0.02}px)` }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div
            className="rounded-3xl overflow-hidden border border-border/50 shadow-elevated"
            style={{
              background: "linear-gradient(180deg, hsl(var(--cream)) 0%, hsl(var(--cream-dark)) 40%, hsl(var(--card)) 100%)",
            }}
          >
            {/* Gallery Header with glassmorphism */}
            <div className="bg-card/60 backdrop-blur-xl border-b border-border/40 px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">הספר הדיגיטלי שלי</h2>
                  {recipes.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{recipes.length}</Badge>
                  )}
                </div>
                <Button
                  variant="ghost" size="sm"
                  className="text-primary text-xs gap-1"
                  onClick={() => navigate("/v2-cookbook")}
                >
                  צפו בספר המלא →
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                כל המתכונים שתאספו או תשמרו יחכו לכם כאן, ממנה תוכלו להפיק ספר מתכונים מודפס.
              </p>

              {/* AI Command Bar */}
              <div
                className={`relative mb-4 rounded-2xl border-2 transition-all duration-300 ${
                  commandBarFocused
                    ? "border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                    : "border-border/40"
                }`}
                style={{
                  background: commandBarFocused
                    ? "hsl(var(--accent) / 0.5)"
                    : "hsl(var(--card) / 0.5)",
                }}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <Sparkles className={`w-5 h-5 transition-colors ${commandBarFocused ? "text-primary" : "text-muted-foreground"}`} />
                  <Input
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    onFocus={() => setCommandBarFocused(true)}
                    onBlur={() => setCommandBarFocused(false)}
                    placeholder="מה נבשל מהספר שלך היום? 🍽️"
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/70 h-auto p-0"
                  />
                  {gallerySearch && (
                    <button onClick={() => setGallerySearch("")}>
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: null, label: "הכל", emoji: "" },
                  { key: "heritage" as RecipeSource, label: "מורשת", emoji: "👵" },
                  { key: "ai" as RecipeSource, label: "AI", emoji: "🤖" },
                  { key: "library" as RecipeSource, label: "מהעולם", emoji: "🌍" },
                ].map((tab) => (
                  <Button
                    key={tab.label}
                    size="sm"
                    variant={galleryFilter === tab.key ? "default" : "outline"}
                    className="rounded-full text-xs gap-1"
                    onClick={() => setGalleryFilter(galleryFilter === tab.key ? null : tab.key)}
                  >
                    {tab.emoji} {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="p-5">
              {/* Saved recipes (full opacity) */}
              {filteredRecipes.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {filteredRecipes.map((recipe, i) => {
                    const badgeStyle = SOURCE_BADGE_STYLES[recipe.source];
                    const badgeInfo = SOURCE_BADGES[recipe.source];
                    return (
                      <Card
                        key={recipe.id}
                        className="rounded-2xl border-2 border-border hover:border-primary/30 hover:shadow-elevated hover:scale-[1.05] transition-all duration-300 cursor-pointer overflow-hidden group"
                        style={{ animationDelay: `${i * 80}ms` }}
                        onClick={() => navigate("/v2-cookbook")}
                      >
                        {recipe.heritageImageUrl ? (
                          <div className="h-36 overflow-hidden relative">
                            <img
                              src={recipe.heritageImageUrl} alt={recipe.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <Badge className={`absolute top-2 left-2 ${badgeStyle} text-[10px] backdrop-blur-sm`}>
                              {badgeInfo.emoji} {badgeInfo.label}
                            </Badge>
                          </div>
                        ) : (
                          <div className="h-28 bg-gradient-to-br from-accent via-muted to-cream flex items-center justify-center relative">
                            {recipe.source === "heritage" ? (
                              <Camera className="w-8 h-8 text-muted-foreground/30" />
                            ) : (
                              <ChefHat className="w-8 h-8 text-muted-foreground/30" />
                            )}
                            <Badge className={`absolute top-2 left-2 ${badgeStyle} text-[10px] backdrop-blur-sm`}>
                              {badgeInfo.emoji} {badgeInfo.label}
                            </Badge>
                          </div>
                        )}
                        <CardContent className="p-3 space-y-1.5">
                          <h4 className="font-bold text-foreground text-sm leading-tight line-clamp-1">{recipe.title}</h4>
                          {recipe.story && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 italic">"{recipe.story}"</p>
                          )}
                          {recipe.ingredients.length > 0 && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {recipe.ingredients.slice(0, 3).join(", ")}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            {recipe.cookingTime && (
                              <span className="text-[10px] text-muted-foreground">⏱ {recipe.cookingTime} דק׳</span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeRecipe(recipe.id); toast.success("הוסר מהספר"); }}
                              className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {recipes.length === 0 && !galleryFilter && (
                <div className="text-center py-10 space-y-3 mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-accent flex items-center justify-center animate-float">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-bold">הספר שלך עדיין ריק</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    התחילו לבשל או לשמר זיכרון כדי למלא אותו!
                  </p>
                </div>
              )}

              {filteredRecipes.length === 0 && recipes.length > 0 && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground text-sm">אין תוצאות לחיפוש</p>
                </div>
              )}

              {/* Inspiration cards (lower opacity) */}
              {showInspiration && !galleryFilter && !gallerySearch && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-medium">השראה לספר שלך</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {INSPIRATION_RECIPES.map((img, i) => (
                      <div
                        key={i}
                        className="rounded-2xl overflow-hidden border border-border/30 hover:border-primary/20 hover:shadow-soft transition-all duration-300 opacity-70 hover:opacity-100 group cursor-pointer"
                      >
                        <div className="relative h-28 overflow-hidden">
                          <img
                            src={img.url} alt={img.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <Badge className="absolute top-1.5 left-1.5 bg-card/60 backdrop-blur-sm text-foreground/70 text-[9px] border-0">
                            ✨ השראה
                          </Badge>
                        </div>
                        <div className="p-2.5 bg-card/50">
                          <p className="text-xs font-medium text-foreground/80 truncate">{img.title}</p>
                          <p className="text-[10px] text-muted-foreground">{img.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAB */}
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30">
          <Button
            size="lg"
            className="rounded-full gap-2 shadow-elevated px-6"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(35 95% 55%) 100%)",
              boxShadow: "0 8px 30px hsl(var(--primary) / 0.35)",
            }}
            onClick={() => navigate("/select-ingredients")}
          >
            <Plus className="w-5 h-5" />
            התחל לבשל או לשמר זיכרון!
          </Button>
        </div>
      </section>

      {/* ===== V2 BOTTOM NAV ===== */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_-6px_hsl(25_30%_20%/0.1)]">
        <div className="max-w-5xl mx-auto flex items-center justify-around py-2.5 px-2">
          {[
            { label: "ראשי", icon: ChefHat, path: "/v2-dashboard", active: true },
            { label: "מתכונים", icon: Globe, action: () => { setLibraryOpen(true); setSelectedCuisine(null); } },
            { label: "זיכרון", icon: Camera, action: () => { setHeritageOpen(true); setHeritageMode("choose"); } },
            { label: "הספר שלי", icon: BookOpen, path: "/v2-cookbook" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => (item.path ? navigate(item.path) : item.action?.())}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[56px] ${
                item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon
                className={`w-5 h-5 transition-transform duration-200 ${item.active ? "scale-110" : ""}`}
                fill={item.active ? "currentColor" : "none"}
                strokeWidth={item.active ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${item.active ? "font-bold" : ""}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ===== HERITAGE DIALOG ===== */}
      <Dialog open={heritageOpen} onOpenChange={(o) => { setHeritageOpen(o); if (!o) resetHeritageForm(); }}>
        <DialogContent className="max-w-lg backdrop-blur-md bg-card/95 rounded-2xl max-h-[85vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-right">שימור זיכרון משפחתי</DialogTitle>
            <DialogDescription className="text-right">שמרו את המתכונים של המשפחה לדורות הבאים</DialogDescription>
          </DialogHeader>
          {heritageMode === "choose" && (
            <div className="space-y-4 pt-2">
              <button onClick={() => document.getElementById("heritage-photo-input")?.click()}
                className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-secondary transition-colors flex flex-col items-center gap-3 group">
                <Upload className="w-10 h-10 text-muted-foreground group-hover:text-secondary transition-colors" />
                <span className="font-medium text-foreground">העלו תמונה של מתכון כתוב</span>
                <span className="text-xs text-muted-foreground">צילום מתכון בכתב יד, כרטיסייה ישנה</span>
              </button>
              <input id="heritage-photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <button onClick={() => setHeritageMode("manual")}
                className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center gap-3 group">
                <PenLine className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium text-foreground">הקלדה ידנית</span>
                <span className="text-xs text-muted-foreground">הזינו שם, סיפור, מצרכים ושלבים</span>
              </button>
            </div>
          )}
          {heritageMode === "photo" && heritagePhoto && (
            <div className="space-y-4 pt-2">
              <img src={heritagePhoto} alt="uploaded recipe" className="w-full max-h-48 object-contain rounded-xl border border-border" />
              <div className="space-y-2"><Label>שם המתכון *</Label>
                <Input value={heritageTitle} onChange={(e) => setHeritageTitle(e.target.value)} placeholder="למשל: עוגת שוקולד של סבתא רחל" /></div>
              <div className="space-y-2"><Label>הסיפור מאחורי המתכון</Label>
                <Textarea value={heritageStory} onChange={(e) => setHeritageStory(e.target.value)} placeholder="ספרו את הסיפור..." rows={2} /></div>
              {!ocrResult ? (
                <div className="flex gap-2">
                  <Button onClick={handleSavePhotoOnly} variant="outline" className="flex-1 rounded-xl">שמור כזיכרון ויזואלי</Button>
                  <Button onClick={simulateOCR} className="flex-1 rounded-xl gap-2" disabled={ocrLoading}>{ocrLoading ? "מחלץ טקסט..." : "הפוך לטקסט"}</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-sage-light text-sm text-foreground border border-secondary/20">
                    <p className="font-medium mb-1 text-secondary">טקסט שחולץ:</p>
                    <p className="whitespace-pre-line">{ocrResult}</p>
                  </div>
                  <div className="space-y-2"><Label>מצרכים (שורה לכל מצרך)</Label>
                    <Textarea value={heritageIngredients} onChange={(e) => setHeritageIngredients(e.target.value)} rows={3} placeholder="קמח&#10;סוכר&#10;ביצים" /></div>
                  <div className="space-y-2"><Label>שלבי הכנה (שורה לכל שלב)</Label>
                    <Textarea value={heritageSteps} onChange={(e) => setHeritageSteps(e.target.value)} rows={3} placeholder="מערבבים...&#10;אופים..." /></div>
                  <Button onClick={handleSaveHeritage} className="w-full rounded-xl">שמור לספר שלי 📖</Button>
                </div>
              )}
            </div>
          )}
          {heritageMode === "manual" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>שם המתכון *</Label>
                <Input value={heritageTitle} onChange={(e) => setHeritageTitle(e.target.value)} placeholder="למשל: קוגל ירושלמי של דודה שרה" /></div>
              <div className="space-y-2"><Label>הסיפור מאחורי המתכון</Label>
                <Textarea value={heritageStory} onChange={(e) => setHeritageStory(e.target.value)} placeholder="ספרו את הסיפור..." rows={2} /></div>
              <div className="space-y-2"><Label>מצרכים (שורה לכל מצרך)</Label>
                <Textarea value={heritageIngredients} onChange={(e) => setHeritageIngredients(e.target.value)} rows={3} placeholder="קמח&#10;סוכר&#10;ביצים" /></div>
              <div className="space-y-2"><Label>שלבי הכנה (שורה לכל שלב)</Label>
                <Textarea value={heritageSteps} onChange={(e) => setHeritageSteps(e.target.value)} rows={3} placeholder="מערבבים...&#10;אופים..." /></div>
              <Button onClick={handleSaveHeritage} className="w-full rounded-xl">שמור לספר שלי 📖</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== LIBRARY DIALOG ===== */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-2xl backdrop-blur-md bg-card/95 rounded-2xl max-h-[85vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-right">מתכונים פופולריים</DialogTitle>
            <DialogDescription className="text-right">בחרו קטגוריה וגלו מתכונים מהמטבח העולמי</DialogDescription>
          </DialogHeader>
          {!selectedCuisine ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {CUISINE_CATEGORIES.filter((c) => c.type === "cuisine").map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCuisine(cat.id)}
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all flex flex-col items-center gap-2 hover:shadow-soft group"
                  style={{ backgroundColor: `hsl(${cat.hue} / 0.15)` }}>
                  <span className="text-3xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                  <span className="font-medium text-sm text-foreground">{cat.nameHe}</span>
                  <span className="text-xs text-muted-foreground">{cat.subtitle}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <button onClick={() => setSelectedCuisine(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />חזרה לקטגוריות
              </button>
              <h3 className="font-bold text-lg flex items-center gap-2">{selectedCuisineData?.emoji} {selectedCuisineData?.nameHe}</h3>
              {selectedCuisineData?.recipes.map((recipe, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{recipe.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">⏱ {recipe.cookingTime} דק׳ · {recipe.difficulty} · {recipe.ingredients.length} מצרכים</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl shrink-0 gap-1 text-xs"
                    onClick={() => handleAddLibraryRecipe(selectedCuisineData!, recipe)}>הוסף לספר שלי</Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DUPLICATE CHECK DIALOG ===== */}
      <Dialog open={duplicateDialog.open} onOpenChange={(o) => setDuplicateDialog({ open: o, recipe: null, existingTitle: "" })}>
        <DialogContent className="max-w-sm backdrop-blur-md bg-card/95 rounded-2xl border-border">
          <DialogHeader>
            <DialogTitle className="text-right">מניעת כפילויות</DialogTitle>
            <DialogDescription className="text-right">
              מתכון בשם "{duplicateDialog.existingTitle}" כבר קיים בספר שלך. לשמור כגרסה חדשה?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2 sm:flex-row-reverse">
            <Button className="flex-1 rounded-xl" onClick={() => {
              if (duplicateDialog.recipe) {
                const versioned = { ...duplicateDialog.recipe, title: `${duplicateDialog.recipe.title} (גרסה חדשה)` };
                addRecipeForce(versioned); toast.success("נשמר כגרסה חדשה! 📖");
              }
              setDuplicateDialog({ open: false, recipe: null, existingTitle: "" });
            }}>שמור כגרסה חדשה</Button>
            <Button variant="outline" className="flex-1 rounded-xl"
              onClick={() => setDuplicateDialog({ open: false, recipe: null, existingTitle: "" })}>ביטול</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default V2Dashboard;
