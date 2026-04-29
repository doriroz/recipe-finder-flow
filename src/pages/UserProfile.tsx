import {
  ArrowRight,
  ChefHat,
  BookOpen,
  Loader2,
  Zap,
  RefreshCw,
  UtensilsCrossed,
  Sparkles,
  Calendar,
  Mail,
  LogOut,
  Crown,
  Utensils,
  Flame,
  Trophy,
  Award,
} from "lucide-react";
import profileAvatar from "@/assets/profile-avatar.avif";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUserGallery } from "@/hooks/useUserGallery";
import { useUserRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

type Rank = {
  key: "amateur" | "home" | "master";
  label: string;
  next?: { label: string; threshold: number };
  badgeClass: string; // styling for the rank pill
  progressClass: string; // styling for the progress indicator
};

const getRank = (count: number): Rank => {
  if (count >= 15) {
    return {
      key: "master",
      label: "מאסטר שף",
      badgeClass:
        "bg-gradient-to-l from-secondary to-[hsl(130_30%_45%)] text-secondary-foreground shadow-md ring-1 ring-secondary/40",
      progressClass: "bg-gradient-to-l from-secondary to-[hsl(130_30%_45%)]",
    };
  }
  if (count >= 5) {
    return {
      key: "home",
      label: "בשלן ביתי",
      next: { label: "מאסטר שף", threshold: 15 },
      badgeClass:
        "bg-gradient-to-l from-primary to-[hsl(35_95%_60%)] text-primary-foreground shadow-sm",
      progressClass: "bg-gradient-to-l from-primary to-[hsl(35_95%_60%)]",
    };
  }
  return {
    key: "amateur",
    label: "טבח חובב",
    next: { label: "בשלן ביתי", threshold: 5 },
    badgeClass: "bg-muted text-foreground/80 border border-border",
    progressClass: "bg-foreground/40",
  };
};

const ACHIEVEMENTS: Array<{
  threshold: number;
  label: string;
  icon: typeof Utensils;
}> = [
  { threshold: 1, label: "הביס הראשון", icon: Utensils },
  { threshold: 5, label: "חמישייה פותחת", icon: Flame },
  { threshold: 10, label: "עשרת הגדולים", icon: Trophy },
  { threshold: 20, label: "שף מקצועי", icon: Award },
];

const StatCard = ({
  icon: Icon,
  value,
  label,
  highlight = false,
}: {
  icon: typeof Zap;
  value: number | string;
  label: string;
  highlight?: boolean;
}) => (
  <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <p className={`text-2xl font-bold ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
  </div>
);

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: galleryItems, isLoading: loadingGallery } = useUserGallery();
  const { data: recipes, isLoading: loadingRecipes } = useUserRecipes();
  const { credits, loading: loadingCredits, refetch: refetchCredits } = useUserCredits();
  const { isAdmin } = useIsAdmin();
  const [resettingCredits, setResettingCredits] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isLoading = authLoading || loadingGallery || loadingRecipes || loadingCredits;

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

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      localStorage.removeItem("sb-njjggyhqddbuzbzibbja-auth-token");
      toast.success("התנתקת בהצלחה");
      window.location.assign("/");
    } catch {
      toast.error("שגיאה בהתנתקות");
    } finally {
      setSigningOut(false);
    }
  };

  const cookedCount = galleryItems?.length || 0;
  const savedCount = recipes?.length || 0;
  const rank = getRank(cookedCount);
  const progressValue = rank.next
    ? Math.min(100, Math.round((cookedCount / rank.next.threshold) * 100))
    : 100;
  const remainingToNext = rank.next ? Math.max(0, rank.next.threshold - cookedCount) : 0;
  const lastCooked = galleryItems?.[0]?.created_at
    ? new Date(galleryItems[0].created_at).toLocaleDateString("he-IL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "עוד לא בושל מתכון";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("he-IL", { month: "long", year: "numeric" })
    : "—";

  if (!user && !authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        dir="rtl"
        style={{ background: "linear-gradient(135deg, hsl(var(--cream)) 0%, hsl(36 40% 92%) 100%)" }}
      >
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-2xl font-bold text-foreground mb-3">יש להתחבר כדי לצפות בפרופיל</h1>
          <p className="text-muted-foreground mb-8">התחברו כדי לראות את ההיסטוריה והקרדיטים שלכם</p>
          <Button onClick={() => navigate("/login")}>התחברות</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20"
      dir="rtl"
      style={{ background: "linear-gradient(135deg, hsl(var(--cream)) 0%, hsl(36 40% 92%) 100%)" }}
    >
      {/* Header — same pattern as AddRecipe */}
      <header
        className="relative z-20"
        style={{ background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(28 95% 65%) 100%)" }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => navigate(-1)}
              aria-label="חזרה"
            >
              חזרה
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-primary-foreground">הפרופיל שלי</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">טוען פרופיל...</p>
          </div>
        ) : (
          <>
            {/* Identity card */}
            <section className="bg-card border border-border/60 rounded-3xl p-6 mb-6 shadow-sm animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 shadow-md">
                    <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  {isAdmin && (
                    <div className="absolute -bottom-1 -left-1 bg-primary rounded-full p-1.5 shadow-md" title="מנהל">
                      <Crown className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-foreground truncate">
                    {user?.email?.split("@")[0] || "שף מתחיל"}
                  </h2>
                  {/* Rank badge */}
                  <div className="mt-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${rank.badgeClass}`}
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      {rank.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>חבר/ה מ{memberSince}</span>
                  </div>
                </div>
              </div>

              {/* Progress to next rank */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">
                    {rank.next
                      ? `עוד ${remainingToNext} ${remainingToNext === 1 ? "מתכון" : "מתכונים"} לדרגת ${rank.next.label}`
                      : "הגעת לדרגה המקסימלית! 👑"}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {rank.next ? `${cookedCount}/${rank.next.threshold}` : `${cookedCount}+`}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${rank.progressClass}`}
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Stats grid */}
            <section
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <StatCard icon={UtensilsCrossed} value={cookedCount} label="מתכונים שבושלו" />
              <StatCard icon={BookOpen} value={savedCount} label="מתכונים שמורים" />
              <StatCard
                icon={Zap}
                value={credits?.credits_remaining ?? 0}
                label="קרדיטים פנויים"
                highlight={(credits?.credits_remaining ?? 0) <= 0}
              />
              <StatCard icon={Sparkles} value={credits?.total_ai_calls ?? 0} label="יצירות AI" />
            </section>

            {/* Achievements grid */}
            <section
              className="bg-card border border-border/60 rounded-2xl p-5 mb-6 shadow-sm animate-slide-up"
              style={{ animationDelay: "0.15s" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">הישגים</h3>
                <span className="text-xs text-muted-foreground">
                  {ACHIEVEMENTS.filter((a) => cookedCount >= a.threshold).length}/{ACHIEVEMENTS.length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = cookedCount >= a.threshold;
                  const Icon = a.icon;
                  return (
                    <div
                      key={a.label}
                      className="flex flex-col items-center text-center"
                      title={unlocked ? a.label : `נעול · ${a.threshold} מתכונים`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300 ${
                          unlocked
                            ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md hover:scale-105"
                            : "bg-muted text-muted-foreground/60 opacity-60 grayscale"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <p
                        className={`text-[11px] leading-tight font-medium ${
                          unlocked ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {a.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {a.threshold}+ מתכונים
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Activity card */}
            <section
              className="bg-card border border-border/60 rounded-2xl p-5 mb-6 shadow-sm animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">פעילות אחרונה</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                  <ChefHat className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">בישול אחרון</p>
                  <p className="font-semibold text-foreground">{lastCooked}</p>
                </div>
              </div>
            </section>

            {/* Credits action */}
            <section
              className="bg-card border border-border/60 rounded-2xl p-5 mb-6 shadow-sm animate-slide-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">קרדיטים</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">כל יצירה של מתכון AI מנכה קרדיט אחד.</p>
                </div>
                <Zap className="w-5 h-5 text-primary shrink-0 mt-1" />
              </div>

              {isAdmin ? (
                <Button variant="outline" onClick={handleResetCredits} disabled={resettingCredits} className="w-full">
                  {resettingCredits ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 ml-2" />
                  )}
                  איפוס קרדיטים (מנהל בלבד)
                </Button>
              ) : (
                <Button variant="default" onClick={() => navigate("/upgrade")} className="w-full">
                  <Sparkles className="w-4 h-4 ml-2" />
                  קבלו עוד קרדיטים
                </Button>
              )}
            </section>

            {/* Sign out */}
            {/*<Button
              variant="ghost"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <LogOut className="w-4 h-4 ml-2" />
              )}
              התנתקות
            </Button>*/}
          </>
        )}
      </main>
    </div>
  );
};

export default UserProfile;
