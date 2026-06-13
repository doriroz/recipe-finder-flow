import { Lightbulb, Timer, Leaf } from "lucide-react";
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
    <motion.article
      key={stepNumber}
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-card rounded-2xl shadow-md border border-border/60 px-8 py-10 md:px-12 md:py-12 overflow-hidden"
    >
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

      {/* Delicate corner herb */}
      <Leaf
        className="absolute bottom-4 left-4 w-10 h-10 text-primary pointer-events-none"
        style={{ opacity: 0.05 }}
        strokeWidth={1.25}
      />
    </motion.article>
  );
};

export default V2InstructionCard;