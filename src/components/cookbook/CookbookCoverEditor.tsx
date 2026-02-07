import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CookbookSettings, CookbookTheme, CookbookRecipe } from "@/types/cookbook";
import { cookbookThemes } from "@/types/cookbook";

interface CookbookCoverEditorProps {
  settings: CookbookSettings;
  recipes: CookbookRecipe[];
  onUpdateSettings: (updates: Partial<CookbookSettings>) => void;
  onUpdateTheme: (theme: CookbookTheme) => void;
}

const CookbookCoverEditor = ({
  settings,
  recipes,
  onUpdateSettings,
  onUpdateTheme,
}: CookbookCoverEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingCollage, setIsGeneratingCollage] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ coverImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSmartCover = () => {
    setIsGeneratingCollage(true);
    // Take top 4 recipe images for collage
    const topImages = recipes.slice(0, 4).map((r) => r.galleryItem.image_url);
    // For now, just use the first image as cover
    // In production, this would create an actual collage
    setTimeout(() => {
      if (topImages.length > 0) {
        onUpdateSettings({ coverImage: topImages[0] });
      }
      setIsGeneratingCollage(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="book-title">שם הספר</Label>
          <Input
            id="book-title"
            value={settings.title}
            onChange={(e) => onUpdateSettings({ title: e.target.value })}
            placeholder="ספר המתכונים שלי"
            className="text-lg font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="book-subtitle">כותרת משנה (אופציונלי)</Label>
          <Input
            id="book-subtitle"
            value={settings.subtitle || ""}
            onChange={(e) => onUpdateSettings({ subtitle: e.target.value })}
            placeholder="מתכונים מהלב"
          />
        </div>
      </div>

      {/* Cover Image */}
      <div className="space-y-3">
        <Label>תמונת שער</Label>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="w-4 h-4 ml-2" />
            העלאת תמונה
          </Button>
          <Button
            variant="outline"
            onClick={generateSmartCover}
            disabled={isGeneratingCollage || recipes.length === 0}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 ml-2" />
            {isGeneratingCollage ? "יוצר..." : "קולאז׳ חכם"}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        {settings.coverImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[3/4] max-w-[200px] rounded-lg overflow-hidden border-2 border-border"
          >
            <img
              src={settings.coverImage}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2"
              onClick={() => onUpdateSettings({ coverImage: undefined })}
            >
              הסר
            </Button>
          </motion.div>
        )}
      </div>

      {/* Color Theme */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          ערכת צבעים
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {cookbookThemes.map((theme) => (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdateTheme(theme)}
              className={`p-3 rounded-xl border-2 transition-all ${
                settings.colorTheme.id === theme.id
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex gap-1.5 mb-2">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: theme.secondary }}
                />
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: theme.accent }}
                />
              </div>
              <p className="text-sm font-medium text-foreground">{theme.name}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <Label>אפשרויות נוספות</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.includeTableOfContents}
              onChange={(e) =>
                onUpdateSettings({ includeTableOfContents: e.target.checked })
              }
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">כלול תוכן עניינים</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.includePersonalNotes}
              onChange={(e) =>
                onUpdateSettings({ includePersonalNotes: e.target.checked })
              }
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">הוסף הערות אישיות</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CookbookCoverEditor;
