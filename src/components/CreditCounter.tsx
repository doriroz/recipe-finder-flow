import { Zap } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const CreditCounter = () => {
  const { user } = useAuth();
  const { credits, loading } = useUserCredits();
  const navigate = useNavigate();

  if (!user || loading || !credits) return null;

  const remaining = credits.credits_remaining;
  const isEmpty = remaining <= 0;

  return (
    <button
      onClick={() => navigate("/upgrade")}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
        isEmpty
          ? "bg-destructive/15 hover:bg-destructive/25"
          : "bg-accent/50 hover:bg-accent/70"
      }`}
    >
      <Zap className={`w-3.5 h-3.5 ${isEmpty ? "text-destructive" : "text-primary"}`} />
      <span className={`font-medium ${isEmpty ? "text-destructive" : "text-foreground"}`}>
        {remaining}
      </span>
      <span className="text-muted-foreground text-xs">קרדיטים</span>
    </button>
  );
};

export default CreditCounter;
