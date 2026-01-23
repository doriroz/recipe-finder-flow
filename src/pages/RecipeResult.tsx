import { ArrowRight, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import RecipeCard from "@/components/RecipeCard";
import { mockRecipe } from "@/data/mockData";

const RecipeResult = () => {
  const navigate = useNavigate();

  const handleStartCooking = () => {
    navigate("/cooking");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/ingredients")}
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

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-sage-light text-sage-dark px-4 py-2 rounded-full mb-4">
            <span>✨</span>
            <span className="font-medium">מצאנו מתכון מושלם!</span>
          </div>
        </div>

        {/* Recipe Card */}
        <RecipeCard 
          recipe={mockRecipe} 
          onStartCooking={handleStartCooking}
        />
      </main>
    </div>
  );
};

export default RecipeResult;
