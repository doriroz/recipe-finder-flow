import { useState } from "react";
import { ArrowRight, ChefHat, Loader2, BookOpen, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUserGallery, useDeleteGalleryItem } from "@/hooks/useUserGallery";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import GalleryItemCard from "@/components/GalleryItemCard";
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

const Gallery = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: galleryItems, isLoading: loadingGallery } = useUserGallery();
  const deleteGalleryItem = useDeleteGalleryItem();

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isLoading = authLoading || loadingGallery;

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      await deleteGalleryItem.mutateAsync(selectedItem);
      toast({
        title: "נמחק בהצלחה",
        description: "המנה הוסרה מהגלריה",
      });
      setShowDeleteDialog(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting gallery item:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו למחוק את המנה. נסו שוב.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };


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
            יש להתחבר כדי לצפות בגלריה
          </h1>
          <p className="text-muted-foreground mb-8">
            התחברו כדי לראות את כל המנות שהכנתם
          </p>
          <Button variant="default" onClick={() => navigate("/login")}>
            התחברות
          </Button>
        </main>
      </div>
    );
  }

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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/cookbook", { state: { from: "/gallery" } })}
                className="hover:bg-primary/10"
                title="יצירת ספר מתכונים"
              >
                <BookMarked className="w-5 h-5 text-primary" />
              </Button>
              <span className="font-bold text-foreground">מה שיש 🍳</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">טוען גלריה...</p>
          </div>
        ) : galleryItems && galleryItems.length > 0 ? (
          <>
            <div className="text-center mb-8 animate-fade-in">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                המנות שלכם
              </h1>
              <p className="text-muted-foreground">
                {galleryItems.length} מנות בגלריה
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryItems.map((item, index) => (
                <GalleryItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  onDelete={(id) => {
                    setSelectedItem(id);
                    setShowDeleteDialog(true);
                  }}
                />
              ))}
            </div>

          </>
        ) : (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📖</span>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              הגלריה ריקה
            </h3>
            <p className="text-muted-foreground mb-4">
              בשלו מתכון ושמרו אותו עם תמונה כדי להתחיל לבנות את הגלריה שלכם
            </p>
            <Button variant="default" onClick={() => navigate("/ingredients")}>
              התחילו לבשל
            </Button>
          </div>
        )}
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק מנה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את המנה מהגלריה שלכם. לא ניתן לשחזר אותה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  מוחק...
                </>
              ) : (
                "מחק"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Gallery;
