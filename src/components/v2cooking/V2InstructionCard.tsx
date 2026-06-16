import { Lightbulb, Timer, Leaf, Soup } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { parseTimersFromText, type ParsedTimer } from "@/lib/parseTimers";

interface V2InstructionCardProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  instruction: string;
  tip?: string;
  onStartTimer: (timer: ParsedTimer) => void;
}

const V2InstructionCard = ({
  stepNumber,
  totalSteps,
  title,
  instruction,
  tip,
  onStartTimer,
}: V2InstructionCardProps) => {
  const timers = parseTimersFromText(instruction);

  return (
    <motion.div
      key={stepNumber}
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Floating top-right illustration */}
      <Flame
        className="absolute -top-20 -right-20 w-16 h-16 text-primary/40 hidden md:block pointer-events-none animate-pulse"
        strokeWidth={1.5}
      />

      {/* Floating bottom-left illustration */}
      <Soup
        className="absolute -bottom-20 -left-20 w-16 h-16 text-primary/40 hidden md:block pointer-events-none"
        strokeWidth={1.5}
      />

      <article className="relative bg-card rounded-2xl shadow-md border border-border/60 px-8 py-10 md:px-12 md:py-12 overflow-hidden">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-xs font-semibold tracking-wider text-primary uppercase">
            שלב {stepNumber} / {totalSteps}
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-semibold text-foreground/90 mb-6">
          {title}
        </h2>

        <p className="text-2xl md:text-3xl font-medium leading-relaxed text-foreground">
          {instruction}
        </p>

        {timers.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {timers.map((t, i) => (
              <Button
                key={i}
                variant="outline"
                className="gap-2 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => onStartTimer(t)}
              >
                <Timer className="w-4 h-4" />
                הפעל טיימר · {t.label}
              </Button>
            ))}
          </div>
        )}

        {tip && (
          <div className="mt-8 flex items-start gap-3 bg-accent/40 border border-accent rounded-xl p-4">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-accent-foreground">{tip}</p>
          </div>
        )}
      </article>
    </motion.div>
  );
};

export default V2InstructionCard;
