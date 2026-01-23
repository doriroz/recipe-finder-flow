import { Lightbulb } from "lucide-react";

interface Step {
  number: number;
  title: string;
  instruction: string;
  tip?: string;
}

interface CookingStepProps {
  step: Step;
  totalSteps: number;
}

const CookingStep = ({ step, totalSteps }: CookingStepProps) => {
  return (
    <div className="animate-fade-in">
      {/* Step Number */}
      <div className="flex items-center justify-center mb-8">
        <div className="step-indicator step-active text-2xl w-16 h-16">
          {step.number}
        </div>
        <span className="text-muted-foreground mr-4">מתוך {totalSteps}</span>
      </div>

      {/* Step Title */}
      <h2 className="text-3xl font-bold text-foreground text-center mb-6">
        {step.title}
      </h2>

      {/* Step Instruction */}
      <div className="card-warm mb-6">
        <p className="text-xl leading-relaxed text-foreground">
          {step.instruction}
        </p>
      </div>

      {/* Tip Box */}
      {step.tip && (
        <div className="bg-accent rounded-xl p-4 flex items-start gap-3">
          <div className="bg-primary rounded-full p-2 shrink-0">
            <Lightbulb className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-semibold text-accent-foreground mb-1">טיפ!</h4>
            <p className="text-muted-foreground">{step.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookingStep;
