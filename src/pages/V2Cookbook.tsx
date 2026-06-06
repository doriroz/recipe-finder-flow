import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Trash2,
  ArrowRight,
  X,
  BookMarked,
  BookHeart,
  Clock,
  Calendar,
  Star,
  Download,
  Pencil,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useV2Cookbook } from "@/hooks/useV2Cookbook";
import { SOURCE_BADGES } from "@/types/v2cookbook";
import type { V2CookbookRecipe, RecipeSource } from "@/types/v2cookbook";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateCookbookPDF } from "@/lib/generateCookbookPDF";
import { cookbookThemes } from "@/types/cookbook";
import type { UserGalleryItem } from "@/types/recipe";

// ----- helpers -----

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23F5E6D3'/><text x='50%' y='50%' font-size='80' text-anchor='middle' dominant-baseline='central'>🍽️</text></svg>`,
  );

const toGalleryItem = (r: V2CookbookRecipe): UserGalleryItem => ({
  id: r.id,
  user_id: null,
  recipe_id: r.id,
  image_url: r.heritageImageUrl || PLACEHOLDER_IMAGE,
  user_notes: r.story || null,
  created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  recipe: {
    id: r.id,
    title: r.title,
    ingredients: r.ingredients.map((name) => ({ name })),
    instructions: r.instructions,
    cooking_time: r.cookingTime ?? null,
    substitutions: null,
  },
});

const formatDate = (d: Date | string) => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
};

const avgRating = (r: V2CookbookRecipe): number | null => {
  if (!r.ratings || r.ratings.length === 0) return null;
  return r.ratings.reduce((a, b) => a + b, 0) / r.ratings.length;
};

// ----- V2 image-or-placeholder block -----

const V2RecipeImage = ({
  recipe,
  className,
  iconSize = 48,
}: {
  recipe: V2CookbookRecipe;
  className?: string;
  iconSize?: number;
}) => {
  if (recipe.heritageImageUrl) {
    return (
      <img src={recipe.heritageImageUrl} alt={recipe.title} className={cn("w-full h-full object-cover", className)} />
    );
  }
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-accent/20",
        className,
      )}
    >
      <BookHeart className="text-primary/70" size={iconSize} strokeWidth={1.5} />
    </div>
  );
};

// ----- V2 card -----

