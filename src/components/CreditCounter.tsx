import { Zap } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useAuth } from "@/hooks/useAuth";

const CreditCounter = () => {
  const { user } = useAuth();
  const { credits, loading } = useUserCredits();

  if (!user || loading || !credits) return null;

  return (
    <div className="flex items-center gap-1.5 bg-accent/50 px-3 py-1.5 rounded-full text-sm">
      <Zap className="w-3.5 h-3.5 text-primary" />
      <span className="font-medium text-foreground">{credits.credits_remaining}</span>
      <span className="text-muted-foreground text-xs">קרדיטים</span>
    </div>
  );
};

export default CreditCounter;
