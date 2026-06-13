import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface V2StepSidebarProps {
  totalSteps: number;
  currentStep: number; // 0 = prep, 1..N = step
  onJump?: (step: number) => void;
}

const V2StepSidebar = ({ totalSteps, currentStep, onJump }: V2StepSidebarProps) => {
  const items = [
    { idx: 0, label: "הכנות" },
    ...Array.from({ length: totalSteps }, (_, i) => ({ idx: i + 1, label: `שלב ${i + 1}` })),
  ];

  return (
    <aside className="hidden md:flex flex-col w-[260px] shrink-0 border-l border-border bg-card/60 backdrop-blur-sm">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-muted-foreground tracking-wide">
          שלבי הבישול
        </h3>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((s) => {
          const isActive = s.idx === currentStep;
          const isDone = s.idx < currentStep;
          return (
            <button
              key={s.idx}
              type="button"
              onClick={() => onJump?.(s.idx)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-all",
                "hover:bg-accent/60",
                isActive && "bg-primary text-primary-foreground shadow-sm hover:bg-primary",
                !isActive && isDone && "text-foreground",
                !isActive && !isDone && "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 border",
                  isActive && "bg-primary-foreground text-primary border-primary-foreground",
                  !isActive && isDone && "bg-secondary/30 text-foreground border-secondary/40",
                  !isActive && !isDone && "bg-muted text-muted-foreground border-transparent",
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : s.idx === 0 ? "✓" : s.idx}
              </span>
              <span className="text-sm font-medium flex-1 truncate">{s.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default V2StepSidebar;