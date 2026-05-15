import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DebugRecipeResult {
  title: string;
  recipeId: string;
  status: "accepted" | "rejected";
  rejectionReason: string | null;
  finalScore: number | null;
  badge: string | null;
  usedCount: number;
  missedCount: number;
  usedIngredientNames: string[];
  missedNonStaple: string[];
  missedAnchors: string[];
  detectedUserAnchors: string[];
  detectedRecipeAnchors: string[];
  recipeIngredientNames: string[];
  complexity: string;
  coverage: number | null;
  precision: number | null;
  burdenPenalty: number | null;
  structuralBonus?: number | null;
  burdenRatio?: number | null;
  maxBurdenRatio?: number | null;
}

interface FallbackResult {
  recipe: { title: string; id: string; ingredient_names: string[] } | null;
  anchorsChecked: string[];
  allAnchorsPresent: boolean;
  usedNames: string[];
  passed: boolean;
  reason: string;
}

interface WaterfallSummary {
  step1Count: number;
  step2Count: number;
  step3Result: FallbackResult | null;
  wouldReachStep: number;
}

interface Step2LiveData {
  translationMap: Record<string, string>;
  spoonacularUrl: string;
  rawCandidates: any[];
  afterChefLogic: DebugRecipeResult[];
  candidatesBeforeFilter: number;
  candidatesAfterFilter: number;
  error: string | null;
}

interface FormulaData {
  weights: { coverage: number; precision: number; burden: number; structural: number };
  maxBurden: number;
  maxBurdenRatio: number;
  description: string;
}

interface DebugResponse {
  success: boolean;
  input: {
    ingredients: string[];
    userAnchors: string[];
    userStaples: string[];
    maxBurden: number;
    totalLibraryRecipes: number;
  };
  formula: FormulaData;
  waterfall: WaterfallSummary;
  summary: {
    accepted: number;
    rejected: number;
    rejectionSummary: Record<string, number>;
  };
  accepted: DebugRecipeResult[];
  rejected: DebugRecipeResult[];
  step2_live: Step2LiveData;
  fallback: FallbackResult;
}

const STEP_LABELS = ["", "שלב 1: התאמה מקומית (עברית)", "שלב 2: Spoonacular (חי)", "שלב 3: Fallback השראה", "שלב 4: AI יצירתי"];

