import { useState } from "react";
import { Upload, PenLine } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useV2Cookbook } from "@/hooks/useV2Cookbook";
import { SOURCE_BADGES } from "@/types/v2cookbook";
import type { V2CookbookRecipe } from "@/types/v2cookbook";
import { toast } from "sonner";

interface HeritageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HeritageUploadDialog = ({ open, onOpenChange }: HeritageUploadDialogProps) => {
  const { addRecipe } = useV2Cookbook();
  const [mode, setMode] = useState<"choose" | "photo" | "manual">("choose");
  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  const reset = () => {
    setMode("choose");
    setPhoto(null);
    setTitle("");
    setStory("");
    setIngredients("");
    setSteps("");
    setOcrResult(null);
  };

  const handleClose = (o: boolean) => {
    onOpenChange(o);
    if (!o) reset();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target?.result as string);
      setMode("photo");
    };
    reader.readAsDataURL(file);
  };

  const trySaveRecipe = (recipe: V2CookbookRecipe) => {
    const result = addRecipe(recipe);
    if (result.isDuplicate) {
      toast.info(`"${result.existingTitle}" כבר קיים בספר שלך`);
    } else {
      toast.success("המתכון נשמר לספר שלי! 📖");
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("נא להזין שם למתכון");
      return;
    }
    trySaveRecipe({
      id: crypto.randomUUID(),
      title,
      story: story || undefined,
      ingredients: ingredients.split("\n").filter(Boolean),
      instructions: steps.split("\n").filter(Boolean),
      source: "heritage",
      sourceLabel: SOURCE_BADGES.heritage.label,
      heritageImageUrl: photo || undefined,
      ocrText: ocrResult || undefined,
      createdAt: new Date(),
    });
    reset();
    onOpenChange(false);
  };

  const handleSavePhotoOnly = () => {
    if (!title.trim()) {
      toast.error("נא להזין שם למתכון");
      return;
    }
    trySaveRecipe({
      id: crypto.randomUUID(),
      title,
      story: story || undefined,
      ingredients: [],
      instructions: [],
      source: "heritage",
      sourceLabel: SOURCE_BADGES.heritage.label,
      heritageImageUrl: photo || undefined,
      createdAt: new Date(),
    });
    reset();
    onOpenChange(false);
  };

  const simulateOCR = () => {
    setOcrLoading(true);
    setTimeout(() => {
      setOcrResult("טקסט שחולץ מהתמונה יופיע כאן...\nניתן לערוך את התוכן לפני השמירה.");
      setOcrLoading(false);
      toast.success("הטקסט חולץ בהצלחה!");
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg backdrop-blur-md bg-card/95 rounded-2xl max-h-[85vh] overflow-y-auto border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl text-right">שימור זיכרון משפחתי</DialogTitle>
          <DialogDescription className="text-right">שמרו את המתכונים של המשפחה לדורות הבאים</DialogDescription>
        </DialogHeader>

        {mode === "choose" && (
          <div className="space-y-4 pt-2">
            <button
              onClick={() => document.getElementById("heritage-dialog-photo-input")?.click()}
              className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-secondary transition-colors flex flex-col items-center gap-3 group"
            >
              <Upload className="w-10 h-10 text-muted-foreground group-hover:text-secondary transition-colors" />
              <span className="font-medium text-foreground">העלו תמונה של מתכון כתוב</span>
              <span className="text-xs text-muted-foreground">צילום מתכון בכתב יד, כרטיסייה ישנה</span>
            </button>
            <input
              id="heritage-dialog-photo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <button
              onClick={() => setMode("manual")}
              className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center gap-3 group"
            >
              <PenLine className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium text-foreground">הקלדה ידנית</span>
              <span className="text-xs text-muted-foreground">הזינו שם, סיפור, מצרכים ושלבים</span>
            </button>
          </div>
        )}

        {mode === "photo" && photo && (
          <div className="space-y-4 pt-2">
            <img src={photo} alt="uploaded recipe" className="w-full max-h-48 object-contain rounded-xl border border-border" />
            <div className="space-y-2">
              <Label>שם המתכון *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: עוגת שוקולד של סבתא רחל" />
            </div>
            <div className="space-y-2">
              <Label>הסיפור מאחורי המתכון</Label>
              <Textarea value={story} onChange={(e) => setStory(e.target.value)} placeholder="ספרו את הסיפור..." rows={2} />
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
                  <Textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={3} placeholder="קמח&#10;סוכר&#10;ביצים" />
                </div>
                <div className="space-y-2">
                  <Label>שלבי הכנה (שורה לכל שלב)</Label>
                  <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={3} placeholder="מערבבים...&#10;אופים..." />
                </div>
                <Button onClick={handleSave} className="w-full rounded-xl">שמור לספר שלי 📖</Button>
              </div>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>שם המתכון *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: קוגל ירושלמי של דודה שרה" />
            </div>
            <div className="space-y-2">
              <Label>הסיפור מאחורי המתכון</Label>
              <Textarea value={story} onChange={(e) => setStory(e.target.value)} placeholder="ספרו את הסיפור..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>מצרכים (שורה לכל מצרך)</Label>
              <Textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={3} placeholder="קמח&#10;סוכר&#10;ביצים" />
            </div>
            <div className="space-y-2">
              <Label>שלבי הכנה (שורה לכל שלב)</Label>
              <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={3} placeholder="מערבבים...&#10;אופים..." />
            </div>
            <Button onClick={handleSave} className="w-full rounded-xl">שמור לספר שלי 📖</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HeritageUploadDialog;
