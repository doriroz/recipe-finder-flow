import { useState, useEffect, useRef } from "react";
import { Camera, BookOpen, Home, ChefHat, Star, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useSearchParams } from "react-router-dom";
import Confetti from "@/components/Confetti";
import { useRecipe } from "@/hooks/useRecipes";
import { useInsertGalleryItem } from "@/hooks/useUserGallery";
import { useAuth } from "@/hooks/useAuth";
import { useGalleryImageUpload } from "@/hooks/useGalleryImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { mockRecipe } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const PostCooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipeId = searchParams.get("id");
  const { user } = useAuth();
  
  const [showConfetti, setShowConfetti] = useState(true);
  const [rating, setRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [dishPhoto, setDishPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: recipe } = useRecipe(recipeId !== 'mock' ? recipeId : null);
  const insertGalleryItem = useInsertGalleryItem();
  const { uploadImage, isUploading } = useGalleryImageUpload();

  const displayTitle = recipe?.title || mockRecipe.title;

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "שגיאה",
        description: "יש לבחור קובץ תמונה",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "שגיאה",
        description: "גודל התמונה חייב להיות עד 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDishPhoto(reader.result as string);
      setShowSaveForm(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleSaveToCookbook = async () => {
    if (!user) {
      toast({
        title: "יש להתחבר",
        description: "התחברו כדי לשמור מתכונים לגלריה",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!dishPhoto) {
      toast({
        title: "חסרה תמונה",
        description: "יש להעלות תמונה של המנה",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Upload image to Supabase Storage
      const imageUrl = await uploadImage(dishPhoto, user.id);
      
      const notesText = notes.trim() || `${displayTitle} - דירוג: ${rating} כוכבים`;

      await insertGalleryItem.mutateAsync({
        recipe_id: recipeId !== 'mock' ? recipeId || undefined : undefined,
        image_url: imageUrl,
        user_notes: notesText,
      });

      toast({
        title: "נשמר בהצלחה!",
        description: "המנה נוספה לגלריה שלכם",
      });
      navigate("/gallery");
    } catch (error) {
      console.error("Error saving to gallery:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את המנה. נסו שוב.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRating = async (star: number) => {
    setRating(star);
    toast({
      title: `⭐ ${star} כוכבים`,
      description: "תודה על הדירוג!",
    });

    // Save rating to database
    if (user && recipeId && recipeId !== 'mock') {
      try {
        const { error } = await supabase
          .from("recipe_ratings" as any)
          .upsert(
            { recipe_id: recipeId, user_id: user.id, rating: star },
            { onConflict: "recipe_id,user_id" }
          );
        if (error) console.error("Rating save error:", error);
      } catch (err) {
        console.error("Rating save error:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {showConfetti && <Confetti />}
      
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground">מה שיש</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 text-center">
        {/* Celebration */}
        <div className="animate-scale-in">
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            כל הכבוד!
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            סיימתם להכין
          </p>
          <h2 className="text-2xl font-semibold text-primary mb-8">
            {displayTitle}
          </h2>
        </div>

        {/* Rating Stars */}
        <div className="animate-slide-up mb-12" style={{ animationDelay: "0.3s" }}>
          <p className="text-muted-foreground mb-3">איך היה?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="text-4xl hover:scale-125 transition-transform cursor-pointer"
                onClick={() => handleRating(star)}
              >
                <Star 
                  className={`w-8 h-8 transition-colors ${
                    star <= rating 
                      ? "text-primary fill-primary" 
                      : "text-primary fill-primary/20 hover:fill-primary"
                  }`} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Photo Upload Card or Save Form */}
        {!showSaveForm ? (
          <div className="max-w-md mx-auto mb-8">
            <button
              onClick={handleUploadPhoto}
              className="card-warm hover:shadow-elevated transition-all animate-slide-up flex flex-col items-center gap-4 py-8 w-full"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="bg-accent rounded-full p-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">צלמו את המנה</h3>
                <p className="text-sm text-muted-foreground">שתפו את היצירה שלכם בגלריה</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto mb-8 animate-fade-in">
            <div className="card-warm">
              {/* Photo Preview */}
              {dishPhoto && (
                <div className="relative mb-6">
                  <img
                    src={dishPhoto}
                    alt="המנה שלכם"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      setDishPhoto(null);
                      setShowSaveForm(false);
                    }}
                    className="absolute top-2 left-2 h-8 w-8 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Attached Recipe Info */}
              {recipe && (
                <div className="mb-6 p-4 bg-accent/30 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <ChefHat className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">מתכון מצורף:</span>
                  </div>
                  <p className="text-foreground font-semibold">{recipe.title}</p>
                  {recipe.cooking_time && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ⏱️ {recipe.cooking_time} דקות
                    </p>
                  )}
                </div>
              )}

              {/* Notes Input */}
              <div className="mb-6">
                <label className="block text-foreground font-medium mb-2 text-right">
                  הוסיפו הערות
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="איך היה? מה שינית? טיפים לפעם הבאה..."
                  className="min-h-32"
                  dir="rtl"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveToCookbook}
                disabled={isSaving || isUploading}
                variant="hero"
                size="lg"
                className="w-full"
              >
                {isSaving || isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isUploading ? "מעלה תמונה..." : "שומר..."}
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5" />
                    שמרו לגלריה
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Home Button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate("/")}
          className="animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <Home className="w-5 h-5" />
          חזרה לדף הבית
        </Button>

        {/* Encouraging Message */}
        <div className="mt-12 animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <div className="inline-flex items-center gap-2 bg-sage-light text-sage-dark px-6 py-3 rounded-full">
            <span>💪</span>
            <span className="font-medium">עשיתם את זה! בישול זה כיף</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostCooking;
