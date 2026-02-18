import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
  popularityScore: number;
}

interface IngredientSearchInputProps {
  allIngredients: Ingredient[];
  selected: Ingredient[];
  onSelect: (ingredient: Ingredient) => void;
  onAddCustom: (name: string) => void;
}

const IngredientSearchInput = ({
  allIngredients,
  selected,
  onSelect,
  onAddCustom,
}: IngredientSearchInputProps) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const suggestions = debouncedQuery.trim()
    ? allIngredients
        .filter((ing) =>
          ing.name.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
        )
        .slice(0, 10)
    : [];

  const exactMatch = allIngredients.some(
    (ing) => ing.name.toLowerCase() === debouncedQuery.trim().toLowerCase()
  );

  const showAddCustom = debouncedQuery.trim() && !exactMatch;

  const handleSelect = useCallback(
    (ingredient: Ingredient) => {
      onSelect(ingredient);
      setQuery("");
      setDebouncedQuery("");
      setOpen(false);
      inputRef.current?.focus();
    },
    [onSelect]
  );

  const handleAddCustom = useCallback(() => {
    if (query.trim() && !exactMatch) {
      onAddCustom(query.trim());
      setQuery("");
      setDebouncedQuery("");
      setOpen(false);
    }
  }, [query, exactMatch, onAddCustom]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && !showAddCustom) {
        handleSelect(suggestions[0]);
      } else if (showAddCustom) {
        handleAddCustom();
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="חפשו מצרך או הקלידו מצרך חדש..."
          className={cn(
            "w-full bg-card border border-border rounded-full py-4 pr-12 pl-12 text-foreground",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all"
          )}
          dir="rtl"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setDebouncedQuery(""); setOpen(false); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (suggestions.length > 0 || showAddCustom) && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-elevated z-30 overflow-hidden animate-scale-in">
          <ul>
            {suggestions.map((ing) => {
              const isSelected = selected.some((s) => s.id === ing.id);
              return (
                <li key={ing.id}>
                  <button
                    onClick={() => handleSelect(ing)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-accent transition-colors",
                      isSelected && "bg-accent/50 text-accent-foreground"
                    )}
                  >
                    <span className="text-xl">{ing.emoji}</span>
                    <span className="flex-1 text-foreground">{ing.name}</span>
                    <span className="text-xs text-muted-foreground">{ing.category}</span>
                    {isSelected && <span className="text-primary text-sm">✓</span>}
                  </button>
                </li>
              );
            })}

            {showAddCustom && (
              <li className="border-t border-border">
                <button
                  onClick={handleAddCustom}
                  className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-accent transition-colors text-primary"
                >
                  <Plus className="w-5 h-5 shrink-0" />
                  <span className="flex-1">הוסף "{debouncedQuery}" כמצרך חדש</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default IngredientSearchInput;
