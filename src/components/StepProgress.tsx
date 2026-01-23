import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

const StepProgress = ({ currentStep, totalSteps }: StepProgressProps) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        
        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={cn(
                "step-indicator transition-all duration-300",
                isCompleted && "step-completed",
                isActive && "step-active",
                !isCompleted && !isActive && "step-pending"
              )}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                stepNumber
              )}
            </div>
            {stepNumber < totalSteps && (
              <div 
                className={cn(
                  "w-8 h-1 rounded-full mx-1 transition-all duration-300",
                  isCompleted ? "bg-secondary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepProgress;
