import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Camera, BookOpen, Globe, Sparkles, Upload, PenLine, ArrowLeft } from "lucide-react";
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

const V2Dashboard = () => {
  const navigate = useNavigate();
  const { addRecipe, addRecipeForce } = useV2Cookbook();
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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-accent via-background to-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ספר המתכונים הדיגיטלי</h1>
              <p className="text-sm text-muted-foreground">של המשפחה שלנו</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate("/v2-cookbook")}>
            <BookOpen className="w-4 h-4" />
            הספר שלי
          </Button>
        </div>
      </div>

      {/* Triple Entry Cards */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-2">איך תרצו להוסיף מתכון?</h2>
          <p className="text-muted-foreground">בחרו את הדרך שמתאימה לכם</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Path A: AI Fridge */}
          <Card
            className="group cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all duration-300 rounded-2xl overflow-hidden hover:shadow-elevated"
            onClick={() => navigate("/select-ingredients")}
          >
            <div className="h-3 bg-gradient-to-l from-primary to-orange-medium" />
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">בישול לפי מצרכים</h3>
                <p className="text-sm text-muted-foreground">בחרו מה יש לכם במקרר ונמצא לכם מתכון מושלם</p>
              </div>
              <Badge className="bg-accent text-accent-foreground">🤖 עוזר AI</Badge>
            </CardContent>
          </Card>

          {/* Path B: Heritage */}
          <Card
            className="group cursor-pointer border-2 border-transparent hover:border-secondary/30 transition-all duration-300 rounded-2xl overflow-hidden hover:shadow-elevated"
            onClick={() => { setHeritageOpen(true); setHeritageMode("choose"); }}
          >
            <div className="h-3 bg-gradient-to-l from-secondary to-sage" />
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-sage-light flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">שימור זיכרון משפחתי</h3>
                <p className="text-sm text-muted-foreground">צלמו מתכון כתוב ביד או הקלידו אותו ידנית</p>
              </div>
              <Badge className="bg-sage-light text-sage-dark">👵 זיכרון משפחתי</Badge>
            </CardContent>
          </Card>

          {/* Path C: Library */}
          <Card
            className="group cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all duration-300 rounded-2xl overflow-hidden hover:shadow-elevated"
            onClick={() => { setLibraryOpen(true); setSelectedCuisine(null); }}
          >
            <div className="h-3 bg-gradient-to-l from-orange-medium to-primary" />
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-light flex items-center justify-center group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 text-orange-dark" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">מתכונים פופולריים</h3>
                <p className="text-sm text-muted-foreground">גלו מתכונים מהמטבח העולמי לפי קטגוריות</p>
              </div>
              <Badge className="bg-orange-light text-orange-dark">🌍 מהמטבח העולמי</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Heritage Dialog */}
      <Dialog open={heritageOpen} onOpenChange={(o) => { setHeritageOpen(o); if (!o) resetHeritageForm(); }}>
        <DialogContent className="max-w-lg backdrop-blur-sm bg-background/95 rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">שימור זיכרון משפחתי</DialogTitle>
            <DialogDescription>שמרו את המתכונים של המשפחה לדורות הבאים</DialogDescription>
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

      {/* Library Dialog */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-2xl backdrop-blur-sm bg-background/95 rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">מתכונים פופולריים</DialogTitle>
            <DialogDescription>בחרו קטגוריה וגלו מתכונים מהמטבח העולמי</DialogDescription>
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

      {/* Duplicate check dialog */}
      <Dialog open={duplicateDialog.open} onOpenChange={(o) => setDuplicateDialog({ open: o, recipe: null, existingTitle: "" })}>
        <DialogContent className="max-w-sm backdrop-blur-sm bg-background/95 rounded-2xl">
          <DialogHeader>
            <DialogTitle>מניעת כפילויות</DialogTitle>
            <DialogDescription>
              מתכון בשם "{duplicateDialog.existingTitle}" כבר קיים בספר שלך. לשמור כגרסה חדשה?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDuplicateDialog({ open: false, recipe: null, existingTitle: "" })}
            >
              ביטול
            </Button>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default V2Dashboard;
