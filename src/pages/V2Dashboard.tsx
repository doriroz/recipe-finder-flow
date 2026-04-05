import { useState, useMemo } from "react";
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
  Image as ImageIcon,
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

const SAMPLE_GALLERY_IMAGES = [
  { url: "https://img.spoonacular.com/recipes/716429-312x231.jpg", title: "בלני אוכמניות" },
  { url: "https://img.spoonacular.com/recipes/715497-312x231.jpg", title: "פסטה עגבניות שרי" },
  { url: "https://img.spoonacular.com/recipes/644387-312x231.jpg", title: "סלט ים-תיכוני" },
  { url: "https://img.spoonacular.com/recipes/782585-312x231.jpg", title: "מרק עדשים מרוקאי" },
  { url: "https://img.spoonacular.com/recipes/716426-312x231.jpg", title: "שקשוקה קלאסית" },
  { url: "https://img.spoonacular.com/recipes/795751-312x231.jpg", title: "טאקו מקסיקני" },
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

  // Duplicate dialog
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    recipe: V2CookbookRecipe | null;
    existingTitle: string;
  }>({
    open: false,
    recipe: null,
    existingTitle: "",
  });

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
    if (!heritageTitle.trim()) {
      toast.error("נא להזין שם למתכון");
      return;
    }
    const recipe: V2CookbookRecipe = {
      id: crypto.randomUUID(),
      title: heritageTitle,
      story: heritageStory || undefined,
      ingredients: heritageIngredients.split("\n").filter(Boolean),
      instructions: heritageSteps.split("\n").filter(Boolean),
      source: "heritage",
      sourceLabel: SOURCE_BADGES.heritage.label,
      heritageImageUrl: heritagePhoto || undefined,
      ocrText: ocrResult || undefined,
      createdAt: new Date(),
    };
    trySaveRecipe(recipe);
    resetHeritageForm();
    setHeritageOpen(false);
  };

  const handleSavePhotoOnly = () => {
    if (!heritageTitle.trim()) {
      toast.error("נא להזין שם למתכון");
      return;
    }
    const recipe: V2CookbookRecipe = {
      id: crypto.randomUUID(),
      title: heritageTitle,
      story: heritageStory || undefined,
      ingredients: [],
      instructions: [],
      source: "heritage",
      sourceLabel: SOURCE_BADGES.heritage.label,
      heritageImageUrl: heritagePhoto || undefined,
      createdAt: new Date(),
    };
    trySaveRecipe(recipe);
    resetHeritageForm();
    setHeritageOpen(false);
  };

  const simulateOCR = () => {
    setOcrLoading(true);
    setTimeout(() => {
      setOcrResult("טקסט שחולץ מהתמונה יופיע כאן...\nניתן לערוך את התוכן לפני השמירה.");
      setOcrLoading(false);
      toast.success("הטקסט חולץ בהצלחה!");
    }, 2000);
  };

  const resetHeritageForm = () => {
    setHeritageMode("choose");
    setHeritagePhoto(null);
    setHeritageTitle("");
    setHeritageStory("");
    setHeritageIngredients("");
    setHeritageSteps("");
    setOcrResult(null);
  };

  const handleAddLibraryRecipe = (
    cat: (typeof CUISINE_CATEGORIES)[0],
    recipe: (typeof CUISINE_CATEGORIES)[0]["recipes"][0],
  ) => {
    const v2Recipe: V2CookbookRecipe = {
      id: crypto.randomUUID(),
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      cookingTime: recipe.cookingTime,
      difficulty: recipe.difficulty,
      source: "library",
      sourceLabel: SOURCE_BADGES.library.label,
      cuisineCategory: cat.nameHe,
      createdAt: new Date(),
    };
    trySaveRecipe(v2Recipe);
  };

  const selectedCuisineData = CUISINE_CATEGORIES.find((c) => c.id === selectedCuisine);

  const SOURCE_BADGE_STYLES: Record<RecipeSource, string> = {
    ai: "bg-primary/15 text-primary border-primary/20",
    heritage: "bg-sage-light text-sage-dark border-secondary/20",
    library: "bg-orange-light text-orange-dark border-orange-dark/20",
  };

  return (
    <div className="min-h-screen bg-muted" dir="rtl">
      {/* ===== TOP HEADER BAR ===== */}
      <div className="bg-gradient-to-l from-primary via-orange-medium to-primary">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">ספר המתכונים הדיגיטלי</h1>
              <p className="text-xs text-primary-foreground/80">של המשפחה שלנו</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-xl gap-2 bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30 hover:text-primary-foreground"
            onClick={() => navigate("/v2-cookbook")}
          >
            <BookOpen className="w-4 h-4" />
            הספר שלי
          </Button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* ===== TWO-COLUMN: Hero + Heritage ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT (3/5): Hero */}
          <div className="lg:col-span-3">
            <div className="relative rounded-2xl overflow-hidden shadow-elevated">
              <img
                src={heroBg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                width={1920}
                height={800}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/40 to-foreground/10" />

              <div className="relative z-10 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground mb-6">מה נבשל היום?</h2>

                <div className="bg-white/30 backdrop-blur-none rounded-2xl p-5 shadow-elevated border border-border/50">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* AI Fridge */}
                    <button
                      onClick={() => navigate("/select-ingredients")}
                      className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-accent/60 transition-all"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sparkles className="w-7 h-7 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground text-sm">בנו מתכון מהמקרר</p>
                        <p className="text-xs text-muted-foreground mt-0.5">בחרו מה יש לכם במקרר לכם מתכון</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">🤖 עוזר AI</Badge>
                    </button>

                    {/* Library / Discovery */}
                    <button
                      onClick={() => {
                        setLibraryOpen(true);
                        setSelectedCuisine(null);
                      }}
                      className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-accent/60 transition-all"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-orange-light flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Globe className="w-7 h-7 text-orange-dark" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground text-sm">גלו מתכונים פופולריים</p>
                        <p className="text-xs text-muted-foreground mt-0.5">גלו מתכונים מהמטבח העולמי לפי קטגוריה</p>
                      </div>
                      <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-[10px]">
                        🌍 Discovery
                      </Badge>
                    </button>
                  </div>

                  {/* Replaced button with descriptive paragraph */}
                  <p className="text-xs text-muted-foreground text-center leading-relaxed py-2">
                    בחרו מצרכים מהמקרר או גלו סגנון מהמטבח העולמי ← הפיקו מתכון ← אהבתם? שמרו לספר הדיגיטלי שלי
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT (2/5): Heritage */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-b from-accent via-card to-card rounded-2xl p-5 shadow-soft border border-border h-full flex flex-col">
              <h3 className="text-lg font-bold text-foreground mb-1">המורשת הקולינרית שלכם</h3>
              <p className="text-xs text-muted-foreground mb-4">שמרו מתכוני זיכרון ישירות לגלריה — ללא תהליך בישול</p>

              <Card
                className="cursor-pointer border-2 border-dashed border-secondary/30 hover:border-secondary/60 rounded-2xl transition-all hover:shadow-soft group flex-1"
                onClick={() => {
                  setHeritageOpen(true);
                  setHeritageMode("choose");
                }}
              >
                <CardContent className="p-5 flex flex-col items-center justify-center gap-3 text-center h-full">
                  <div className="w-14 h-14 rounded-2xl bg-sage-light flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-7 h-7 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">שימור זיכרון משפחתי</p>
                    <p className="text-xs text-muted-foreground mt-1">העלו מתכון מסבתא!</p>
                  </div>
                  <Badge className="bg-sage-light text-sage-dark border-secondary/20">👵 אוצר משפחתי</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* ===== UNIFIED GALLERY: הספר הדיגיטלי שלי ===== */}
        <div
          className="rounded-2xl overflow-hidden border border-border shadow-soft"
          style={{ background: "linear-gradient(180deg, hsl(var(--accent) / 0.3) 0%, hsl(var(--card)) 100%)" }}
        >
          {/* Gallery header with glassmorphism */}
          <div className="bg-card/70 backdrop-blur-md border-b border-border px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">הספר הדיגיטלי שלי</h3>
                {recipes.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {recipes.length}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary text-xs gap-1"
                onClick={() => navigate("/v2-cookbook")}
              >
                צפו בספר המלא →
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              כל המתכונים שתאספו או תשמרו יחכו לכם כאן, ממנה תוכלו להפיק ספר מתכונים מודפס.
            </p>

            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant={galleryFilter === null ? "default" : "outline"}
                className="rounded-full text-xs"
                onClick={() => setGalleryFilter(null)}
              >
                הכל
              </Button>
              <Button
                size="sm"
                variant={galleryFilter === "heritage" ? "default" : "outline"}
                className="rounded-full text-xs gap-1"
                onClick={() => setGalleryFilter(galleryFilter === "heritage" ? null : "heritage")}
              >
                👵 מורשת משפחתית
              </Button>
              <Button
                size="sm"
                variant={galleryFilter === "ai" ? "default" : "outline"}
                className="rounded-full text-xs gap-1"
                onClick={() => setGalleryFilter(galleryFilter === "ai" ? null : "ai")}
              >
                🤖 מתכוני AI
              </Button>
              <Button
                size="sm"
                variant={galleryFilter === "library" ? "default" : "outline"}
                className="rounded-full text-xs gap-1"
                onClick={() => setGalleryFilter(galleryFilter === "library" ? null : "library")}
              >
                🌍 מהעולם
              </Button>

              {/* Search */}
              <div className="relative mr-auto">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  placeholder="חפשו מתכון..."
                  className="pr-8 h-8 text-xs rounded-full w-40"
                />
                {gallerySearch && (
                  <button onClick={() => setGallerySearch("")} className="absolute left-2.5 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Gallery grid */}
          <div className="p-5">
            {filteredRecipes.length === 0 && recipes.length === 0 ? (
              /* Empty state */
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-accent flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">הספר שלך עדיין ריק</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  התחילו לבשל או לשמר זיכרון כדי למלא אותו!
                </p>
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">אין תוצאות לחיפוש</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map((recipe) => {
                  const badgeStyle = SOURCE_BADGE_STYLES[recipe.source];
                  const badgeInfo = SOURCE_BADGES[recipe.source];
                  return (
                    <Card
                      key={recipe.id}
                      className="rounded-2xl border border-border hover:shadow-elevated hover:scale-[1.03] transition-all cursor-pointer overflow-hidden group"
                      onClick={() => navigate("/v2-cookbook")}
                    >
                      {/* Image */}
                      {recipe.heritageImageUrl ? (
                        <div className="h-40 overflow-hidden relative">
                          <img
                            src={recipe.heritageImageUrl}
                            alt={recipe.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className={`absolute top-2 left-2 ${badgeStyle} text-[10px]`}>
                            {badgeInfo.emoji} {badgeInfo.label}
                          </Badge>
                        </div>
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-accent to-muted flex items-center justify-center relative">
                          {recipe.source === "heritage" ? (
                            <Camera className="w-10 h-10 text-muted-foreground/40" />
                          ) : (
                            <ChefHat className="w-10 h-10 text-muted-foreground/40" />
                          )}
                          <Badge className={`absolute top-2 left-2 ${badgeStyle} text-[10px]`}>
                            {badgeInfo.emoji} {badgeInfo.label}
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-bold text-foreground leading-tight">{recipe.title}</h4>
                        {recipe.story && (
                          <p className="text-xs text-muted-foreground line-clamp-2 italic">"{recipe.story}"</p>
                        )}
                        {recipe.cuisineCategory && (
                          <p className="text-xs text-muted-foreground">{recipe.cuisineCategory}</p>
                        )}
                        {recipe.ingredients.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {recipe.ingredients.slice(0, 3).join(", ")}
                            {recipe.ingredients.length > 3 && ` +${recipe.ingredients.length - 3}`}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          {recipe.cookingTime && (
                            <span className="text-xs text-muted-foreground">⏱ {recipe.cookingTime} דק׳</span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecipe(recipe.id);
                              toast.success("הוסר מהספר");
                            }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
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

            {/* Sample images when no real recipes but showing "all" */}
            {recipes.length === 0 && !galleryFilter && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-3 text-center">דוגמאות מהמטבח העולמי:</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {SAMPLE_GALLERY_IMAGES.map((img, i) => (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden border border-border hover:shadow-soft transition-shadow"
                    >
                      <img src={img.url} alt={img.title} className="w-full aspect-square object-cover" loading="lazy" />
                      <p className="text-[10px] text-muted-foreground p-1.5 truncate text-center">{img.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== BOTTOM NAV BAR ===== */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-around py-2">
          {[
            { label: "הספר שלי", icon: BookOpen, path: "/v2-cookbook", active: false },
            {
              label: "זיכרון",
              icon: Camera,
              action: () => {
                setHeritageOpen(true);
                setHeritageMode("choose");
              },
              active: false,
            },
            {
              label: "מתכונים",
              icon: Globe,
              action: () => {
                setLibraryOpen(true);
                setSelectedCuisine(null);
              },
              active: false,
            },
            { label: "מהמקרר", icon: Sparkles, path: "/select-ingredients", active: false },
            { label: "ראשי", icon: ChefHat, path: "/v2-dashboard", active: true },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => (item.path ? navigate(item.path) : item.action?.())}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== HERITAGE DIALOG ===== */}
      <Dialog
        open={heritageOpen}
        onOpenChange={(o) => {
          setHeritageOpen(o);
          if (!o) resetHeritageForm();
        }}
      >
        <DialogContent className="max-w-lg backdrop-blur-md bg-card/95 rounded-2xl max-h-[85vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-right">שימור זיכרון משפחתי</DialogTitle>
            <DialogDescription className="text-right">שמרו את המתכונים של המשפחה לדורות הבאים</DialogDescription>
          </DialogHeader>

          {heritageMode === "choose" && (
            <div className="space-y-4 pt-2">
              <button
                onClick={() => document.getElementById("heritage-photo-input")?.click()}
                className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-secondary transition-colors flex flex-col items-center gap-3 group"
              >
                <Upload className="w-10 h-10 text-muted-foreground group-hover:text-secondary transition-colors" />
                <span className="font-medium text-foreground">העלו תמונה של מתכון כתוב</span>
                <span className="text-xs text-muted-foreground">צילום מתכון בכתב יד, כרטיסייה ישנה</span>
              </button>
              <input
                id="heritage-photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />

              <button
                onClick={() => setHeritageMode("manual")}
                className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center gap-3 group"
              >
                <PenLine className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium text-foreground">הקלדה ידנית</span>
                <span className="text-xs text-muted-foreground">הזינו שם, סיפור, מצרכים ושלבים</span>
              </button>
            </div>
          )}

          {heritageMode === "photo" && heritagePhoto && (
            <div className="space-y-4 pt-2">
              <img
                src={heritagePhoto}
                alt="uploaded recipe"
                className="w-full max-h-48 object-contain rounded-xl border border-border"
              />
              <div className="space-y-2">
                <Label>שם המתכון *</Label>
                <Input
                  value={heritageTitle}
                  onChange={(e) => setHeritageTitle(e.target.value)}
                  placeholder="למשל: עוגת שוקולד של סבתא רחל"
                />
              </div>
              <div className="space-y-2">
                <Label>הסיפור מאחורי המתכון</Label>
                <Textarea
                  value={heritageStory}
                  onChange={(e) => setHeritageStory(e.target.value)}
                  placeholder="ספרו את הסיפור..."
                  rows={2}
                />
              </div>
              {!ocrResult ? (
                <div className="flex gap-2">
                  <Button onClick={handleSavePhotoOnly} variant="outline" className="flex-1 rounded-xl">
                    שמור כזיכרון ויזואלי
                  </Button>
                  <Button onClick={simulateOCR} className="flex-1 rounded-xl gap-2" disabled={ocrLoading}>
                    {ocrLoading ? "מחלץ טקסט..." : "הפוך לטקסט"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-sage-light text-sm text-foreground border border-secondary/20">
                    <p className="font-medium mb-1 text-secondary">טקסט שחולץ:</p>
                    <p className="whitespace-pre-line">{ocrResult}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>מצרכים (שורה לכל מצרך)</Label>
                    <Textarea
                      value={heritageIngredients}
                      onChange={(e) => setHeritageIngredients(e.target.value)}
                      rows={3}
                      placeholder="קמח&#10;סוכר&#10;ביצים"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>שלבי הכנה (שורה לכל שלב)</Label>
                    <Textarea
                      value={heritageSteps}
                      onChange={(e) => setHeritageSteps(e.target.value)}
                      rows={3}
                      placeholder="מערבבים...&#10;אופים..."
                    />
                  </div>
                  <Button onClick={handleSaveHeritage} className="w-full rounded-xl">
                    שמור לספר שלי 📖
                  </Button>
                </div>
              )}
            </div>
          )}

          {heritageMode === "manual" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>שם המתכון *</Label>
                <Input
                  value={heritageTitle}
                  onChange={(e) => setHeritageTitle(e.target.value)}
                  placeholder="למשל: קוגל ירושלמי של דודה שרה"
                />
              </div>
              <div className="space-y-2">
                <Label>הסיפור מאחורי המתכון</Label>
                <Textarea
                  value={heritageStory}
                  onChange={(e) => setHeritageStory(e.target.value)}
                  placeholder="ספרו את הסיפור..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>מצרכים (שורה לכל מצרך)</Label>
                <Textarea
                  value={heritageIngredients}
                  onChange={(e) => setHeritageIngredients(e.target.value)}
                  rows={3}
                  placeholder="קמח&#10;סוכר&#10;ביצים"
                />
              </div>
              <div className="space-y-2">
                <Label>שלבי הכנה (שורה לכל שלב)</Label>
                <Textarea
                  value={heritageSteps}
                  onChange={(e) => setHeritageSteps(e.target.value)}
                  rows={3}
                  placeholder="מערבבים...&#10;אופים..."
                />
              </div>
              <Button onClick={handleSaveHeritage} className="w-full rounded-xl">
                שמור לספר שלי 📖
              </Button>
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
                <button
                  key={cat.id}
                  onClick={() => setSelectedCuisine(cat.id)}
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all flex flex-col items-center gap-2 hover:shadow-soft group"
                  style={{ backgroundColor: `hsl(${cat.hue} / 0.15)` }}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                  <span className="font-medium text-sm text-foreground">{cat.nameHe}</span>
                  <span className="text-xs text-muted-foreground">{cat.subtitle}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setSelectedCuisine(null)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                חזרה לקטגוריות
              </button>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {selectedCuisineData?.emoji} {selectedCuisineData?.nameHe}
              </h3>
              {selectedCuisineData?.recipes.map((recipe, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{recipe.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⏱ {recipe.cookingTime} דק׳ · {recipe.difficulty} · {recipe.ingredients.length} מצרכים
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl shrink-0 gap-1 text-xs"
                    onClick={() => handleAddLibraryRecipe(selectedCuisineData!, recipe)}
                  >
                    הוסף לספר שלי
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DUPLICATE CHECK DIALOG ===== */}
      <Dialog
        open={duplicateDialog.open}
        onOpenChange={(o) => setDuplicateDialog({ open: o, recipe: null, existingTitle: "" })}
      >
        <DialogContent className="max-w-sm backdrop-blur-md bg-card/95 rounded-2xl border-border">
          <DialogHeader>
            <DialogTitle className="text-right">מניעת כפילויות</DialogTitle>
            <DialogDescription className="text-right">
              מתכון בשם "{duplicateDialog.existingTitle}" כבר קיים בספר שלך. לשמור כגרסה חדשה?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2 sm:flex-row-reverse">
            <Button
              className="flex-1 rounded-xl"
              onClick={() => {
                if (duplicateDialog.recipe) {
                  const versioned = { ...duplicateDialog.recipe, title: `${duplicateDialog.recipe.title} (גרסה חדשה)` };
                  addRecipeForce(versioned);
                  toast.success("נשמר כגרסה חדשה! 📖");
                }
                setDuplicateDialog({ open: false, recipe: null, existingTitle: "" });
              }}
            >
              שמור כגרסה חדשה
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDuplicateDialog({ open: false, recipe: null, existingTitle: "" })}
            >
              ביטול
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default V2Dashboard;
