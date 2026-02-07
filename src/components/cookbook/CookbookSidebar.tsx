import { motion, Reorder, useDragControls } from "framer-motion";
import { GripVertical, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CookbookRecipe } from "@/types/cookbook";

interface CookbookSidebarProps {
  recipes: CookbookRecipe[];
  onReorder: (recipes: CookbookRecipe[]) => void;
  onRemove: (index: number) => void;
  activeRecipeIndex: number;
  onSelectRecipe: (index: number) => void;
}

const SortableRecipeItem = ({
  recipe,
  index,
  isActive,
  onRemove,
  onSelect,
}: {
  recipe: CookbookRecipe;
  index: number;
  isActive: boolean;
  onRemove: () => void;
  onSelect: () => void;
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={recipe}
      dragListener={false}
      dragControls={controls}
      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
        isActive
          ? "bg-primary/10 border-2 border-primary"
          : "bg-card hover:bg-muted border-2 border-transparent"
      }`}
      onClick={onSelect}
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
        <img
          src={recipe.galleryItem.image_url}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">
          {recipe.galleryItem.recipe?.title || "מנה ללא שם"}
        </p>
        <p className="text-xs text-muted-foreground">עמוד {recipe.pageNumber}</p>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </Reorder.Item>
  );
};

const CookbookSidebar = ({
  recipes,
  onReorder,
  onRemove,
  activeRecipeIndex,
  onSelectRecipe,
}: CookbookSidebarProps) => {
  return (
    <div className="w-72 bg-background border-l border-border p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">תוכן הספר</h3>
        <span className="text-sm text-muted-foreground mr-auto">
          {recipes.length} מתכונים
        </span>
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        גרור כדי לשנות סדר
      </div>

      <Reorder.Group
        axis="y"
        values={recipes}
        onReorder={onReorder}
        className="flex-1 space-y-2 overflow-y-auto"
      >
        {recipes.map((recipe, index) => (
          <SortableRecipeItem
            key={recipe.galleryItem.id}
            recipe={recipe}
            index={index}
            isActive={index === activeRecipeIndex}
            onRemove={() => onRemove(index)}
            onSelect={() => onSelectRecipe(index)}
          />
        ))}
      </Reorder.Group>
    </div>
  );
};

export default CookbookSidebar;
