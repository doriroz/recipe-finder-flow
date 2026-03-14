import { useState } from "react";
import { ArrowRight, Trash2, ChefHat, Sparkles, Share2, Calendar, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGenerateRecipe } from "@/hooks/useGenerateRecipe";
import GeneratingRecipeLoader from "@/components/GeneratingRecipeLoader";
import CreditCounter from "@/components/CreditCounter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FridgeChallenge {
  id: string;
  user_id: string;
  ingredient_names: string[];
  ingredient_emojis: string[];
  recipe_id: string | null;
  recipe_title: string | null;
  created_at: string;
}

const FridgeChallenges = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { generateRecipe, isGenerating } = useGenerateRecipe();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareChallenge, setShareChallenge] = useState<FridgeChallenge | null>(null);

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["fridge-challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("fridge_challenges")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as FridgeChallenge[];
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("fridge_challenges").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה במחיקת האתגר");
    } else {
      toast.success("האתגר נמחק");
      queryClient.invalidateQueries({ queryKey: ["fridge-challenges"] });
    }
  };

  const handleRetry = async (challenge: FridgeChallenge) => {
    const ingredients = challenge.ingredient_names.map((name, i) => ({
      id: Date.now() + i,
      name,
      emoji: challenge.ingredient_emojis[i] || "🥗",
      category: "אחר",
    }));
    await generateRecipe({ ingredients });
  };

  const handleShare = (challenge: FridgeChallenge) => {
    setShareChallenge(challenge);
    setShareDialogOpen(true);
  };

  const getShareText = (challenge: FridgeChallenge) => {
    const ingList = challenge.ingredient_names
      .map((name, i) => `${challenge.ingredient_emojis[i] || "🥗"} ${name}`)
      .join("\n");
    return `🍳 אתגר המקרר שלי:\n${ingList}\n\nמה הייתם מבשלים מזה?\n\nhttps://recipe-finder-flow.lovable.app`;
  };

  const handleCopyLink = (challenge: FridgeChallenge) => {
    navigator.clipboard.writeText(getShareText(challenge));
    toast.success("הטקסט הועתק!");
    setShareDialogOpen(false);
  };

  const handleShareWhatsApp = (challenge: FridgeChallenge) => {
    const text = encodeURIComponent(getShareText(challenge));
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShareDialogOpen(false);
  };

  const handleShareFacebook = (challenge: FridgeChallenge) => {
    const url = encodeURIComponent("https://recipe-finder-flow.lovable.app");
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    setShareDialogOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">יש להתחבר כדי לצפות באתגרים</p>
          <Button onClick={() => navigate("/login")}>התחברות</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isGenerating && <GeneratingRecipeLoader />}

      {/* Header */}
      <header className="bg-gradient-to-l from-primary/10 via-accent to-card border-b border-primary/20 shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="flex items-center gap-1 hover:bg-primary/10">
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <CreditCounter />
              <span className="font-bold text-foreground">🧊 אתגרי המקרר</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Page Title */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-foreground">אתגרי המקרר שלי 🧊</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            השילובים שניסיתם בעבר נשמרים כאן. חזרו אליהם, נסו מתכון חדש, או שתפו את האתגר עם חברים!
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : challenges.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl">🧊</div>
            <h2 className="text-xl font-semibold text-foreground">אין אתגרים עדיין</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              אתגרי המצרכים שלכם יופיעו כאן אחרי שתיצרו מתכונים עם AI. זה עוזר לחזור לשילובים שכבר ניסיתם!
            </p>
            <Button variant="hero" onClick={() => navigate("/ingredients")} className="mt-4">
              <Sparkles className="w-5 h-5" />
              בואו ניצור מתכון
            </Button>
          </div>
        ) : (
          /* Challenge Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      🧊 אתגר מקרר
                    </span>
                    <button
                      onClick={() => handleDelete(challenge.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Ingredients */}
                  <div className="flex flex-wrap gap-2">
                    {challenge.ingredient_names.map((name, i) => (
                      <span key={i} className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                        <span>{challenge.ingredient_emojis[i] || "🥗"}</span>
                        {name}
                      </span>
                    ))}
                  </div>

                  {/* Recipe Result */}
                  {challenge.recipe_title && (
                    <div className="bg-secondary/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">מתכון שנוצר:</p>
                      <p className="font-semibold text-foreground text-sm">{challenge.recipe_title}</p>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>נוצר ב-{formatDate(challenge.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleRetry(challenge)}
                      disabled={isGenerating}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      מתכון חדש
                    </Button>
                    {challenge.recipe_id && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => navigate(`/recipe?id=${challenge.recipe_id}`)}
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        לבשל
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(challenge)}
                      className="text-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">שיתוף אתגר 🧊</DialogTitle>
          </DialogHeader>
          {shareChallenge && (
            <div className="space-y-4">
              {/* Preview card */}
              <div className="bg-accent rounded-xl p-4 text-center space-y-3">
                <p className="font-bold text-foreground">🍳 אתגר המקרר שלי</p>
                <p className="text-sm text-muted-foreground">מה הייתם מבשלים מזה?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {shareChallenge.ingredient_names.map((name, i) => (
                    <span key={i} className="bg-card px-2 py-1 rounded-full text-xs font-medium">
                      {shareChallenge.ingredient_emojis[i] || "🥗"} {name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">מה שיש 🍳</p>
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" onClick={() => handleShareWhatsApp(shareChallenge)} className="justify-start gap-3">
                  <span className="text-lg">💬</span>
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={() => handleShareFacebook(shareChallenge)} className="justify-start gap-3">
                  <span className="text-lg">📘</span>
                  Facebook
                </Button>
                <Button variant="outline" onClick={() => handleCopyLink(shareChallenge)} className="justify-start gap-3">
                  <Copy className="w-4 h-4" />
                  העתקת טקסט
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FridgeChallenges;
