import { useState } from "react";
import { Search, ChefHat, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import IngredientChip from "@/components/IngredientChip";
import { ingredients } from "@/data/mockData";

const IngredientInput = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.includes(searchQuery)
  );

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients(prev => {
      const isSelected = prev.find(i => i.id === ingredient.id);
      if (isSelected) {
        return prev.filter(i => i.id !== ingredient.id);
      }
      return [...prev, ingredient];
    });
  };

  const handleFindRecipes = () => {
    if (selectedIngredients.length > 0) {
      navigate("/recipe");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
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
              <ChefHat className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground">מה שיש</span>
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

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-8 animate-slide-up">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="חפשו מצרך..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-full py-4 pr-12 pl-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
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
                isSelected={selectedIngredients.some(i => i.id === ingredient.id)}
                onClick={() => toggleIngredient(ingredient)}
              />
            </div>
          ))}
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
