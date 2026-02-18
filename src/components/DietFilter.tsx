import { useMemo } from "react";
import { Leaf } from "lucide-react";
import { analyzeAllDiets } from "@/lib/dietAnalyzer";
import DietBadge from "@/components/DietBadge";

interface DietFilterProps {
  ingredients: string[];
}

const DietFilter = ({ ingredients }: DietFilterProps) => {
  const analyses = useMemo(() => analyzeAllDiets(ingredients), [ingredients]);

  return (
    <div className="bg-muted/30 rounded-xl p-4 border border-border">
      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
        <Leaf className="w-4 h-4 text-secondary" />
        התאמה לדיאטות
      </h3>
      <div className="flex flex-wrap gap-2">
        {analyses.map((analysis) => (
          <DietBadge key={analysis.diet} analysis={analysis} />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        לחץ על תג להצגת פרטים ותחליפים מומלצים
      </p>
    </div>
  );
};

export default DietFilter;
