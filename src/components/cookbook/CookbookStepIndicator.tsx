import { motion } from "framer-motion";
import { Check, BookOpen, Palette, Eye, ShoppingCart } from "lucide-react";
import type { CookbookBuilderStep } from "@/types/cookbook";

interface CookbookStepIndicatorProps {
  currentStep: CookbookBuilderStep;
}

const steps: { id: CookbookBuilderStep; label: string; icon: React.ElementType }[] = [
  { id: "select", label: "בחירה", icon: BookOpen },
  { id: "customize", label: "עיצוב", icon: Palette },
  { id: "preview", label: "תצוגה מקדימה", icon: Eye },
  { id: "checkout", label: "הזמנה", icon: ShoppingCart },
];

const CookbookStepIndicator = ({ currentStep }: CookbookStepIndicatorProps) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                scale: isCurrent ? 1.1 : 1,
                backgroundColor: isCompleted
                  ? "hsl(var(--primary))"
                  : isCurrent
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted))",
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full"
            >
              {isCompleted ? (
                <Check className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Icon
                  className={`w-5 h-5 ${
                    isCurrent ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                />
              )}
            </motion.div>
            <span
              className={`mr-2 text-sm hidden sm:inline ${
                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-2 ${
                  index < currentIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CookbookStepIndicator;
