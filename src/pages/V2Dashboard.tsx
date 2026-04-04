import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Camera, BookOpen, Globe, Sparkles, Upload, PenLine, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CUISINE_CATEGORIES } from "@/data/categoryRecipes";
import { useV2Cookbook } from "@/hooks/useV2Cookbook";
import type { V2CookbookRecipe } from "@/types/v2cookbook";
import { SOURCE_BADGES } from "@/types/v2cookbook";
import { toast } from "sonner";
import heroBg from "@/assets/v2-hero-bg.jpg";

// Spoonacular sample images for gallery preview
const SAMPLE_GALLERY_IMAGES = [
  "https://img.spoonacular.com/recipes/716429-312x231.jpg",
  "https://img.spoonacular.com/recipes/715497-312x231.jpg",
  "https://img.spoonacular.com/recipes/644387-312x231.jpg",
  "https://img.spoonacular.com/recipes/782585-312x231.jpg",
  "https://img.spoonacular.com/recipes/716426-312x231.jpg",
  "https://img.spoonacular.com/recipes/795751-312x231.jpg",
  "https://img.spoonacular.com/recipes/766453-312x231.jpg",
  "https://img.spoonacular.com/recipes/632269-312x231.jpg",
];

const V2Dashboard = () => {
  const navigate = useNavigate();
  const { recipes, addRecipe, addRecipeForce } = useV2Cookbook();
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

  // Duplicate dialog
  const [duplicateDialog, setDuplicateDialog] = useState<{ open: boolean; recipe: V2CookbookRecipe | null; existingTitle: string }>({
    open: false, recipe: null, existingTitle: ""
  });

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

  const handleAddLibraryRecipe = (cat: typeof CUISINE_CATEGORIES[0], recipe: typeof CUISINE_CATEGORIES[0]["recipes"][0]) => {
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

  // Gallery images: mix real saved recipes with sample spoonacular images
  const galleryImages = [
    ...recipes.filter(r => r.heritageImageUrl).map(r => r.heritageImageUrl!),
    ...SAMPLE_GALLERY_IMAGES,
  ].slice(0, 8);

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

      {/* ===== MAIN CONTENT: Two-column layout ===== */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ===== LEFT COLUMN (3/5): Hero + Gallery ===== */}
          <div className="lg:col-span-3 space-y-6">

            {/* HERO SECTION: "מה נבשל היום?" */}
            <div className="relative rounded-2xl overflow-hidden shadow-elevated">
              {/* Background image */}
              <img
                src={heroBg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                width={1920}
                height={800}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-foreground/20" />

              {/* Content overlay */}
              <div className="relative z-10 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground mb-6">
                  מה נבשל היום?
                </h2>

                {/* Glassmorphism card with two options */}
                <div className="bg-card/80 backdrop-blur-md rounded-2xl p-5 shadow-elevated border border-border/50">
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
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        🤖 עוזר AI
                      </Badge>
                    </button>

                    {/* Library / Discovery */}
                    <button
                      onClick={() => { setLibraryOpen(true); setSelectedCuisine(null); }}
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

                  {/* CTA */}
                  <Button
                    variant="default"
                    className="w-full rounded-xl text-base font-bold gap-2"
                    onClick={() => navigate("/select-ingredients")}
                  >
                    בנו מתכון!
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    (תהליך: בחירת מצרכים או בחירת סגנון ← הפקת מתכון ← אהבתם? שמרו לספר שלי)
                  </p>
                </div>
              </div>
            </div>

            {/* ===== GALLERY PREVIEW SECTION ===== */}
            <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground text-lg">הגלריה שלי</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-xs gap-1"
                  onClick={() => navigate("/v2-cookbook")}
                >
                  Live Preview →
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                כל המתכונים שתאספו או תשמרו יחכו לכם בגלריה, ממנה תוכלו להפיק ספר מתכונים מודפס.
              </p>

              {/* Image grid */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {galleryImages.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden border border-border hover:shadow-soft transition-shadow cursor-pointer"
                    onClick={() => navigate("/v2-cookbook")}
                  >
                    <img
                      src={img}
                      alt={`מתכון ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              {recipes.length > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  {recipes.length} מתכונים בספר שלך
                </p>
              )}
            </div>
          </div>

          {/* ===== RIGHT COLUMN (2/5): Heritage + Gallery Info ===== */}
          <div className="lg:col-span-2 space-y-6">

            {/* HERITAGE SECTION */}
            <div className="bg-gradient-to-b from-accent via-card to-card rounded-2xl p-5 shadow-soft border border-border">
              <h3 className="text-lg font-bold text-foreground mb-1">המורשת הקולינרית שלכם</h3>
              <p className="text-xs text-muted-foreground mb-4">
                (מתכון זיכרון אינו תהליך בישול, אלא העלאה ישירה לגלריה)
              </p>

              {/* Heritage action card */}
              <Card
                className="cursor-pointer border-2 border-dashed border-secondary/30 hover:border-secondary/60 rounded-2xl transition-all hover:shadow-soft group"
                onClick={() => { setHeritageOpen(true); setHeritageMode("choose"); }}
              >
                <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-sage-light flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-7 h-7 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">שימור זיכרון משפחתי</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      העלו מתכון מסבתא!
                    </p>
                  </div>
                  <Badge className="bg-sage-light text-sage-dark border-secondary/20">
                    👵 זיכרון משפחתי
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* GALLERY INFO CARD */}
            <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">הגלריה Live Prew</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                כל המתכונים שתאספו או תשמרו יחכו לכם בגלריה, ממנה תוכלו להפיק ספר מתכונים מודפס.
              </p>

              {/* Spoonacular sample cards */}
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_GALLERY_IMAGES.slice(0, 4).map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-border">
                    <img
                      src={img}
                      alt={`דוגמה ${i + 1}`}
                      className="w-full h-20 object-cover"
                      loading="lazy"
                    />
                    <div className="p-2">
                      <p className="text-[10px] text-muted-foreground truncate">
                        {["בלני אוכמן מתובל", "פסטה עגבניות שרי", "סלט ים-תיכוני", "מרק עדשים מרוקאי"][i]}
                      </p>
                      <Badge className="text-[8px] mt-1 bg-orange-light text-orange-dark">
                        🌍 מהמטבח העולמי
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM NAV BAR ===== */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-around py-2">
          {[
            { label: "הספר שלי", icon: BookOpen, path: "/v2-cookbook", active: false },
            { label: "זיכרון", icon: Camera, action: () => { setHeritageOpen(true); setHeritageMode("choose"); }, active: false },
            { label: "התחלו מועדפים", icon: Globe, action: () => { setLibraryOpen(true); setSelectedCuisine(null); }, active: false },
            { label: "הפלזורים", icon: Sparkles, path: "/select-ingredients", active: false },
            { label: "הספה", icon: ChefHat, path: "/v2-dashboard", active: true },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => item.path ? navigate(item.path) : item.action?.()}
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
      <Dialog open={heritageOpen} onOpenChange={(o) => { setHeritageOpen(o); if (!o) resetHeritageForm(); }}>
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
              <input id="heritage-photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

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
              <img src={heritagePhoto} alt="uploaded recipe" className="w-full max-h-48 object-contain rounded-xl border border-border" />
              <div className="space-y-2">
                <Label>שם המתכון *</Label>
                <Input value={heritageTitle} onChange={(e) => setHeritageTitle(e.target.value)} placeholder="למשל: עוגת שוקולד של סבתא רחל" />
              </div>
              <div className="space-y-2">
                <Label>הסיפור מאחורי המתכון</Label>
                <Textarea value={heritageStory} onChange={(e) => setHeritageStory(e.target.value)} placeholder="ספרו את הסיפור..." rows={2} />
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
                    <Textarea value={heritageIngredients} onChange={(e) => setHeritageIngredients(e.target.value)} rows={3} placeholder="קמח&#10;סוכר&#10;ביצים" />
                  </div>
                  <div className="space-y-2">
                    <Label>שלבי הכנה (שורה לכל שלב)</Label>
                    <Textarea value={heritageSteps} onChange={(e) => setHeritageSteps(e.target.value)} rows={3} placeholder="מערבבים...&#10;אופים..." />
                  </div>
                  <Button onClick={handleSaveHeritage} className="w-full rounded-xl">שמור לספר שלי 📖</Button>
                </div>
              )}
            </div>
          )}

          {heritageMode === "manual" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>שם המתכון *</Label>
                <Input value={heritageTitle} onChange={(e) => setHeritageTitle(e.target.value)} placeholder="למשל: קוגל ירושלמי של דודה שרה" />
              </div>
              <div className="space-y-2">
                <Label>הסיפור מאחורי המתכון</Label>
                <Textarea value={heritageStory} onChange={(e) => setHeritageStory(e.target.value)} placeholder="ספרו את הסיפור..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label>מצרכים (שורה לכל מצרך)</Label>
                <Textarea value={heritageIngredients} onChange={(e) => setHeritageIngredients(e.target.value)} rows={3} placeholder="קמח&#10;סוכר&#10;ביצים" />
              </div>
              <div className="space-y-2">
                <Label>שלבי הכנה (שורה לכל שלב)</Label>
                <Textarea value={heritageSteps} onChange={(e) => setHeritageSteps(e.target.value)} rows={3} placeholder="מערבבים...&#10;אופים..." />
              </div>
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
                <div key={i} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
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
      <Dialog open={duplicateDialog.open} onOpenChange={(o) => setDuplicateDialog({ open: o, recipe: null, existingTitle: "" })}>
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
