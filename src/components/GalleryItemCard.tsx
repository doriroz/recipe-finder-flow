import { useState } from "react";
import { ChefHat, Clock, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserGalleryItem } from "@/types/recipe";

interface GalleryItemCardProps {
  item: UserGalleryItem;
  index: number;
  onDelete: (id: string) => void;
}

const GalleryItemCard = ({ item, index, onDelete }: GalleryItemCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const recipe = item.recipe;
  const hasRecipeDetails = recipe && (recipe.ingredients?.length > 0 || recipe.instructions?.length > 0);

  return (
    <div
      className="card-warm group overflow-hidden animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image */}
      <div className="aspect-square bg-cream rounded-xl overflow-hidden mb-4 relative">
        <img
          src={item.image_url}
          alt={recipe?.title || item.user_notes || "מנה"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="absolute top-2 left-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Title & Time */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-foreground truncate flex-1">
          {recipe?.title || "מנה ללא שם"}
        </h3>
        {recipe?.cooking_time && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm shrink-0">
            <Clock className="w-4 h-4" />
            <span>{recipe.cooking_time}׳</span>
          </div>
        )}
      </div>

      {/* User Notes */}
      {item.user_notes && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {item.user_notes}
        </p>
      )}

      {/* Date */}
      <p className="text-xs text-muted-foreground mb-3">
        {item.created_at
          ? new Date(item.created_at).toLocaleDateString("he-IL")
          : ""}
      </p>

      {/* Expandable Recipe Details */}
      {hasRecipeDetails && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between text-primary hover:text-primary"
          >
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              <span>פרטי המתכון</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border animate-fade-in space-y-4">
              {/* Ingredients */}
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground text-sm mb-2">מצרכים:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {(recipe.ingredients as Array<{ name: string; amount?: string; unit?: string }>).map((ing, i) => (
                      <li key={i} className="flex gap-2">
                        <span>•</span>
                        <span>
                          {ing.amount && `${ing.amount} `}
                          {ing.unit && `${ing.unit} `}
                          {ing.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructions */}
              {recipe.instructions && recipe.instructions.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground text-sm mb-2">הוראות הכנה:</h4>
                  <ol className="text-sm text-muted-foreground space-y-2">
                    {recipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-medium text-primary shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GalleryItemCard;
