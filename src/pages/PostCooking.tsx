import { useState, useEffect } from "react";
import { Camera, BookOpen, Home, ChefHat, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import Confetti from "@/components/Confetti";
import { useRecipe } from "@/hooks/useRecipes";
import { useInsertGalleryItem } from "@/hooks/useUserGallery";
import { useAuth } from "@/hooks/useAuth";
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
  
  const { data: recipe } = useRecipe(recipeId !== 'mock' ? recipeId : null);
  const insertGalleryItem = useInsertGalleryItem();
  
  // Use fetched recipe or fallback to mock
  const displayTitle = recipe?.title || mockRecipe.title;

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleUploadPhoto = () => {
    toast({
      title: "📸 בקרוב!",
      description: "תכונת העלאת תמונות תהיה זמינה בקרוב",
    });
  };

  const handleSaveToCookbook = async () => {
    if (!user) {
      toast({
        title: "יש להתחבר",
        description: "התחברו כדי לשמור מתכונים לספר המתכונים",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await insertGalleryItem.mutateAsync({
        recipe_id: recipeId !== 'mock' ? recipeId || undefined : undefined,
        image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", // Placeholder
        user_notes: `${displayTitle} - דירוג: ${rating} כוכבים`,
      });
      
      toast({
        title: "✅ נשמר!",
        description: "המתכון נשמר לגלריה שלכם",
      });
      navigate("/profile");
    } catch (error) {
      console.error("Error saving to gallery:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את המתכון. נסו שוב.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRating = (star: number) => {
    setRating(star);
    toast({
      title: `⭐ ${star} כוכבים`,
      description: "תודה על הדירוג!",
    });
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

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
          <button
            onClick={handleUploadPhoto}
            className="card-warm hover:shadow-elevated transition-all animate-slide-up flex flex-col items-center gap-4 py-8"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="bg-accent rounded-full p-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">העלו תמונה</h3>
              <p className="text-sm text-muted-foreground">שתפו את היצירה שלכם</p>
            </div>
          </button>

          <button
            onClick={handleSaveToCookbook}
            disabled={isSaving}
            className="card-warm hover:shadow-elevated transition-all animate-slide-up flex flex-col items-center gap-4 py-8 disabled:opacity-50"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="bg-sage-light rounded-full p-4">
              {isSaving ? (
                <Loader2 className="w-8 h-8 text-secondary animate-spin" />
              ) : (
                <BookOpen className="w-8 h-8 text-secondary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                {isSaving ? "שומר..." : "שמרו לגלריה"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user ? "תמצאו אותו בפרופיל" : "התחברו כדי לשמור"}
              </p>
            </div>
          </button>
        </div>

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
