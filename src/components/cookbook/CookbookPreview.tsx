import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import type { CookbookSettings, CookbookRecipe } from "@/types/cookbook";

interface CookbookPreviewProps {
  settings: CookbookSettings;
  recipes: CookbookRecipe[];
  activePageIndex: number;
  onPageChange: (index: number) => void;
}

const CookbookPreview = ({
  settings,
  recipes,
  activePageIndex,
  onPageChange,
}: CookbookPreviewProps) => {
  const [direction, setDirection] = useState(0);

  // Pages: Cover, TOC, Recipe pages..., Back cover
  const totalPages = 2 + recipes.length + 1;

  const goToPage = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < totalPages) {
      setDirection(newIndex > activePageIndex ? 1 : -1);
      onPageChange(newIndex);
    }
  };

  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction > 0 ? -15 : 15,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction < 0 ? -15 : 15,
    }),
  };

  const renderPage = () => {
    const theme = settings.colorTheme;

    // Cover page
    if (activePageIndex === 0) {
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
          style={{ backgroundColor: theme.background }}
        >
          {settings.coverImage ? (
            <div className="absolute inset-0">
              <img
                src={settings.coverImage}
                alt=""
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          ) : (
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              }}
            />
          )}
          <div className="relative z-10">
            <BookOpen
              className="w-16 h-16 mx-auto mb-6"
              style={{ color: theme.primary }}
            />
            <h1
              className="text-4xl font-serif font-bold mb-3"
              style={{ color: theme.primary }}
            >
              {settings.title}
            </h1>
            {settings.subtitle && (
              <p
                className="text-xl font-light"
                style={{ color: theme.accent }}
              >
                {settings.subtitle}
              </p>
            )}
            <p className="mt-8 text-sm text-muted-foreground">
              {recipes.length} מתכונים
            </p>
          </div>
        </div>
      );
    }

    // Table of Contents
    if (activePageIndex === 1 && settings.includeTableOfContents) {
      return (
        <div
          className="w-full h-full p-8"
          style={{ backgroundColor: theme.background }}
        >
          <h2
            className="text-2xl font-serif font-bold mb-6 text-center"
            style={{ color: theme.primary }}
          >
            תוכן העניינים
          </h2>
          <div className="space-y-3">
            {recipes.map((recipe, index) => (
              <div
                key={recipe.galleryItem.id}
                className="flex items-center justify-between py-2 border-b border-dashed"
                style={{ borderColor: theme.secondary }}
              >
                <span className="text-foreground">
                  {recipe.galleryItem.recipe?.title || "מנה ללא שם"}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: theme.accent }}
                >
                  {index + 3}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Recipe pages
    const recipeIndex = settings.includeTableOfContents
      ? activePageIndex - 2
      : activePageIndex - 1;
    
    if (recipeIndex >= 0 && recipeIndex < recipes.length) {
      const recipe = recipes[recipeIndex];
      const recipeData = recipe.galleryItem.recipe;

      return (
        <div
          className="w-full h-full grid grid-cols-2"
          style={{ backgroundColor: theme.background }}
        >
          {/* Left - Image */}
          <div className="relative overflow-hidden">
            <img
              src={recipe.galleryItem.image_url}
              alt={recipeData?.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right - Content */}
          <div className="p-6 overflow-y-auto">
            <h3
              className="text-2xl font-serif font-bold mb-4"
              style={{ color: theme.primary }}
            >
              {recipeData?.title || "מנה ללא שם"}
            </h3>

            {recipeData?.cooking_time && (
              <p
                className="text-sm mb-4"
                style={{ color: theme.accent }}
              >
                זמן הכנה: {recipeData.cooking_time} דקות
              </p>
            )}

            {/* Ingredients */}
            {recipeData?.ingredients && (
              <div className="mb-6">
                <h4
                  className="text-lg font-semibold mb-2"
                  style={{ color: theme.primary }}
                >
                  מצרכים
                </h4>
                <ul className="space-y-1 text-sm">
                  {(recipeData.ingredients as Array<{ name: string; amount?: string; unit?: string }>).map(
                    (ing, i) => (
                      <li key={i} className="flex gap-2">
                        <span style={{ color: theme.accent }}>•</span>
                        <span>
                          {ing.amount && `${ing.amount} `}
                          {ing.unit && `${ing.unit} `}
                          {ing.name}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {recipeData?.instructions && (
              <div className="mb-6">
                <h4
                  className="text-lg font-semibold mb-2"
                  style={{ color: theme.primary }}
                >
                  הוראות הכנה
                </h4>
                <ol className="space-y-2 text-sm">
                  {recipeData.instructions.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        className="font-bold shrink-0"
                        style={{ color: theme.accent }}
                      >
                        {i + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Personal Note */}
            {settings.includePersonalNotes && recipe.personalNote && (
              <div
                className="mt-4 p-3 rounded-lg"
                style={{ backgroundColor: theme.secondary }}
              >
                <p className="text-sm italic">💭 {recipe.personalNote}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Back cover with QR
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
        style={{ backgroundColor: theme.background }}
      >
        <div
          className="p-4 rounded-xl mb-6"
          style={{ backgroundColor: theme.secondary }}
        >
          <QRCodeSVG
            value={`https://recipe-finder-flow.lovable.app/cookbook`}
            size={120}
            fgColor={theme.primary}
            bgColor={theme.secondary}
          />
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          סרקו לגרסה הדיגיטלית
        </p>
        <p
          className="text-lg font-serif"
          style={{ color: theme.primary }}
        >
          {settings.title}
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          נוצר באמצעות מה שיש
        </p>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/30">
      {/* Preview Container */}
      <div className="relative w-full max-w-3xl aspect-[4/3] perspective-1000">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activePageIndex}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              rotateY: { duration: 0.3 },
            }}
            className="absolute inset-0 bg-card rounded-xl shadow-2xl overflow-hidden"
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(activePageIndex + 1)}
          disabled={activePageIndex >= totalPages - 1}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
        
        <span className="text-sm text-muted-foreground min-w-[80px] text-center">
          עמוד {activePageIndex + 1} מתוך {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(activePageIndex - 1)}
          disabled={activePageIndex <= 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default CookbookPreview;
