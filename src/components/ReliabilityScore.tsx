import { ShieldCheck, FlaskConical, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReliabilityScoreProps {
  score: "high" | "medium" | "creative";
}

const config = {
  high: {
    label: "אמינות גבוהה",
    icon: ShieldCheck,
    className: "bg-secondary/20 text-secondary border-secondary/30",
  },
  medium: {
    label: "אמינות בינונית",
    icon: FlaskConical,
    className: "bg-primary/15 text-primary border-primary/30",
  },
  creative: {
    label: "ניסוי יצירתי",
    icon: Sparkles,
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

const ReliabilityScore = ({ score }: ReliabilityScoreProps) => {
  const { label, icon: Icon, className } = config[score];

  return (
    <Badge variant="outline" className={`gap-1.5 px-3 py-1 text-xs font-medium ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Badge>
  );
};

export default ReliabilityScore;