function FormulaCard({ formula, input }: { formula: FormulaData; input: DebugResponse["input"] }) {
  return (
    <Card className="border-2 border-primary/30">
      <CardHeader><CardTitle>📐 נוסחת הציון (Scoring Formula)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-4 font-mono text-sm" dir="ltr">
          <p className="font-bold text-primary">{formula.description}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>coverage weight: <span className="text-primary font-bold">{formula.weights.coverage}</span></div>
            <div>precision weight: <span className="text-primary font-bold">{formula.weights.precision}</span></div>
            <div>burden weight: <span className="text-primary font-bold">{formula.weights.burden}</span></div>
            <div>structural weight: <span className="text-primary font-bold">{formula.weights.structural}</span></div>
          </div>
          <div className="mt-3 border-t pt-2 text-xs">
            <div>maxBurden (non-staple miss limit): <span className="font-bold">{formula.maxBurden}</span></div>
            <div>maxBurdenRatio: <span className="font-bold">{formula.maxBurdenRatio}</span> (based on {input.ingredients.length} ingredients)</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" dir="rtl">
          <span className="text-sm text-muted-foreground">🔑 עוגנים:</span>
          {input.userAnchors.length > 0
            ? input.userAnchors.map(a => <Badge key={a} className="bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200">{a}</Badge>)
            : <span className="text-sm text-muted-foreground">אין</span>}
          <span className="text-sm text-muted-foreground mr-4">🧂 סטייפלים:</span>
          {input.userStaples.length > 0
            ? input.userStaples.map(s => <Badge key={s} variant="secondary">{s}</Badge>)
            : <span className="text-sm text-muted-foreground">אין</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function WaterfallCard({ waterfall }: { waterfall: WaterfallSummary }) {
  const steps = [
    { num: 1, label: "מקומי (עברית)", count: waterfall.step1Count },
    { num: 2, label: "Spoonacular (חי)", count: waterfall.step2Count },
    { num: 3, label: "Fallback", count: waterfall.step3Result?.passed ? 1 : 0 },
    { num: 4, label: "AI יצירתי", count: null },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>🔀 מפל (Waterfall) – שלב שהופעל: {STEP_LABELS[waterfall.wouldReachStep]}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex gap-3 flex-wrap">
          {steps.map(s => {
            const isActive = s.num === waterfall.wouldReachStep;
            const hasResults = s.count !== null && s.count > 0;
            const isSkipped = s.num > waterfall.wouldReachStep;
            const bg = isActive ? "bg-green-100 dark:bg-green-900 border-green-500" :
                       hasResults ? "bg-green-50 dark:bg-green-950" :
                       isSkipped ? "bg-muted opacity-50" :
                       "bg-red-50 dark:bg-red-950 border-red-300";
            return (
              <div key={s.num} className={`rounded-lg border-2 p-3 text-center min-w-[140px] ${bg}`}>
                <div className="text-xs text-muted-foreground">שלב {s.num}</div>
                <div className="font-semibold text-sm">{s.label}</div>
                <div className="text-lg font-bold mt-1">
                  {s.count !== null ? `${s.count} תוצאות` : (isActive ? "יופעל" : "—")}
                </div>
                {isActive && <Badge variant="default" className="mt-1">⬅ פעיל</Badge>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function FallbackCard({ fallback }: { fallback: FallbackResult }) {
  return (
    <Card>
      <CardHeader><CardTitle>🔄 שלב 3 – ניתוח Fallback</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-center">
          <Badge variant={fallback.passed ? "default" : "destructive"}>
            {fallback.passed ? "✅ נמצא" : "❌ לא נמצא"}
          </Badge>
          <span className="text-sm">{fallback.reason}</span>
        </div>
        {fallback.anchorsChecked.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm text-muted-foreground">עוגנים שנבדקו:</span>
            {fallback.anchorsChecked.map(a => <Badge key={a} variant="outline">{a}</Badge>)}
          </div>
        )}
        {fallback.recipe && (
          <div className="bg-muted rounded-md p-3 text-sm space-y-1">
            <div><strong>מתכון:</strong> {fallback.recipe.title}</div>
            <div><strong>מצרכים שהתאימו:</strong> {fallback.usedNames.join(", ") || "—"}</div>
            <div><strong>כל מצרכי המתכון:</strong> {fallback.recipe.ingredient_names.join(", ")}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreDrillDown({ recipe }: { recipe: DebugRecipeResult }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 text-xs space-y-2 border" dir="ltr">
      <div className="font-bold text-sm mb-2">Score Breakdown: {recipe.title}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded p-2">
          <div className="text-muted-foreground">Coverage</div>
          <div className="font-bold text-lg">{recipe.coverage != null ? (recipe.coverage * 100).toFixed(1) + "%" : "—"}</div>
          <div className="text-muted-foreground">× 0.55 = {recipe.coverage != null ? (recipe.coverage * 0.55).toFixed(3) : "—"}</div>
        </div>
        <div className="bg-card rounded p-2">
          <div className="text-muted-foreground">Precision</div>
          <div className="font-bold text-lg">{recipe.precision != null ? (recipe.precision * 100).toFixed(1) + "%" : "—"}</div>
          <div className="text-muted-foreground">× 0.20 = {recipe.precision != null ? (recipe.precision * 0.20).toFixed(3) : "—"}</div>
        </div>
        <div className="bg-card rounded p-2">
          <div className="text-muted-foreground">Burden Penalty</div>
          <div className="font-bold text-lg">{recipe.burdenPenalty != null ? recipe.burdenPenalty.toFixed(3) : "—"}</div>
          <div className="text-muted-foreground">× 0.15 = {recipe.burdenPenalty != null ? ((1 - recipe.burdenPenalty) * 0.15).toFixed(3) : "—"}</div>
          {recipe.burdenRatio != null && <div className="text-muted-foreground mt-1">ratio: {recipe.burdenRatio.toFixed(2)} / max: {recipe.maxBurdenRatio?.toFixed(2)}</div>}
        </div>
        <div className="bg-card rounded p-2">
          <div className="text-muted-foreground">Structural Bonus</div>
          <div className="font-bold text-lg">{recipe.structuralBonus != null ? recipe.structuralBonus.toFixed(2) : "—"}</div>
          <div className="text-muted-foreground">× 0.10 = {recipe.structuralBonus != null ? (recipe.structuralBonus * 0.10).toFixed(3) : "—"}</div>
        </div>
      </div>
      <div className="text-right font-bold text-primary text-sm mt-2">
        Final Score: {recipe.finalScore?.toFixed(4)}
      </div>
    </div>
  );
}

function RecipeTable({ recipes, title, expandable }: { recipes: DebugRecipeResult[]; title: string; expandable?: boolean }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  if (recipes.length === 0) return null;
  const isAccepted = recipes[0]?.status === "accepted";

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {expandable && <TableHead className="w-8"></TableHead>}
              <TableHead className="text-right">מתכון</TableHead>
              {isAccepted ? (
                <>
                  <TableHead className="text-right">ציון</TableHead>
                  <TableHead className="text-right">תג</TableHead>
                  <TableHead className="text-right">התאמות</TableHead>
                  <TableHead className="text-right">חסרים</TableHead>
                  <TableHead className="text-right">מצרכים שהתאימו</TableHead>
                  <TableHead className="text-right">חסרים (לא סטייפל)</TableHead>
                  <TableHead className="text-right">כיסוי</TableHead>
                  <TableHead className="text-right">דיוק</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="text-right">סיבת דחייה</TableHead>
                  <TableHead className="text-right">התאמות</TableHead>
                  <TableHead className="text-right">עוגני מתכון</TableHead>
                  <TableHead className="text-right">כל מצרכי המתכון</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.map((r, i) => (
              <>
                <TableRow key={i} className={expandable && isAccepted ? "cursor-pointer" : ""} onClick={() => expandable && isAccepted && setExpandedIdx(expandedIdx === i ? null : i)}>
                  {expandable && (
                    <TableCell className="w-8">
                      {isAccepted && (expandedIdx === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{r.title}</TableCell>
                  {isAccepted ? (
                    <>
                      <TableCell>{r.finalScore?.toFixed(3)}</TableCell>
                      <TableCell><Badge variant="outline">{r.badge}</Badge></TableCell>
                      <TableCell className="text-green-600">{r.usedCount}</TableCell>
                      <TableCell className="text-red-600">{r.missedCount}</TableCell>
                      <TableCell className="text-xs">{r.usedIngredientNames.join(", ")}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.missedNonStaple.join(", ") || "—"}</TableCell>
                      <TableCell>{r.coverage ? (r.coverage * 100).toFixed(0) + "%" : "—"}</TableCell>
                      <TableCell>{r.precision ? (r.precision * 100).toFixed(0) + "%" : "—"}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-destructive text-sm max-w-xs">{r.rejectionReason}</TableCell>
                      <TableCell>{r.usedCount}</TableCell>
                      <TableCell className="text-xs">{r.detectedRecipeAnchors.join(", ") || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{r.recipeIngredientNames.join(", ")}</TableCell>
                    </>
                  )}
                </TableRow>
                {expandable && expandedIdx === i && isAccepted && (
                  <TableRow key={`drill-${i}`}>
                    <TableCell colSpan={10}>
                      <ScoreDrillDown recipe={r} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Step2LiveCard({ step2 }: { step2: Step2LiveData }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const accepted = step2.afterChefLogic.filter(r => r.status === "accepted");
  const rejected = step2.afterChefLogic.filter(r => r.status === "rejected");

  return (
    <div className="space-y-4">
      <Card className="border-2 border-blue-300 dark:border-blue-700">
        <CardHeader><CardTitle>🌐 שלב 2 – Spoonacular Live (API אמיתי)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {step2.error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm font-medium">
              ⚠️ שגיאה: {step2.error}
            </div>
          )}

          {/* Translation Table */}
          <div>
            <h4 className="font-semibold text-sm mb-2">🔤 תרגום מצרכים (MyMemory API: he→en)</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">עברית (קלט)</TableHead>
                  <TableHead className="text-right">אנגלית (תוצאה)</TableHead>
                  <TableHead className="text-right">סוג</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(step2.translationMap).map(([he, en]) => (
                  <TableRow key={he}>
                    <TableCell className="font-medium">{he}</TableCell>
                    <TableCell dir="ltr">{en}</TableCell>
                    <TableCell>
                      {isCoreAnchorLocal(he) ? <Badge className="bg-orange-100 text-orange-900">עוגן</Badge> :
                       isStapleLocal(he) ? <Badge variant="secondary">סטייפל</Badge> :
                       <Badge variant="outline">רגיל</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* API URL */}
          {step2.spoonacularUrl && (
            <div>
              <h4 className="font-semibold text-sm mb-1">🔗 API URL</h4>
              <div className="bg-muted rounded-md p-2 font-mono text-xs break-all" dir="ltr">
                {step2.spoonacularUrl}
              </div>
            </div>
          )}

          {/* Raw Spoonacular Response */}
          {step2.rawCandidates.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">📦 תגובה גולמית מ-Spoonacular ({step2.rawCandidates.length} מתכונים)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">ID</TableHead>
                    <TableHead className="text-right">שם</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Missed</TableHead>
                    <TableHead className="text-right">Used Ingredients</TableHead>
                    <TableHead className="text-right">Missed Ingredients</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {step2.rawCandidates.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium text-sm" dir="ltr">{c.title}</TableCell>
                      <TableCell className="text-green-600 font-bold">{c.usedIngredientCount}</TableCell>
                      <TableCell className="text-red-600 font-bold">{c.missedIngredientCount}</TableCell>
                      <TableCell className="text-xs" dir="ltr">{c.usedIngredients?.map((i: any) => i.name).join(", ") || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground" dir="ltr">{c.missedIngredients?.map((i: any) => i.name).join(", ") || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          <div className="flex gap-4 items-center">
            <Badge variant="outline" className="text-sm">לפני סינון: {step2.candidatesBeforeFilter}</Badge>
            <span>→</span>
            <Badge variant={step2.candidatesAfterFilter > 0 ? "default" : "destructive"} className="text-sm">
              אחרי Chef Logic: {step2.candidatesAfterFilter}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Post-Chef-Logic accepted */}
      {accepted.length > 0 && (
        <Card>
          <CardHeader><CardTitle>✅ שלב 2 – עברו Chef Logic ({accepted.length})</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="text-right">מתכון</TableHead>
                  <TableHead className="text-right">ציון</TableHead>
                  <TableHead className="text-right">תג</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Missed</TableHead>
                  <TableHead className="text-right">כיסוי</TableHead>
                  <TableHead className="text-right">דיוק</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accepted.map((r, i) => (
                  <>
                    <TableRow key={i} className="cursor-pointer" onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}>
                      <TableCell>{expandedIdx === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</TableCell>
                      <TableCell className="font-medium" dir="ltr">{r.title}</TableCell>
                      <TableCell className="font-bold">{r.finalScore?.toFixed(3)}</TableCell>
                      <TableCell><Badge variant="outline">{r.badge}</Badge></TableCell>
                      <TableCell className="text-green-600">{r.usedCount}</TableCell>
                      <TableCell className="text-red-600">{r.missedCount}</TableCell>
                      <TableCell>{r.coverage ? (r.coverage * 100).toFixed(0) + "%" : "—"}</TableCell>
                      <TableCell>{r.precision ? (r.precision * 100).toFixed(0) + "%" : "—"}</TableCell>
                    </TableRow>
                    {expandedIdx === i && (
                      <TableRow key={`drill-${i}`}>
                        <TableCell colSpan={8}>
                          <ScoreDrillDown recipe={r} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Post-Chef-Logic rejected */}
      {rejected.length > 0 && (
        <Card>
          <CardHeader><CardTitle>❌ שלב 2 – נדחו ב-Chef Logic ({rejected.length})</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">מתכון</TableHead>
                  <TableHead className="text-right">סיבת דחייה</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Missed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejected.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium" dir="ltr">{r.title}</TableCell>
                    <TableCell className="text-destructive text-sm">{r.rejectionReason}</TableCell>
                    <TableCell className="text-green-600">{r.usedCount}</TableCell>
                    <TableCell className="text-red-600">{r.missedCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Local helper functions for UI display
const CORE_ANCHORS_HE = new Set([
  "עוף", "בשר טחון", "סלמון", "טונה", "חזה עוף", "בשר בקר", "ביצה", "טופו",
  "פסטה", "אורז", "קוסקוס", "שריות עוף", "דג סול", "נקניקיות",
  "חציל", "כרוב", "תפוח אדמה", "בטטה", "כרובית", "דלעת",
]);
const STAPLES_HE = new Set([
  "מלח", "פלפל שחור", "שמן זית", "שמן קנולה", "סוכר", "מים", "חומץ", "רוטב סויה", "שמן", "פלפל",
]);
function isCoreAnchorLocal(name: string): boolean {
  for (const a of CORE_ANCHORS_HE) { if (name.includes(a) || a.includes(name)) return true; }
  return false;
}
function isStapleLocal(name: string): boolean {
  for (const s of STAPLES_HE) { if (name.includes(s) || s.includes(name)) return true; }
  return false;
}

export default function DebugMatching() {
  const { user, loading } = useAuth();
  const [ingredientText, setIngredientText] = useState("אורז\nעוף\nבצל\nשום");
  const [result, setResult] = useState<DebugResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edgeLogs, setEdgeLogs] = useState<string[]>([]);

  if (loading) return <div className="p-8 text-center">טוען...</div>;
  if (!user) return <Navigate to="/login" />;

  const runDryMatch = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const ingredients = ingredientText.split("\n").map(s => s.trim()).filter(Boolean);
    if (ingredients.length === 0) {
      setError("הכנס לפחות מצרך אחד");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke("debug-matching", {
        body: { ingredients },
      });

      if (fnError) {
        let msg = "שגיאה בהרצת הדיבאג";
        try {
          if (fnError.context && typeof fnError.context.json === "function") {
            const body = await fnError.context.json();
            if (body?.error) msg = body.error;
          }
        } catch {}
        setError(msg);
        return;
      }

      if (data?.error) { setError(data.error); return; }
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEdgeLogs = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    setEdgeLogs([
      "⚠️ Edge function logs are only viewable in the Supabase dashboard:",
      `https://supabase.com/dashboard/project/${projectId}/functions/generate-and-save-recipe/logs`,
      `https://supabase.com/dashboard/project/${projectId}/functions/debug-matching/logs`,
    ]);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 text-right" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">🔧 דיבאג – לוגיקת התאמה (כל 4 שלבים + Spoonacular חי)</h1>
        <p className="text-muted-foreground text-sm">הרצה יבשה מלאה: שלב 1 (מקומי עברית), שלב 2 (Spoonacular API אמיתי + תרגום + Chef Logic), שלב 3 (Fallback), + נוסחת ציון.</p>

        {/* Input */}
        <Card>
          <CardHeader><CardTitle>מצרכים לבדיקה</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={ingredientText} onChange={e => setIngredientText(e.target.value)} placeholder="הכנס מצרך בכל שורה..." rows={6} className="font-mono text-base" />
            <div className="flex gap-3">
              <Button onClick={runDryMatch} disabled={isLoading}>{isLoading ? "מריץ (כולל API חי)..." : "🧪 הרצה יבשה (Dry Run + Spoonacular Live)"}</Button>
              <Button variant="outline" onClick={fetchEdgeLogs}>📋 קישורי לוגים</Button>
            </div>
            {error && <p className="text-destructive font-medium">{error}</p>}
          </CardContent>
        </Card>

        {/* Logs */}
        {edgeLogs.length > 0 && (
          <Card>
            <CardHeader><CardTitle>📋 לוגים</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-3 font-mono text-xs space-y-1">
                {edgeLogs.map((log, i) => (
                  <div key={i}>{log.startsWith("http") ? <a href={log} target="_blank" rel="noopener noreferrer" className="text-primary underline">{log}</a> : log}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <>
            {/* Formula Reference */}
            <FormulaCard formula={result.formula} input={result.input} />

            {/* Waterfall */}
            <WaterfallCard waterfall={result.waterfall} />

            {/* Summary */}
            <Card>
              <CardHeader><CardTitle>📊 סיכום שלב 1</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{result.input.totalLibraryRecipes}</div>
                    <div className="text-sm text-muted-foreground">מתכונים במאגר</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{result.summary.accepted}</div>
                    <div className="text-sm text-muted-foreground">עברו</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{result.summary.rejected}</div>
                    <div className="text-sm text-muted-foreground">נדחו</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{result.input.maxBurden}</div>
                    <div className="text-sm text-muted-foreground">עומס מקסימלי</div>
                  </div>
                </div>
                {Object.keys(result.summary.rejectionSummary).length > 0 && (
                  <div className="mt-4">
                    <span className="text-sm font-medium">סיבות דחייה:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(result.summary.rejectionSummary).map(([reason, count]) => (
                        <Badge key={reason} variant="secondary">{reason}: {count}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 1 Results */}
            <RecipeTable recipes={result.accepted} title={`✅ שלב 1 – עברו (${result.accepted.length})`} expandable />
            <RecipeTable recipes={result.rejected} title={`❌ שלב 1 – נדחו (${result.rejected.length})`} />

            {/* Step 2 Live Results */}
            <Step2LiveCard step2={result.step2_live} />

            {/* Step 3 Fallback */}
            <FallbackCard fallback={result.fallback} />
          </>
        )}
      </div>
    </div>
  );
}
