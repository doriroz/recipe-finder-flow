import { CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { DietAnalysis } from "@/lib/dietAnalyzer";

interface DietBadgeProps {
  analysis: DietAnalysis;
}

const colorMap = {
  green: {
    native: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800",
    convertible: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
    incompatible: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
    expandBg: "bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900",
    subBg: "bg-green-50 border-green-200 dark:bg-green-950/30",
    subText: "text-green-700 dark:text-green-300",
  },
  amber: {
    native: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
    convertible: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
    incompatible: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
    expandBg: "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900",
    subBg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30",
    subText: "text-amber-700 dark:text-amber-300",
  },
  blue: {
    native: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
    convertible: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
    incompatible: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
    expandBg: "bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900",
    subBg: "bg-blue-50 border-blue-200 dark:bg-blue-950/30",
    subText: "text-blue-700 dark:text-blue-300",
  },
};

const DietBadge = ({ analysis }: DietBadgeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = colorMap[analysis.color as keyof typeof colorMap] ?? colorMap.green;

  const hasDetails =
    !analysis.isNativelyCompatible && analysis.problematicIngredients.length > 0;

  const badgeClass = analysis.isNativelyCompatible
    ? colors.native
    : analysis.isConvertible
    ? colors.convertible
    : colors.incompatible;

  const Icon = analysis.isNativelyCompatible
    ? CheckCircle
    : analysis.isConvertible
    ? AlertCircle
    : XCircle;

  const statusText = analysis.isNativelyCompatible
    ? "כשר"
    : analysis.isConvertible
    ? "ניתן להמרה"
    : "לא מתאים";

  return (
    <div className="flex flex-col">
      <button
        onClick={() => hasDetails && setIsExpanded((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${badgeClass} ${
          hasDetails ? "cursor-pointer hover:opacity-80" : "cursor-default"
        }`}
        aria-expanded={hasDetails ? isExpanded : undefined}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{analysis.emoji}</span>
        <span>{analysis.label}</span>
        <span className="opacity-70">· {statusText}</span>
        {hasDetails && (
          isExpanded
            ? <ChevronUp className="w-3 h-3 ml-0.5" />
            : <ChevronDown className="w-3 h-3 ml-0.5" />
        )}
      </button>

      {/* Expandable details */}
      {isExpanded && hasDetails && (
        <div className={`mt-2 rounded-xl border p-3 text-xs space-y-2 ${colors.expandBg}`}>
          <p className="font-medium text-foreground">
            {analysis.isConvertible
              ? "ניתן לשנות את המצרכים הבאים:"
              : "המצרכים הבאים אינם מתאימים לדיאטה:"}
          </p>
          <ul className="space-y-1.5">
            {analysis.problematicIngredients.map((ing, i) => {
              const key = Object.keys(analysis.substitutions).find(
                (k) => ing.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(ing.toLowerCase())
              );
              const sub = key ? analysis.substitutions[key] : null;
              return (
                <li key={i} className="flex items-center gap-2 flex-wrap">
                  <span className="line-through text-muted-foreground">{ing}</span>
                  {sub && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <span className={`font-medium ${colors.subText}`}>{sub}</span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          {analysis.isConvertible && (
            <p className="text-muted-foreground text-[11px] pt-1 border-t border-border/50">
              ניתן להשתמש בסעיף ״החלפות חכמות״ למטה כדי לאמת את ההמרות
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DietBadge;
