import { ArrowRight, ChefHat, BookOpen, Award, Loader2, Zap, RefreshCw, UtensilsCrossed } from "lucide-react";
import profileAvatar from "@/assets/profile-avatar.avif";
import profileDecoration from "@/assets/profile-decoration.png";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import DishCard, { Dish } from "@/components/DishCard";
import { useUserGallery } from "@/hooks/useUserGallery";
import { useUserRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: galleryItems, isLoading: loadingGallery } = useUserGallery();
  const { data: recipes, isLoading: loadingRecipes } = useUserRecipes();
  const { credits, loading: loadingCredits, refetch: refetchCredits } = useUserCredits();
  const [resettingCredits, setResettingCredits] = useState(false);

  const isLoading = authLoading || loadingGallery || loadingRecipes;

  const handleResetCredits = async () => {
    setResettingCredits(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-credits");
      if (error) {
        toast.error("שגיאה באיפוס הקרדיטים");
        return;
      }
      if (data?.success) {
        toast.success(`הקרדיטים אופסו! יש לכם ${data.credits_remaining} קרדיטים`);
        refetchCredits();
      }
    } catch {
      toast.error("שגיאה בלתי צפויה");
    } finally {
      setResettingCredits(false);
    }
  };

  // Transform gallery items to dish format
  const userDishes = (galleryItems || []).map((item) => ({
    id: item.id,
    name: item.recipe?.title || item.user_notes || "מנה ללא שם",
    date: item.created_at 
      ? new Date(item.created_at).toLocaleDateString("he-IL")
      : "",
    emoji: "🍳",
    imageUrl: item.image_url,
  }));


  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-to-l from-primary/10 via-accent to-card border-b border-primary/20 shadow-soft">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="flex items-center gap-1 hover:bg-primary/10"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה
              </Button>
              <div className="flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-primary" />
                <span className="font-bold text-foreground">מה שיש</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            יש להתחבר כדי לצפות בפרופיל
          </h1>
          <p className="text-muted-foreground mb-8">
            התחברו כדי לראות את ספר המתכונים שלכם ואת היסטוריית הבישולים
          </p>
          <Button variant="default" onClick={() => navigate("/")}>
            חזרה לדף הבית
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-l from-primary/10 via-accent to-card border-b border-primary/20 shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-1 hover:bg-primary/10"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground">מה שיש</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">טוען פרופיל...</p>
          </div>
        ) : (
          <>
            {/* Profile Header + Stats combined */}
            <div className="bg-gradient-to-br from-primary/10 via-accent to-card rounded-2xl p-6 mb-6 animate-fade-in">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-primary/30">
                  <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-foreground truncate">
                    {user?.email?.split("@")[0] || "שף מתחיל"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    מבשלים ביחד מ{user?.created_at 
                      ? new Date(user.created_at).toLocaleDateString("he-IL", { month: "long", year: "numeric" })
                      : "ינואר 2025"}
                  </p>
                </div>
              </div>

              {/* Inline Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-background/60 rounded-xl text-center py-3 px-2">
                  <UtensilsCrossed className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{userDishes.length}</p>
                  <p className="text-xs text-muted-foreground">בושלו</p>
                </div>
                <div className="bg-background/60 rounded-xl text-center py-3 px-2">
                  <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{recipes?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">שמורים</p>
                </div>
                <div className="bg-background/60 rounded-xl text-center py-3 px-2">
                  <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className={`text-lg font-bold ${(credits?.credits_remaining ?? 0) <= 0 ? "text-destructive" : "text-foreground"}`}>
                    {credits?.credits_remaining ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">קרדיטים</p>
                </div>
              </div>
            </div>

            {/* Achievement Badge */}
            {userDishes.length >= 5 && (
              <div className="bg-accent rounded-2xl p-4 mb-8 flex items-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <div className="bg-primary rounded-full p-3">
                  <Award className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">הישג חדש!</h3>
                  <p className="text-sm text-muted-foreground">בישלתם {userDishes.length} מתכונים - מגיע לכם כוכב! ⭐</p>
                </div>
              </div>
            )}

            {/* Reset Credits */}
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetCredits}
                disabled={resettingCredits}
                className="w-full"
              >
                {resettingCredits ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 ml-2" />
                )}
                איפוס קרדיטים (10 קרדיטים)
              </Button>
            </div>


            <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  גלריית הבישולים שלי
                </h2>
                {userDishes.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/gallery")}
                  >
                    צפו בכל הגלריה
                  </Button>
                )}
              </div>

              {/* Dishes Grid */}
              {userDishes.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {userDishes.slice(0, 6).map((dish, index) => (
                      <div
                        key={dish.id}
                        style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                        className="animate-scale-in"
                      >
                        <DishCard dish={dish} />
                      </div>
                    ))}
                  </div>
                  {userDishes.length > 6 && (
                    <div className="text-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => navigate("/gallery")}
                      >
                        צפו בעוד {userDishes.length - 6} מנות
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">📖</span>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    הגלריה ריקה
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    בשלו את המתכון הראשון שלכם ושמרו אותו כאן!
                  </p>
                  <Button variant="default" onClick={() => navigate("/ingredients")}>
                    התחילו לבשל
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default UserProfile;
