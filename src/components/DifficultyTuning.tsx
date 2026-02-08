import { useState } from "react";
import { ChefHat, Sparkles, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export type DifficultyLevel = "low" | "medium" | "high";

interface DifficultyTuningProps {
  currentDifficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  isRegenerating: boolean;
}

const difficultyOptions: { level: DifficultyLevel; label: string; icon: React.ReactNode; description: string }[] = [
  {
    level: "low",
    label: "קל יותר",
    icon: <Sparkles className="w-4 h-4" />,
    description: "פחות שלבים, טכניקות פשוטות"
  },
  {
    level: "medium",
    label: "נוכחי",
    icon: <ChefHat className="w-4 h-4" />,
    description: "רמה בינונית"
  },
  {
    level: "high",
    label: "מאתגר",
    icon: <Flame className="w-4 h-4" />,
    description: "יותר שלבים, טכניקות מתקדמות"
  }
];

const DifficultyTuning = ({ 
  currentDifficulty, 
  onDifficultyChange, 
  isRegenerating 
}: DifficultyTuningProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">רמת קושי</h3>
        <AnimatePresence>
          {isRegenerating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 text-sm text-primary"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ 
                  duration: 0.6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <ChefHat className="w-5 h-5" />
              </motion.div>
              <span>מתאים את המתכון...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex gap-2">
        {difficultyOptions.map((option) => {
          const isSelected = currentDifficulty === option.level;
          const isClickable = !isRegenerating && option.level !== currentDifficulty;
          
          return (
            <Button
              key={option.level}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              disabled={isRegenerating}
              onClick={() => isClickable && onDifficultyChange(option.level)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 transition-all",
                isSelected && "ring-2 ring-primary/20",
                !isClickable && !isRegenerating && "opacity-100 cursor-default"
              )}
            >
              {option.icon}
              <span>{option.label}</span>
            </Button>
          );
        })}
      </div>
      
      {/* Description of selected difficulty */}
      <p className="text-xs text-muted-foreground text-center">
        {difficultyOptions.find(o => o.level === currentDifficulty)?.description}
      </p>
    </div>
  );
};

export default DifficultyTuning;
