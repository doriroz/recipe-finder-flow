import { motion } from "framer-motion";
import { Check, Clock, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { UserGalleryItem } from "@/types/recipe";

interface CookbookRecipeCardProps {
  item: UserGalleryItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
  index: number;
}

const CookbookRecipeCard = ({
  item,
  isSelected,
  onToggle,
  index,
}: CookbookRecipeCardProps) => {
  const recipe = item.recipe;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onToggle(item.id)}
      className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${
        isSelected
          ? "border-primary shadow-lg scale-[1.02]"
          : "border-transparent hover:border-primary/30"
      }`}
    >
      {/* Selection Overlay */}
      <div
        className={`absolute inset-0 z-10 transition-all duration-300 ${
          isSelected ? "bg-primary/10" : ""
        }`}
      />

      {/* Checkbox */}
      <div className="absolute top-3 right-3 z-20">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-background/80 border-2 border-muted-foreground/30"
          }`}
        >
          {isSelected && <Check className="w-4 h-4" />}
        </div>
      </div>

      {/* Image */}
      <div className="aspect-[4/3] bg-muted">
        <img
          src={item.image_url}
          alt={recipe?.title || "מנה"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4 bg-card">
        <h3 className="font-semibold text-foreground truncate mb-1">
          {recipe?.title || "מנה ללא שם"}
        </h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {recipe?.cooking_time && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{recipe.cooking_time} דק׳</span>
            </div>
          )}
          {item.created_at && (
            <span>{new Date(item.created_at).toLocaleDateString("he-IL")}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CookbookRecipeCard;
