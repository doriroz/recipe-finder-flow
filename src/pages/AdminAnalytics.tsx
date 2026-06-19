import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  Download,
  TrendingUp,
  ShieldOff,
  Loader2,
  ArrowRight,
  Cpu,
  Leaf,
  Search,
  UserPlus,
  Activity,
  Copy,
  Plus,
  Save,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGoBack } from "@/hooks/useGoBack";

interface AiLogEntry {
  id: string;
  created_at: string;
  action_type: string;
  source: string;
  credits_used: number;
  tokens_estimated: number;
}

interface AnalyticsData {
  disabled: boolean;
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    pdfDownloads: number;
    conversionRate: number;
  };
  byEvent: Record<string, number>;
  daily: { date: string; count: number }[];
  aiUsage?: {
    bySource: Record<string, number>;
    byAction: Record<string, number>;
    totalCreditsConsumed: number;
    recentLogs: AiLogEntry[];
  };
  userStats?: {
    activeUserIds7d: string[];
    downloadsByUser: Record<string, number>;
  };
}

type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  credits: { credits_remaining: number; daily_ai_calls: number; total_ai_calls: number } | null;
};


const AdminCommandCenter = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [disabling, setDisabling] = useState(false);

  // Users tab state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("");

  // Credits tab state
  const [creditInputs, setCreditInputs] = useState<Record<string, string>>({});
  const [creditBusy, setCreditBusy] = useState<string | null>(null);
  const [creditFilter, setCreditFilter] = useState("");

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    fetchAnalytics();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminLoading]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No session");
      const res = await supabase.functions.invoke("get-analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.error) throw res.error;
      setData(res.data);
    } catch (err: any) {
      toast({ title: "שגיאה בטעינת נתונים", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-list-users");
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } else {
      setUsers((data as any)?.users ?? []);
    }
    setUsersLoading(false);
  };

  const updateCredits = async (user_id: string, mode: "set" | "add") => {
    const raw = creditInputs[user_id];
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount)) {
      toast({ title: "ערך לא תקין", description: "הזינו מספר", variant: "destructive" });
      return;
    }
    setCreditBusy(user_id);
    const { data, error } = await supabase.functions.invoke("admin-update-credits", {
      body: { user_id, new_credit_amount: amount, mode },
    });
    setCreditBusy(null);
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
      return;
    }
    const newVal = (data as any)?.credits_remaining ?? 0;
    toast({ title: "עודכן", description: `יתרה חדשה: ${newVal}` });
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user_id
          ? { ...u, credits: { ...(u.credits ?? { daily_ai_calls: 0, total_ai_calls: 0 }), credits_remaining: newVal } as any }
          : u,
      ),
    );
    setCreditInputs((p) => ({ ...p, [user_id]: "" }));
  };

  const handleDisable = async () => {
    setDisabling(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await supabase.functions.invoke("toggle-analytics-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
        body: { enabled: false },
      });
      if (res.error) throw res.error;
      toast({ title: "הדשבורד הושבת", description: "ניתן להפעיל מחדש דרך SQL Editor" });
      setData((prev) => (prev ? { ...prev, disabled: true } : null));
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setDisabling(false);
    }
  };

  const handleRestore = async () => {
    setDisabling(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await supabase.functions.invoke("toggle-analytics-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
        body: { enabled: true },
      });
      if (res.error) throw res.error;
      toast({ title: "הדשבורד הופעל מחדש" });
      setData(null);
      fetchAnalytics();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setDisabling(false);
    }
  };

  const copyEmail = async (email: string | null) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      toast({ title: "הועתק", description: email });
    } catch {
      toast({ title: "שגיאה בהעתקה", variant: "destructive" });
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data?.disabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldOff className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">הדשבורד מושבת כרגע</h2>
            <p className="text-muted-foreground text-sm">ניתן להפעיל מחדש בלחיצה על הכפתור למטה</p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleRestore} disabled={disabling}>
                {disabling ? "מפעיל..." : "הפעל דשבורד מחדש"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/v2-dashboard")}>
                חזרה לדף הבית
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = data?.summary;
  const eventRows = data?.byEvent ? Object.entries(data.byEvent).sort((a, b) => b[1] - a[1]) : [];

  // Users-tab derived data
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const newUsersToday = users.filter((u) => new Date(u.created_at) >= todayStart).length;
  const activeSet = new Set(data?.userStats?.activeUserIds7d ?? []);
  const activeUsersCount = activeSet.size;
  const downloadsByUser = data?.userStats?.downloadsByUser ?? {};

  const filteredUsers = users.filter((u) =>
    !userFilter
      ? true
      : (u.email ?? "").toLowerCase().includes(userFilter.toLowerCase()) || u.id.includes(userFilter),
  );
  const filteredForCredits = users.filter((u) =>
    !creditFilter
      ? true
      : (u.email ?? "").toLowerCase().includes(creditFilter.toLowerCase()) || u.id.includes(creditFilter),
  );

  const fmtDate = (d: string | null) =>
    !d ? "—" : new Date(d).toLocaleDateString("he-IL", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div
      className="min-h-screen pb-20"
      dir="rtl"
      style={{ background: "linear-gradient(135deg, hsl(var(--cream)) 0%, hsl(36 40% 92%) 100%)" }}
    >
      {/* Header — consistent orange gradient pattern */}
      <header
        className="relative z-20"
        style={{ background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(28 95% 65%) 100%)" }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => goBack()}
              aria-label="חזרה"
            >
              חזרה
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-primary-foreground">מרכז הניהול</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl space-y-6">

        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="activity" className="py-2.5">
              <Activity className="h-4 w-4 ml-2" />
              פעילות באתר
            </TabsTrigger>
            <TabsTrigger value="users" className="py-2.5">
              <Users className="h-4 w-4 ml-2" />
              ניהול משתמשים
            </TabsTrigger>
            <TabsTrigger value="credits" className="py-2.5">
              <CreditCard className="h-4 w-4 ml-2" />
              ניהול קרדיטים
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB 1: APP ACTIVITY ===== */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={fetchAnalytics}>רענון</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <ShieldOff className="h-4 w-4" />
                    השבת דשבורד
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>השבתת דשבורד אנליטיקס</AlertDialogTitle>
                    <AlertDialogDescription>
                      הדשבורד יוסתר מכל המשתמשים, כולל מנהלים. ניתן להפעיל מחדש דרך הדאטאבייס בלבד.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row-reverse gap-2">
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisable}
                      disabled={disabling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {disabling ? "משבית..." : "השבת"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">סה״כ אירועים</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><p className="text-2xl font-bold text-foreground">{summary?.totalEvents ?? 0}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">משתמשים ייחודיים</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><p className="text-2xl font-bold text-foreground">{summary?.uniqueUsers ?? 0}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">הורדות PDF</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><p className="text-2xl font-bold text-foreground">{summary?.pdfDownloads ?? 0}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">שיעור המרה</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><p className="text-2xl font-bold text-foreground">{summary?.conversionRate ?? 0}%</p></CardContent>
              </Card>
            </div>

            {data?.daily && data.daily.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-foreground">אירועים לפי יום</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-72" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.daily}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {eventRows.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-foreground">פירוט אירועים</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שם אירוע</TableHead>
                        <TableHead className="text-right">כמות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventRows.map(([name, count]) => (
                        <TableRow key={name}>
                          <TableCell className="font-mono text-sm" dir="ltr">{name}</TableCell>
                          <TableCell>{count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {data?.aiUsage && (
              <>
                <div className="flex items-center gap-3 mt-8">
                  <Cpu className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">מוניטור שימוש AI</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">קריאות AI</CardTitle>
                      <Cpu className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold text-destructive">{data.aiUsage.bySource["ai"] || 0}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">התאמות מקומיות</CardTitle>
                      <Leaf className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold text-green-600">{data.aiUsage.bySource["local"] || 0}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Spoonacular</CardTitle>
                      <Search className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold text-blue-600">{data.aiUsage.bySource["spoonacular"] || 0}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">קרדיטים שנצרכו</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold text-foreground">{data.aiUsage.totalCreditsConsumed}</p></CardContent>
                  </Card>
                </div>

                {data.aiUsage.recentLogs.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-foreground">פעולות אחרונות</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">תאריך</TableHead>
                            <TableHead className="text-right">פעולה</TableHead>
                            <TableHead className="text-right">מקור</TableHead>
                            <TableHead className="text-right">קרדיטים</TableHead>
                            <TableHead className="text-right">טוקנים (הערכה)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.aiUsage.recentLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm">{new Date(log.created_at).toLocaleDateString("he-IL")}</TableCell>
                              <TableCell className="font-mono text-sm" dir="ltr">{log.action_type}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  log.source === "ai"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : log.source === "spoonacular"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                }`}>
                                  {log.source === "ai" ? "🤖 AI" : log.source === "spoonacular" ? "🔍 Spoonacular" : "📚 מקומי"}
                                </span>
                              </TableCell>
                              <TableCell>{log.credits_used}</TableCell>
                              <TableCell>{log.tokens_estimated || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ===== TAB 2: USER MANAGEMENT ===== */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">סך משתמשים</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><p className="text-2xl font-bold text-foreground">{users.length}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">חדשים היום</CardTitle>
                  <UserPlus className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent><p className="text-2xl font-bold text-primary">{newUsersToday}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">פעילים (7 ימים)</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent><p className="text-2xl font-bold text-green-600">{activeUsersCount}</p></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-foreground">משתמשים</CardTitle>
                <Button variant="outline" size="sm" onClick={loadUsers}>רענון</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="חיפוש לפי אימייל או מזהה"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="bg-background"
                />
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">אימייל</TableHead>
                        <TableHead className="text-right">תאריך הצטרפות</TableHead>
                        <TableHead className="text-right">פעילות אחרונה</TableHead>
                        <TableHead className="text-right">קרדיטים</TableHead>
                        <TableHead className="text-right">הורדות</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">טוען…</TableCell></TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">לא נמצאו משתמשים</TableCell></TableRow>
                      ) : (
                        filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="text-right">
                              <div className="font-medium" dir="ltr">{u.email ?? "—"}</div>
                              <div className="text-xs text-muted-foreground" dir="ltr">{u.id.slice(0, 8)}…</div>
                            </TableCell>
                            <TableCell className="text-right text-sm">{fmtDate(u.created_at)}</TableCell>
                            <TableCell className="text-right text-sm">{fmtDate(u.last_sign_in_at)}</TableCell>
                            <TableCell className="text-right font-bold">{u.credits?.credits_remaining ?? 0}</TableCell>
                            <TableCell className="text-right">{downloadsByUser[u.id] ?? 0}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => copyEmail(u.email)}>
                                <Copy className="h-3 w-3" /> העתק
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB 3: CREDIT MANAGEMENT ===== */}
          <TabsContent value="credits" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">ניהול קרדיטים</CardTitle>
                <Button variant="outline" size="sm" onClick={loadUsers}>רענון</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="חיפוש לפי אימייל או מזהה"
                  value={creditFilter}
                  onChange={(e) => setCreditFilter(e.target.value)}
                  className="bg-background"
                />
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">אימייל</TableHead>
                        <TableHead className="text-right">יתרה</TableHead>
                        <TableHead className="text-right">בשימוש (יום/סה״כ)</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">טוען…</TableCell></TableRow>
                      ) : filteredForCredits.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">לא נמצאו משתמשים</TableCell></TableRow>
                      ) : (
                        filteredForCredits.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="text-right">
                              <div className="font-medium" dir="ltr">{u.email ?? "—"}</div>
                              <div className="text-xs text-muted-foreground" dir="ltr">{u.id}</div>
                            </TableCell>
                            <TableCell className="text-right font-bold">{u.credits?.credits_remaining ?? 0}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {(u.credits?.daily_ai_calls ?? 0)} / {(u.credits?.total_ai_calls ?? 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Input
                                  type="number"
                                  className="w-24 h-9"
                                  value={creditInputs[u.id] ?? ""}
                                  onChange={(e) => setCreditInputs((p) => ({ ...p, [u.id]: e.target.value }))}
                                  placeholder="כמות"
                                />
                                <Button size="sm" variant="outline" onClick={() => updateCredits(u.id, "set")} disabled={creditBusy === u.id}>
                                  <Save className="h-3 w-3" /> קבע
                                </Button>
                                <Button size="sm" onClick={() => updateCredits(u.id, "add")} disabled={creditBusy === u.id}>
                                  <Plus className="h-3 w-3" /> הוסף
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminCommandCenter;
