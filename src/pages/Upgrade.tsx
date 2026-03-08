import { ArrowRight, Sparkles, BookOpen, Zap, Crown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

const Upgrade = () => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleResetTries = async () => {
    if (!user) return;
    setResetting(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { error } = await supabase
        .from("ai_usage_logs" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("action_type", "recipe_generation")
        .gte("created_at", today.toISOString());
      if (error) throw error;
      toast.success("הניסיונות אופסו בהצלחה!");
    } catch {
      toast.error("שגיאה באיפוס");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border/50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 hover:bg-primary/10"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">שדרוג</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24 max-w-2xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="text-5xl">✨</div>
          <h1 className="text-2xl font-bold text-foreground">
            ניצלתם את הניסיונות היומיים
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            קיבלתם 3 ניסיונות חינמיים ליום ליצירת מתכונים עם AI.
            <br />
            רוצים להמשיך לבשל? שדרגו עכשיו!
          </p>
        </div>

        {/* AI Credits Plans */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            קרדיטים ליצירת מתכונים
          </h2>

          <div className="grid gap-4">
            {/* Basic plan */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-3 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">10 מתכונים</h3>
                  <p className="text-sm text-muted-foreground">מושלם לשבוע של בישול</p>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold text-foreground">₪9.90</span>
                </div>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {/* TODO: payment integration */}}
              >
                <Sparkles className="w-4 h-4" />
                רכישה
              </Button>
            </div>

            {/* Popular plan */}
            <div className="bg-card rounded-2xl border-2 border-primary/50 p-6 space-y-3 shadow-elevated relative overflow-hidden">
              <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-br-xl">
                פופולרי
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="font-bold text-foreground">ללא הגבלה — חודשי</h3>
                  <p className="text-sm text-muted-foreground">מתכונים ללא הגבלה כל החודש</p>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold text-primary">₪19.90</span>
                  <span className="text-xs text-muted-foreground block">/לחודש</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {/* TODO: payment integration */}}
              >
                <Crown className="w-4 h-4" />
                שדרוג
              </Button>
            </div>
          </div>
        </div>

        {/* Cookbook Purchase */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            ספר מתכונים מודפס
          </h2>

          <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-3 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">ספר מתכונים אישי</h3>
                <p className="text-sm text-muted-foreground">
                  אספו את המתכונים האהובים לספר מודפס ומעוצב
                </p>
              </div>
              <div className="text-left">
                <span className="text-2xl font-bold text-foreground">₪49.90</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/cookbook")}
            >
              <BookOpen className="w-4 h-4" />
              בניית ספר מתכונים
            </Button>
          </div>
        </div>

        {/* Admin: Reset tries (testing only) */}
        {isAdmin && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 text-center space-y-2">
            <p className="text-xs text-destructive font-medium">🔧 Admin Only — Testing</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetTries}
              disabled={resetting}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "מאפס..." : "איפוס ניסיונות יומיים"}
            </Button>
          </div>
        )}

        {/* Back to cooking */}
        <div className="text-center pt-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            חזרה לדף הבית
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Upgrade;
