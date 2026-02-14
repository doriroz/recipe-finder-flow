import { Lightbulb } from "lucide-react";

interface ChefTipProps {
  tip: string;
}

const ChefTip = ({ tip }: ChefTipProps) => {
  return (
    <div className="bg-accent/50 border border-accent-foreground/20 rounded-xl p-4 flex gap-3 items-start">
      <div className="bg-primary/10 rounded-full p-2 shrink-0">
        <Lightbulb className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h4 className="font-semibold text-foreground text-sm mb-1">💡 טיפ מהשף</h4>
        <p className="text-muted-foreground text-sm leading-relaxed">{tip}</p>
      </div>
    </div>
  );
};

export default ChefTip;
