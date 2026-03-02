import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

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

interface DebugResponse {
  success: boolean;
  input: {
    ingredients: string[];
    userAnchors: string[];
    userStaples: string[];
    maxBurden: number;
    totalLibraryRecipes: number;
  };
  waterfall: WaterfallSummary;
  summary: {
    accepted: number;
    rejected: number;
    rejectionSummary: Record<string, number>;
  };
  accepted: DebugRecipeResult[];
  rejected: DebugRecipeResult[];
  step2: {
    accepted: DebugRecipeResult[];
    rejected: DebugRecipeResult[];
    total: number;
  };
  fallback: FallbackResult;
}

const STEP_LABELS = ["", "שלב 1: התאמה מקומית (עברית)", "שלב 2: התאמה באנגלית", "שלב 3: Fallback השראה", "שלב 4: AI יצירתי"];

function WaterfallCard({ waterfall }: { waterfall: WaterfallSummary }) {
  const steps = [
    { num: 1, label: "מקומי (עברית)", count: waterfall.step1Count },
    { num: 2, label: "אנגלית (Spoonacular)", count: waterfall.step2Count },
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

function RecipeTable({ recipes, title }: { recipes: DebugRecipeResult[]; title: string }) {
  if (recipes.length === 0) return null;
  const isAccepted = recipes[0]?.status === "accepted";

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableRow key={i}>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
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
        <h1 className="text-3xl font-bold text-foreground">🔧 דיבאג – לוגיקת התאמה (כל 4 שלבים)</h1>
        <p className="text-muted-foreground text-sm">הרצה יבשה מלאה: שלב 1 (מקומי עברית), שלב 2 (אנגלית), שלב 3 (Fallback), + סיכום מפל.</p>

        {/* Input */}
        <Card>
          <CardHeader><CardTitle>מצרכים לבדיקה</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={ingredientText} onChange={e => setIngredientText(e.target.value)} placeholder="הכנס מצרך בכל שורה..." rows={6} className="font-mono text-base" />
            <div className="flex gap-3">
              <Button onClick={runDryMatch} disabled={isLoading}>{isLoading ? "מריץ..." : "🧪 הרצה יבשה (Dry Run)"}</Button>
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">עוגנים שזוהו:</span>
                  {result.input.userAnchors.length > 0
                    ? result.input.userAnchors.map(a => <Badge key={a} variant="default">{a}</Badge>)
                    : <span className="text-sm text-muted-foreground">אין</span>}
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
            <RecipeTable recipes={result.accepted} title={`✅ שלב 1 – עברו (${result.accepted.length})`} />
            <RecipeTable recipes={result.rejected} title={`❌ שלב 1 – נדחו (${result.rejected.length})`} />

            {/* Step 2 Results */}
            {result.step2 && result.step2.total > 0 && (
              <>
                <RecipeTable recipes={result.step2.accepted} title={`✅ שלב 2 (EN) – עברו (${result.step2.accepted.length})`} />
                <RecipeTable recipes={result.step2.rejected} title={`❌ שלב 2 (EN) – נדחו (${result.step2.rejected.length})`} />
              </>
            )}

            {/* Step 3 Fallback */}
            <FallbackCard fallback={result.fallback} />
          </>
        )}
      </div>
    </div>
  );
}
