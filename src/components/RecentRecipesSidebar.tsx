import { Clock, ChefHat, X, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRecipes } from "@/hooks/useRecipes";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface RecentRecipesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const RecentRecipesSidebar = ({ isOpen, onClose }: RecentRecipesSidebarProps) => {
  const { data: recipes, isLoading } = useUserRecipes();
  const navigate = useNavigate();

  // Get the 5 most recent recipes
  const recentRecipes = recipes?.slice(0, 5) || [];

  const handleRecipeClick = (recipeId: string) => {
    navigate(`/recipe?id=${recipeId}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 animate-fade-in lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-card border-l border-border shadow-elevated z-50 transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <History className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">מתכונים אחרונים</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-xl"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-65px)]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-xl" />
                </div>
              ))}
            </div>
          ) : recentRecipes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">עוד אין מתכונים שמורים</p>
              <p className="text-xs mt-1">חפשו מתכון או בשלו ממה שיש במקרר!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRecipes.map((recipe, index) => (
                <button
                  key={recipe.id}
                  onClick={() => handleRecipeClick(recipe.id)}
                  className="w-full text-right p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all duration-200 group animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {recipe.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {recipe.cooking_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.cooking_time} דק׳
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ChefHat className="w-3 h-3" />
                      {recipe.ingredients?.length || 0} מצרכים
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default RecentRecipesSidebar;
