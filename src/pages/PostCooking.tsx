import { useState, useEffect } from "react";
import { Camera, BookOpen, Home, ChefHat, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Confetti from "@/components/Confetti";
import { mockRecipe } from "@/data/mockData";

const PostCooking = () => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleUploadPhoto = () => {
    alert("תכונה זו תהיה זמינה בקרוב! 📸");
  };

  const handleSaveToCookbook = () => {
    alert("המתכון נשמר לספר המתכונים שלכם! 📖");
    navigate("/profile");
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
            {mockRecipe.title}
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
                onClick={() => alert(`נתתם ${star} כוכבים! ⭐`)}
              >
                <Star className="w-8 h-8 text-primary fill-primary/20 hover:fill-primary transition-colors" />
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
            className="card-warm hover:shadow-elevated transition-all animate-slide-up flex flex-col items-center gap-4 py-8"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="bg-sage-light rounded-full p-4">
              <BookOpen className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">שמרו לספר המתכונים</h3>
              <p className="text-sm text-muted-foreground">תמצאו אותו בפרופיל</p>
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
