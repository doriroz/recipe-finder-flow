import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChefHat, Search, BookOpen, Loader2, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useUserGallery } from "@/hooks/useUserGallery";
import { useAuth } from "@/hooks/useAuth";
import { useCookbook } from "@/hooks/useCookbook";
import CookbookRecipeCard from "@/components/cookbook/CookbookRecipeCard";
import CookbookSidebar from "@/components/cookbook/CookbookSidebar";
import CookbookCoverEditor from "@/components/cookbook/CookbookCoverEditor";
import CookbookPreview from "@/components/cookbook/CookbookPreview";
import CookbookCheckout from "@/components/cookbook/CookbookCheckout";
import CookbookStepIndicator from "@/components/cookbook/CookbookStepIndicator";
import type { CookbookRecipe } from "@/types/cookbook";

const CookbookBuilder = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: galleryItems, isLoading: loadingGallery } = useUserGallery();
  const cookbook = useCookbook();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);

  const isLoading = authLoading || loadingGallery;

  const filteredItems = galleryItems?.filter((item) => {
    const title = item.recipe?.title?.toLowerCase() || "";
    const notes = item.user_notes?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return title.includes(query) || notes.includes(query);
  }) || [];

  // Initialize recipes when entering customize step
  useEffect(() => {
    if (cookbook.step === "customize" && galleryItems) {
      cookbook.initializeRecipes(galleryItems);
    }
  }, [cookbook.step, galleryItems]);

  const handleReorderRecipes = (newOrder: CookbookRecipe[]) => {
    // Update page numbers
    const reordered = newOrder.map((recipe, index) => ({
      ...recipe,
      pageNumber: index + 1,
    }));
    // This is a simplified reorder - in production use proper state management
  };

  const handleRemoveRecipe = (index: number) => {
    const recipeId = cookbook.recipes[index]?.galleryItem.id;
    if (recipeId) {
      cookbook.toggleSelection(recipeId);
      cookbook.initializeRecipes(galleryItems || []);
    }
  };

  // Not logged in
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                חזרה
              </Button>
              <div className="flex items-center gap-2">
                <BookMarked className="w-6 h-6 text-primary" />
                <span className="font-bold text-foreground">יצירת ספר מתכונים</span>
              </div>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            יש להתחבר כדי ליצור ספר מתכונים
          </h1>
          <p className="text-muted-foreground mb-8">
            התחברו כדי לבחור מתכונים מהגלריה שלכם
          </p>
          <Button variant="default" onClick={() => navigate("/login")}>
            התחברות
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                if (cookbook.step === "select") {
                  navigate("/gallery");
                } else {
                  cookbook.prevStep();
                }
              }}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              {cookbook.step === "select" ? "לגלריה" : "חזרה"}
            </Button>
            <div className="flex items-center gap-2">
              <BookMarked className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground">יצירת ספר מתכונים</span>
            </div>
            <div className="w-20" />
          </div>
        </div>

        {/* Step Indicator */}
        <CookbookStepIndicator currentStep={cookbook.step} />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Recipes */}
          {cookbook.step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">טוען מתכונים...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <span className="text-6xl mb-4">📖</span>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    אין מתכונים בגלריה
                  </h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    בשלו מתכונים ושמרו אותם לגלריה כדי ליצור ספר מתכונים
                  </p>
                  <Button onClick={() => navigate("/ingredients")}>
                    התחילו לבשל
                  </Button>
                </div>
              ) : (
                <>
                  {/* Search & Actions Bar */}
                  <div className="p-4 border-b border-border bg-card shrink-0">
                    <div className="container mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="חיפוש מתכונים..."
                          className="pr-10"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          נבחרו {cookbook.selectedItems.length} מתכונים
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            cookbook.selectedItems.length === filteredItems.length
                              ? cookbook.clearSelection()
                              : cookbook.selectAll(filteredItems)
                          }
                        >
                          {cookbook.selectedItems.length === filteredItems.length
                            ? "נקה הכל"
                            : "בחר הכל"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Recipe Grid */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="container mx-auto">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredItems.map((item, index) => (
                          <CookbookRecipeCard
                            key={item.id}
                            item={item}
                            isSelected={cookbook.selectedItems.includes(item.id)}
                            onToggle={cookbook.toggleSelection}
                            index={index}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floating Action Button */}
                  <AnimatePresence>
                    {cookbook.selectedItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
                      >
                        <Button
                          size="lg"
                          variant="hero"
                          onClick={cookbook.nextStep}
                          className="shadow-2xl gap-2"
                        >
                          <BookOpen className="w-5 h-5" />
                          צור ספר מתכונים ({cookbook.selectedItems.length})
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}

          {/* Step 2: Customize */}
          {cookbook.step === "customize" && (
            <motion.div
              key="customize"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* Main Editor */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-lg mx-auto">
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-6 text-center">
                    עיצוב השער
                  </h2>
                  <CookbookCoverEditor
                    settings={cookbook.settings}
                    recipes={cookbook.recipes}
                    onUpdateSettings={cookbook.updateSettings}
                    onUpdateTheme={cookbook.updateTheme}
                  />
                  <Button
                    className="w-full mt-8"
                    size="lg"
                    onClick={cookbook.nextStep}
                  >
                    המשך לתצוגה מקדימה
                  </Button>
                </div>
              </div>

              {/* Sidebar */}
              <CookbookSidebar
                recipes={cookbook.recipes}
                onReorder={(recipes) => {
                  // Handle reorder
                }}
                onRemove={handleRemoveRecipe}
                activeRecipeIndex={activeRecipeIndex}
                onSelectRecipe={setActiveRecipeIndex}
              />
            </motion.div>
          )}

          {/* Step 3: Preview */}
          {cookbook.step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <CookbookPreview
                settings={cookbook.settings}
                recipes={cookbook.recipes}
                activePageIndex={activePageIndex}
                onPageChange={setActivePageIndex}
              />

              {/* Actions */}
              <div className="p-4 border-t border-border bg-card shrink-0">
                <div className="container mx-auto flex justify-center gap-4">
                  <Button variant="outline" onClick={cookbook.prevStep}>
                    חזרה לעריכה
                  </Button>
                  <Button
                    variant="hero"
                    onClick={() => setShowCheckout(true)}
                    className="gap-2"
                  >
                    <BookMarked className="w-5 h-5" />
                    סיום והדפסה
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Checkout Modal */}
      <CookbookCheckout
        settings={cookbook.settings}
        recipes={cookbook.recipes}
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
      />
    </div>
  );
};

export default CookbookBuilder;
