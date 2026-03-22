import { useState, useMemo } from "react";
import { ArrowRight, Trash2, ChefHat, Sparkles, Share2, Calendar, Copy, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FridgeChallenge {
  id: string;
  user_id: string;
  ingredient_names: string[];
  ingredient_emojis: string[];
  recipe_id: string | null;
  recipe_title: string | null;
  created_at: string;
}

type SortOption = "newest" | "last-week" | "most-ingredients" | "fewest-ingredients";

const FridgeChallenges = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareChallenge, setShareChallenge] = useState<FridgeChallenge | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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

  const filteredChallenges = useMemo(() => {
    let result = [...challenges];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter((c) =>
        c.ingredient_names.some((name) => name.toLowerCase().includes(term)) ||
        (c.recipe_title && c.recipe_title.toLowerCase().includes(term))
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "last-week": {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        result = result.filter((c) => new Date(c.created_at) >= weekAgo);
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      }
      case "most-ingredients":
        result.sort((a, b) => b.ingredient_names.length - a.ingredient_names.length);
        break;
      case "fewest-ingredients":
        result.sort((a, b) => a.ingredient_names.length - b.ingredient_names.length);
        break;
    }

    return result;
  }, [challenges, searchTerm, sortBy]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("fridge_challenges").delete().eq("id", deleteId);
    if (error) {
      toast.error("שגיאה במחיקת האתגר");
    } else {
      toast.success("האתגר נמחק");
      queryClient.invalidateQueries({ queryKey: ["fridge-challenges"] });
    }
    setDeleteId(null);
  };

  const handleShare = async (challenge: FridgeChallenge) => {
    const text = getShareText(challenge);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        // fallback
      }
    }
    setShareChallenge(challenge);
    setShareDialogOpen(true);
  };

  const getShareText = (challenge: FridgeChallenge) => {
    const ingList = challenge.ingredient_names
      .map((name, i) => `${challenge.ingredient_emojis[i] || "🥗"} ${name}`)
      .join("\n");
    return `🍳 אתגר המקרר שלי:\n${ingList}\n\nמה הייתם מבשלים מזה?\n\nhttps://recipe-finder-flow.lovable.app`;
  };

  const handleCopyLink = async (challenge: FridgeChallenge) => {
    const text = getShareText(challenge);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
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
      day: "numeric",
      month: "short",
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
      {/* Header */}
      <header className="bg-gradient-to-l from-primary/10 via-accent to-card border-b border-primary/20 shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="flex items-center gap-1 hover:bg-primary/10">
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
            <span className="font-bold text-foreground">🧊 אתגרי המקרר</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 max-w-5xl">
        {/* Page Title */}
        <div className="text-center space-y-1 mb-5">
          <h1 className="text-2xl font-bold text-foreground">אתגרי המקרר שלי 🧊</h1>
          <p className="text-sm text-muted-foreground">
            השילובים שניסיתם בעבר. חזרו אליהם, או שתפו עם חברים!
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl">🧊</div>
            <h2 className="text-xl font-semibold text-foreground">אין אתגרים עדיין</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              אתגרי המצרכים שלכם יופיעו כאן אחרי שתיצרו מתכונים עם AI.
            </p>
            <Button variant="hero" onClick={() => navigate("/ingredients")} className="mt-4">
              <Sparkles className="w-5 h-5" />
              בואו ניצור מתכון
            </Button>
          </div>
        ) : (
          <>
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 mb-5">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="חיפוש לפי מצרך או מתכון..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9 h-9 text-sm"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">הכי חדש</SelectItem>
                  <SelectItem value="last-week">השבוע האחרון</SelectItem>
                  <SelectItem value="most-ingredients">הכי הרבה מצרכים</SelectItem>
                  <SelectItem value="fewest-ingredients">הכי מעט מצרכים</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            {searchTerm.trim() || sortBy === "last-week" ? (
              <p className="text-xs text-muted-foreground mb-3">
                {filteredChallenges.length} אתגרים נמצאו
              </p>
            ) : null}

            {filteredChallenges.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-muted-foreground">אין תוצאות לחיפוש</p>
                <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(""); setSortBy("newest"); }}>
                  נקה סינון
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
                {filteredChallenges.map((challenge) => (
                  <Card key={challenge.id} className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-200 hover:shadow-elevated h-full">
                    <CardContent className="p-3 flex flex-col h-full">
                      {/* Top row: badge + date + delete */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            🧊 אתגר
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(challenge.created_at)}
                          </span>
                        </div>
                        <button
                          onClick={() => setDeleteId(challenge.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Ingredients - fixed height area */}
                      {/* Ingredients - fixed height area */}
                      <div className="flex flex-wrap gap-1.5 h-[56px] overflow-hidden content-start mb-2">
                        {challenge.ingredient_names.map((name, i) => (
                          <span key={i} className="bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 h-[26px]">
                            <span className="text-sm leading-none">{challenge.ingredient_emojis[i] || "🥗"}</span>
                            {name}
                          </span>
                        ))}
                      </div>

                      {/* Recipe title - fixed height */}
                      <div className="h-8 flex items-center mb-2">
                        {challenge.recipe_title ? (
                          <p className="text-xs font-medium text-foreground truncate w-full bg-secondary/10 rounded px-2 py-1 text-right">
                            🍽️ {challenge.recipe_title}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic text-right w-full">ללא מתכון מקושר</p>
                        )}
                      </div>

                      {/* Spacer to push buttons to bottom */}
                      <div className="flex-1" />

                      {/* Actions - pinned to bottom */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {challenge.recipe_id && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs flex-1"
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
                          className="h-7 text-xs flex-1 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          שיתוף
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
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
                <div className="flex items-center gap-1">
                  <ChefHat className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">מה שיש</p>
                </div>
              </div>
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק אתגר?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את האתגר לצמיתות. לא ניתן לשחזר אותו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FridgeChallenges;
