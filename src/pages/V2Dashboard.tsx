import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChefHat,
  Camera,
  BookOpen,
  Globe,
  Sparkles,
  Upload,
  ArrowLeft,
  Search,
  X,
  Trash2,
  Star,
  StickyNote,
  PenTool,
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
import HeritageUploadDialog from "@/components/HeritageUploadDialog";
import UserMenu from "@/components/UserMenu";

const V2Dashboard = () => {
  const navigate = useNavigate();
  const { recipes, addRecipe, removeRecipe } = useV2Cookbook();
  const [heritageOpen, setHeritageOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  //const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Gallery state
  const [gallerySearch, setGallerySearch] = useState("");

  // Duplicate dialog
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    recipe: V2CookbookRecipe | null;
    existingTitle: string;
  }>({ open: false, recipe: null, existingTitle: "" });

  const filteredRecipes = useMemo(() => {
    if (!gallerySearch.trim()) return recipes;
    const q = gallerySearch.trim().toLowerCase();
    return recipes.filter(
      (r) => r.title.toLowerCase().includes(q) || r.ingredients.some((ing) => ing.toLowerCase().includes(q)),
    );
  }, [recipes, gallerySearch]);

  const trySaveRecipe = (recipe: V2CookbookRecipe) => {
    const result = addRecipe(recipe);
    if (result.isDuplicate) {
      setDuplicateDialog({ open: true, recipe, existingTitle: result.existingTitle || recipe.title });
    } else {
      toast.success("המתכון נשמר לספר שלי! 📖");
    }
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
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* ===== TOP HEADER (vibrant orange gradient) ===== */}
      <header
        className="relative z-20 shrink-0"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(28 95% 65%) 100%)",
        }}
      >
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          {/*<UserMenu onOpenHistory={() => setIsSidebarOpen(true)} />*/}

          {/* Right side: title + chef hat */}
          <Button
            variant="secondary"
            size="sm"
            className="rounded-2xl gap-1.5 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-soft font-bold"
            onClick={() => navigate("/v2-cookbook")}
          >
            <BookOpen className="w-4 h-4" />
            הספר שלי
          </Button>
          {/* Left side: My Book button */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg md:text-xl font-bold text-primary-foreground">ספר המתכונים הדיגיטלי</span>
          </div>
        </div>
      </header>

      {/* ===== DUAL COLUMN LAYOUT ===== */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* ============ LEFT COLUMN (55%) — stack: Heritage (top) + Gallery (bottom) ============ */}
        {/*<div className="w-full md:w-[55%] flex flex-col order-2 md:order-1">*/}
        <div className="w-full md:w-[55%] flex flex-col order-2">
          {/* --- Heritage row (top) --- */}
          <section
            className="relative px-4 md:px-6 py-5 md:py-6 border-b border-border/40 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(var(--cream)) 0%, hsl(36 40% 92%) 100%)",
            }}
          >
            {/* Decorative sticky note (left) */}
            <div className="hidden md:block absolute top-4 left-6 rotate-[-8deg] opacity-80 pointer-events-none">
              <div className="w-16 h-16 bg-orange-light/80 shadow-soft rounded-sm flex items-center justify-center border border-orange-dark/20">
                <StickyNote className="w-7 h-7 text-orange-dark/70" />
              </div>
            </div>
            {/* Decorative pen/paper (right) */}
            <div className="hidden md:block absolute top-3 right-6 rotate-[8deg] opacity-80 pointer-events-none">
              <PenTool className="w-12 h-12 text-secondary/60" />
            </div>

            <div className="max-w-xl mx-auto bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-card p-5 text-center">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-3">שימור זיכרון משפחתי</h2>

              <div className="flex items-center justify-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-secondary" />
                <Badge className="bg-secondary/10 text-secondary border-secondary/30 rounded-full gap-1 px-3">
                  <Star className="w-3 h-3 fill-current" />
                  מתכון מורשת
                  <Star className="w-3 h-3 fill-current" />
                </Badge>
              </div>

              <p className="text-xs md:text-sm text-muted-foreground mb-4 italic">
                (מתכון זיכרון אינו תהליך בישול, אלא העלאה ישירה לגלריה)
              </p>

              <Button
                onClick={() => setHeritageOpen(true)}
                className="rounded-2xl gap-2 bg-[hsl(25_45%_35%)] hover:bg-[hsl(25_45%_28%)] text-primary-foreground px-6 shadow-soft"
              >
                <Upload className="w-4 h-4" />
                הוסף לארכיון!
              </Button>
            </div>
          </section>

          {/* --- Gallery (bottom) --- */}
          <section
            className="flex-1 px-4 md:px-6 py-5 md:py-6 flex flex-col min-h-0"
            style={{
              background: "linear-gradient(135deg, hsl(var(--cream)) 0%, hsl(36 40% 92%) 100%)",
            }}
          >
            <div className="max-w-xl mx-auto w-full flex-1 flex flex-col min-h-0 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-card p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg md:text-xl font-bold text-foreground">הגלריה המשותפת..</h2>
                {/* Search */}
                {/*<div className="relative w-44 md:w-56">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    placeholder="חפש מתכון..."
                    className="rounded-2xl pr-9 h-9 text-sm bg-muted/50 border-border/50"
                  />
                  {gallerySearch && (
                    <button onClick={() => setGallerySearch("")} className="absolute left-2 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>*/}
              </div>
              <p className="text-xs text-muted-foreground mb-4">לכל המתכונים שתאספו או תוסיפו פריט לאסוף או לשמור!</p>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto pb-2">
                {filteredRecipes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredRecipes.map((recipe) => {
                      const badgeStyle = SOURCE_BADGE_STYLES[recipe.source];
                      const badgeInfo = SOURCE_BADGES[recipe.source];
                      return (
                        <Card
                          key={recipe.id}
                          className="rounded-2xl border border-border/60 hover:border-primary/30 hover:shadow-elevated hover:scale-[1.03] transition-all duration-300 cursor-pointer overflow-hidden group"
                          onClick={() => navigate("/v2-cookbook")}
                        >
                          {recipe.heritageImageUrl ? (
                            <div className="h-24 overflow-hidden relative">
                              <img
                                src={recipe.heritageImageUrl}
                                alt={recipe.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <Badge
                                className={`absolute top-1.5 right-1.5 ${badgeStyle} text-[9px] backdrop-blur-sm rounded-full`}
                              >
                                {badgeInfo.emoji} {badgeInfo.label}
                              </Badge>
                            </div>
                          ) : (
                            <div className="h-24 bg-gradient-to-br from-accent via-muted to-cream flex items-center justify-center relative">
                              {recipe.source === "heritage" ? (
                                <Camera className="w-7 h-7 text-muted-foreground/30" />
                              ) : (
                                <ChefHat className="w-7 h-7 text-muted-foreground/30" />
                              )}
                              <Badge
                                className={`absolute top-1.5 right-1.5 ${badgeStyle} text-[9px] backdrop-blur-sm rounded-full`}
                              >
                                {badgeInfo.emoji} {badgeInfo.label}
                              </Badge>
                            </div>
                          )}
                          <CardContent className="p-2.5 space-y-1">
                            <h4 className="font-bold text-foreground text-xs leading-tight line-clamp-1">
                              {recipe.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              {recipe.cookingTime ? (
                                <span className="text-[10px] text-muted-foreground">⏱ {recipe.cookingTime} דק׳</span>
                              ) : (
                                <span />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRecipe(recipe.id);
                                  toast.success("הוסר מהספר");
                                }}
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
                ) : recipes.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-accent flex items-center justify-center">
                      <BookOpen className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-sm text-foreground font-bold">הספר שלך עדיין ריק</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      התחילו לבשל או לשמר זיכרון כדי למלא אותו!
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">אין תוצאות לחיפוש</p>
                  </div>
                )}
              </div>

              {/* CTA: View all */}
              <Button
                size="lg"
                className="w-full mt-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-soft"
                onClick={() => navigate("/v2-cookbook")}
              >
                <BookOpen className="w-5 h-5" />
                צפה בכל הספר שלי
              </Button>
            </div>
          </section>
        </div>

        {/* ============ RIGHT COLUMN (45%) — Active Kitchen Hero ============ */}
        {/*<aside className="w-full md:w-[45%] relative overflow-hidden order-1 md:order-2 min-h-[60vh] md:min-h-0">*/}
        <aside className="w-full md:w-[45%] relative overflow-hidden order-1 min-h-[60vh] md:min-h-0">
          {/* Background image (blurred kitchen) */}
          <div className="absolute inset-0">
            <img src={heroBg} alt="Kitchen background" className="w-full h-full object-cover scale-110 blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/30 to-foreground/50" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 py-10 md:py-8 gap-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground text-center drop-shadow-lg">
              מה נבשל היום?
            </h1>

            {/* Two glass cards side-by-side */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-md">
              {/* Left card: Globe — popular recipes */}
              <button
                onClick={() => navigate("/categories")}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/20 backdrop-blur-md border border-primary-foreground/20 hover:bg-card/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-foreground/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <p className="font-bold text-primary-foreground text-sm text-center leading-tight">
                  גלו מתכונים
                  <br />
                  פופולריים
                </p>
              </button>

              {/* Right card: Sparkles — AI fridge */}
              <button
                onClick={() => navigate("/select-ingredients")}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/20 backdrop-blur-md border border-primary-foreground/20 hover:bg-card/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-foreground/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="font-bold text-primary-foreground text-sm text-center leading-tight">
                  בנו מתכון
                  <br />
                  מהמקרר
                </p>
              </button>
            </div>

            {/* Big CTA button */}
            <Button
              size="lg"
              className="w-full max-w-xs rounded-full text-base font-bold gap-2 shadow-elevated bg-primary hover:bg-primary/90 text-primary-foreground py-6"
              onClick={() => navigate("/select-ingredients")}
            >
              <ChefHat className="w-5 h-5" />
              בנו מתכון!
            </Button>
          </div>
        </aside>
      </div>

      {/* ===== HERITAGE DIALOG ===== */}
      <HeritageUploadDialog open={heritageOpen} onOpenChange={setHeritageOpen} />

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
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground">{recipe.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⏱ {recipe.cookingTime} דק׳ • {recipe.difficulty}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddLibraryRecipe(selectedCuisineData!, recipe)}
                    className="rounded-xl shrink-0"
                  >
                    הוסף לספר
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DUPLICATE DIALOG ===== */}
      <Dialog open={duplicateDialog.open} onOpenChange={(o) => setDuplicateDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-right">המתכון כבר קיים בספר שלך</DialogTitle>
            <DialogDescription className="text-right">
              "{duplicateDialog.existingTitle}" כבר נשמר בספר. לא נשמור עותק כפול.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => setDuplicateDialog({ open: false, recipe: null, existingTitle: "" })}
              className="rounded-xl"
            >
              הבנתי
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default V2Dashboard;
