import { useState, useMemo } from "react";
import { Search, ChefHat, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import IngredientChip from "@/components/IngredientChip";
import { ingredients as mockIngredients } from "@/data/mockData";
import { useCustomIngredients } from "@/hooks/useCustomIngredients";

interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
}

const IngredientInput = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const { customIngredients, addCustomIngredient } = useCustomIngredients();

  // Combine mock ingredients with custom ingredients
  const allIngredients = useMemo(() => {
    return [...mockIngredients, ...customIngredients];
  }, [customIngredients]);

  const filteredIngredients = allIngredients.filter((ing) =>
    ing.name.includes(searchQuery)
  );

  // Check if current search query matches any existing ingredient
  const exactMatch = allIngredients.some(
    (ing) => ing.name.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const toggleIngredient = (ingredient: Ingredient) => {
    setSelectedIngredients((prev) => {
      const isSelected = prev.find((i) => i.id === ingredient.id);
      if (isSelected) {
        return prev.filter((i) => i.id !== ingredient.id);
      }
      return [...prev, ingredient];
    });
  };

  const handleAddCustomIngredient = () => {
    if (searchQuery.trim() && !exactMatch) {
      const newIngredient = addCustomIngredient(searchQuery.trim());
      setSelectedIngredients((prev) => [...prev, newIngredient]);
      setSearchQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() && !exactMatch) {
      e.preventDefault();
      handleAddCustomIngredient();
    }
  };

  const handleFindRecipes = () => {
    if (selectedIngredients.length > 0) {
      navigate("/recipe");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-l from-primary/10 via-accent to-card border-b border-primary/20 sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <ArrowRight className="w-5 h-5" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-primary/15 p-2 rounded-full">
                <ChefHat className="w-6 h-6 text-primary" />
              </div>
              <span className="font-bold text-foreground text-lg">מה שיש</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            מה יש לכם במקרר?
          </h1>
          <p className="text-muted-foreground">
            בחרו את המצרכים שיש לכם ונמצא לכם מתכון מושלם
          </p>
        </div>

        {/* Search Bar with Add Button */}
        <div className="relative max-w-md mx-auto mb-8 animate-slide-up">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="חפשו או הוסיפו מצרך..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-card border border-border rounded-full py-4 pr-12 pl-16 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {searchQuery.trim() && !exactMatch && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleAddCustomIngredient}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
                title="הוסף מצרך חדש"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </div>
          
          {/* Hint for adding custom ingredient */}
          {searchQuery.trim() && !exactMatch && filteredIngredients.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-2 animate-fade-in">
              לחצו על <span className="text-primary font-medium">+</span> או Enter כדי להוסיף "{searchQuery}"
            </p>
          )}
        </div>

        {/* Selected Count */}
        {selectedIngredients.length > 0 && (
          <div className="text-center mb-6 animate-fade-in">
            <span className="bg-accent text-accent-foreground px-4 py-2 rounded-full font-medium">
              {selectedIngredients.length} מצרכים נבחרו
            </span>
          </div>
        )}

        {/* Ingredients Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-32">
          {filteredIngredients.map((ingredient, index) => (
            <div 
              key={ingredient.id} 
              style={{ animationDelay: `${index * 0.05}s` }}
              className="animate-fade-in"
            >
              <IngredientChip
                ingredient={ingredient}
                isSelected={selectedIngredients.some((i) => i.id === ingredient.id)}
                onClick={() => toggleIngredient(ingredient)}
              />
            </div>
          ))}
          
          {/* Show add button in grid when searching with no exact match */}
          {searchQuery.trim() && !exactMatch && filteredIngredients.length > 0 && (
            <div className="animate-fade-in">
              <button
                onClick={handleAddCustomIngredient}
                className="w-full h-full min-h-[72px] bg-primary/5 border-2 border-dashed border-primary/30 rounded-xl px-4 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/50"
              >
                <Plus className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">הוסף "{searchQuery}"</span>
              </button>
            </div>
          )}
        </div>

        {/* Find Recipes Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border p-4">
          <div className="container mx-auto">
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              disabled={selectedIngredients.length === 0}
              onClick={handleFindRecipes}
            >
              <ChefHat className="w-6 h-6" />
              מצאו לי מתכון
              {selectedIngredients.length > 0 && (
                <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-sm">
                  {selectedIngredients.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IngredientInput;
