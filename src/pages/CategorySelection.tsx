import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CUISINE_CATEGORIES } from "@/data/categoryRecipes";

const CategorySelection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? CUISINE_CATEGORIES.filter(
        (cat) =>
          cat.nameHe.includes(query.trim()) ||
          cat.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          cat.subtitle.includes(query.trim())
      )
    : CUISINE_CATEGORIES;

  return (
    <div className="min-h-screen bg-muted" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-muted px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">בחירת קטגוריה 🍽️</h1>
            <button
              onClick={() => navigate(-1)}
              className="rounded-full p-2 hover:bg-accent transition-colors text-muted-foreground"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חפשו מטבח או מתכון..."
              className={cn(
                "w-full bg-card border border-border rounded-full py-4 pr-12 pl-12 text-foreground",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "transition-all"
              )}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div className="max-w-lg mx-auto px-4 pb-8 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{
                opacity: { duration: 0.22, delay: idx * 0.04 },
                y: { duration: 0.22, delay: idx * 0.04 },
                scale: { type: "spring", stiffness: 400, damping: 25 },
              }}
              onClick={() =>
                navigate("/ingredients", { state: { category: cat } })
              }
              className="rounded-2xl overflow-hidden cursor-pointer select-none flex flex-col items-center justify-center text-center p-5 gap-2 relative"
              style={{
                background: `hsl(${cat.hue})`,
                minHeight: "120px",
                boxShadow: "0 2px 10px -2px hsl(0 0% 0% / 0.12)",
              }}
            >
              <span className="text-4xl leading-none">{cat.emoji}</span>
              <div>
                <p className="font-bold text-foreground text-sm leading-tight">
                  {cat.nameHe}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cat.subtitle}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground/70">
                {cat.recipes.length} מתכונים
              </span>
            </motion.button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            לא נמצאו קטגוריות תואמות
          </p>
        )}
      </div>
    </div>
  );
};

export default CategorySelection;
