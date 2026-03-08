import { Zap } from "lucide-react";
import { useDailyTries } from "@/hooks/useDailyTries";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const CreditCounter = () => {
  const { user } = useAuth();
  const { remaining, loading } = useDailyTries();
  const navigate = useNavigate();

  if (!user || loading) return null;

  const isEmpty = remaining <= 0;

  return (
    <button
      onClick={() => isEmpty ? navigate("/upgrade") : navigate("/profile")}
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
      <span className="text-muted-foreground text-xs">ניסיונות</span>
    </button>
  );
};

export default CreditCounter;