const V2RecipeCard = ({
  recipe,
  onOpen,
  onDelete,
}: {
  recipe: V2CookbookRecipe;
  onOpen: () => void;
  onDelete: () => void;
}) => {
  const badge = SOURCE_BADGES[recipe.source];
  const rating = avgRating(recipe);

  return (
    <article
      onClick={onOpen}
      className="group relative rounded-2xl border border-border bg-card overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5"
    >
      {/* Image / placeholder area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <V2RecipeImage recipe={recipe} className="transition-transform duration-300 group-hover:scale-105" />

        {/* Floating tag */}
        <Badge className={cn("absolute top-2 right-2 text-[10px] shadow-soft backdrop-blur-sm", badge.color)}>
          {badge.emoji} {badge.label}
        </Badge>

        {/* Hover-only delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="מחקו מתכון"
          className="absolute top-2 left-2 p-1.5 rounded-lg bg-background/90 backdrop-blur-sm text-muted-foreground hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-soft"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-foreground leading-tight line-clamp-2 min-h-[2.5rem]">{recipe.title}</h3>

        {/* Flexible meta-data row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {recipe.cookingTime != null && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {recipe.cookingTime} דק׳
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(recipe.createdAt)}
          </span>
          {rating != null && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current text-primary" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

// ----- V2 modal -----

const V2RecipeModal = ({
  recipe,
  onClose,
  onDelete,
  onDownload,
  onEdit,
  downloading,
}: {
  recipe: V2CookbookRecipe;
  onClose: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onEdit: () => void;
  downloading: boolean;
}) => {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const badge = SOURCE_BADGES[recipe.source];
  const rating = avgRating(recipe);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-card shadow-elevated overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header image */}
        <div className="relative w-full h-56 sm:h-64 shrink-0 bg-muted">
          <V2RecipeImage recipe={recipe} iconSize={72} />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-foreground/50 to-transparent pointer-events-none" />
          <Badge className={cn("absolute top-3 right-3 text-[11px] shadow-soft", badge.color)}>
            {badge.emoji} {badge.label}
          </Badge>
          <button
            onClick={onClose}
            aria-label="סגרו"
            className="absolute top-3 left-3 p-2 rounded-full bg-background/90 backdrop-blur-sm text-foreground hover:bg-background shadow-soft transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground leading-snug">{recipe.title}</h2>

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {recipe.cookingTime != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {recipe.cookingTime} דק׳
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(recipe.createdAt)}
              </span>
              {rating != null && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-current text-primary" />
                  {rating.toFixed(1)}
                </span>
              )}
            </div>

            {recipe.story && (
              <p className="text-sm text-muted-foreground italic leading-relaxed pt-1">"{recipe.story}"</p>
            )}
          </div>

          {recipe.ingredients.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3">מצרכים</h3>
              <ul className="space-y-2.5">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Checkbox
                      id={`ing-${i}`}
                      checked={checked.has(i)}
                      onCheckedChange={() => toggle(i)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`ing-${i}`}
                      className={cn(
                        "text-sm text-foreground leading-relaxed cursor-pointer flex-1",
                        checked.has(i) && "line-through text-muted-foreground",
                      )}
                    >
                      {ing}
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recipe.instructions.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3">שלבי הכנה</h3>
              <ol className="space-y-3">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground leading-relaxed pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {recipe.ocrText && (
            <section className="p-4 rounded-xl bg-muted/60 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">טקסט מקורי שחולץ:</p>
              <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{recipe.ocrText}</p>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border bg-card px-6 py-3 flex items-center justify-end gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            מחק
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
            <Pencil className="w-4 h-4" />
            ערוך
          </Button>
          <Button size="sm" onClick={onDownload} disabled={downloading} className="gap-1.5">
            <Download className="w-4 h-4" />
            {downloading ? "מכין PDF..." : "הורד מתכון"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ----- Page -----

const FILTERS: { key: RecipeSource | "all"; label: string; emoji?: string }[] = [
  { key: "all", label: "הכל" },
  { key: "ai", label: SOURCE_BADGES.ai.label, emoji: SOURCE_BADGES.ai.emoji },
  { key: "heritage", label: SOURCE_BADGES.heritage.label, emoji: SOURCE_BADGES.heritage.emoji },
  { key: "library", label: SOURCE_BADGES.library.label, emoji: SOURCE_BADGES.library.emoji },
];

const V2Cookbook = () => {
  const navigate = useNavigate();
  const { recipes, removeRecipe } = useV2Cookbook();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RecipeSource | "all">("all");
  const [selected, setSelected] = useState<V2CookbookRecipe | null>(null);
  const [downloading, setDownloading] = useState(false);

  const filtered = useMemo(() => {
    let list = recipes;
    if (filter !== "all") list = list.filter((r) => r.source === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((ing) => ing.toLowerCase().includes(q)) ||
          (r.cuisineCategory && r.cuisineCategory.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [recipes, search, filter]);

  const handleDelete = (id: string) => {
    removeRecipe(id);
    toast.success("המתכון הוסר מהספר");
    if (selected?.id === id) setSelected(null);
  };

  const handleDownload = async (recipe: V2CookbookRecipe) => {
    try {
      setDownloading(true);
      const theme = cookbookThemes[0];
      const blob = await generateCookbookPDF(
        {
          title: recipe.title,
          subtitle: recipe.cuisineCategory,
          colorTheme: theme,
          includeTableOfContents: false,
          includePersonalNotes: !!recipe.story,
        },
        [{ galleryItem: toGalleryItem(recipe), pageNumber: 1, personalNote: recipe.story }],
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${recipe.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("המתכון הורד בהצלחה");
    } catch (e) {
      console.error("[V2Cookbook] download failed:", e);
      toast.error("ההורדה נכשלה — נסו שוב");
    } finally {
      setDownloading(false);
    }
  };

  const handleEdit = (recipe: V2CookbookRecipe) => {
    navigate("/add-recipe", { state: { editId: recipe.id, from: "/v2-cookbook" } });
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, hsl(var(--cream)) 0%, hsl(36 40% 92%) 100%)",
      }}
    >
      {/* Header */}
      <header
        className="relative z-20"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(28 95% 65%) 100%)",
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => navigate("/v2-dashboard")}
              aria-label="חזרה"
            >
              חזרה
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-primary-foreground">הספר שלי</h1>
              <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs backdrop-blur-sm">
                {recipes.length} מתכונים
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Search + filter pills */}
      <div className="max-w-6xl w-full mx-auto px-4 pt-5 pb-3 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפשו מתכון, מצרך או מטבח..."
            className="pr-10 pl-9 h-11 rounded-2xl bg-card/80 backdrop-blur-sm border-border"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
              aria-label="נקו חיפוש"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-base font-medium border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/70 text-foreground border-border hover:bg-muted",
                )}
              >
                {f.emoji ? `${f.emoji} ${f.label}` : f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid — leaves room for sticky footer */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pb-40">
        {filtered.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
              <BookHeart className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {recipes.length === 0 ? "הספר ריק — הוסיפו מתכון ראשון!" : "אין תוצאות לחיפוש"}
            </p>
            {recipes.length === 0 && (
              <Button className="rounded-xl gap-1" onClick={() => navigate("/add-recipe")}>
                <Plus className="w-4 h-4" />
                הוסיפו מתכון
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((r) => (
              <V2RecipeCard key={r.id} recipe={r} onOpen={() => setSelected(r)} onDelete={() => handleDelete(r.id)} />
            ))}
          </div>
        )}
      </main>

      {/* Floating add button */}
      <button
        onClick={() => navigate("/add-recipe")}
        aria-label="הוסיפו מתכון"
        className="fixed bottom-24 left-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Sticky footer CTA — full width, above BottomNav slot */}
      {recipes.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_-8px_hsl(25_30%_20%/0.15)]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookMarked className="w-5 h-5 text-primary" />
              </div>
              <p className="text-base font-medium text-foreground leading-snug">
                מוכנים להפוך את האוסף שלכם לספר אמיתי?
              </p>
            </div>
            <Button
              size="default"
              className="rounded-xl gap-2 shrink-0"
              onClick={() =>
                navigate("/cookbook", {
                  state: {
                    from: "/v2-cookbook",
                    galleryOverride: recipes.map(toGalleryItem),
                  },
                })
              }
            >
              <BookMarked className="w-4 h-4" />
              צרו ספר מתכונים
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <V2RecipeModal
          recipe={selected}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
          onDownload={() => handleDownload(selected)}
          onEdit={() => handleEdit(selected)}
          downloading={downloading}
        />
      )}
    </div>
  );
};

export default V2Cookbook;
