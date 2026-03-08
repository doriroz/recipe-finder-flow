import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2, ListChecks } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { RecipeIngredient } from "@/types/recipe";

interface IngredientReadinessCardProps {
  ingredients: RecipeIngredient[];
}

const IngredientReadinessCard = ({ ingredients }: IngredientReadinessCardProps) => {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = ingredients.length > 0 && checkedCount === ingredients.length;

  const toggle = (index: number) => {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="card-warm rounded-2xl overflow-hidden mb-6 animate-fade-in">
        {/* Header – always visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between gap-3 p-4 text-right hover:bg-accent/40 transition-colors duration-200 cursor-pointer">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`shrink-0 rounded-full p-2 transition-colors duration-300 ${allChecked ? "bg-green-100 dark:bg-green-900/40" : "bg-accent"}`}>
                {allChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ListChecks className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm leading-tight">
                  לפני שמתחילים (בדיקה מהירה)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {allChecked
                    ? "הכל מוכן! ✨"
                    : `ודא שכל המרכיבים מוכנים לעבודה · ${checkedCount}/${ingredients.length}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-primary">בדוק רשימה</span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              />
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expandable checklist */}
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="px-4 pb-4 space-y-1.5 border-t border-border/50 pt-3">
            {ingredients.map((ingredient, index) => {
              const label = ingredient.amount
                ? `${ingredient.amount}${ingredient.unit ? " " + ingredient.unit : ""} ${ingredient.name}`
                : ingredient.name;

              const isChecked = !!checked[index];

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50 border ${
                    isChecked
                      ? "border-green-200/60 bg-green-50/30 dark:border-green-800/40 dark:bg-green-900/10"
                      : "border-transparent bg-accent/20"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(index);
                  }}
                >
                  <Checkbox
                    checked={isChecked}
                    className="h-4.5 w-4.5 pointer-events-none"
                  />
                  <span
                    className={`text-sm transition-all duration-200 ${
                      isChecked ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default IngredientReadinessCard;
