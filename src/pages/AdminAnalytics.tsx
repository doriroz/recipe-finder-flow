import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Users, Download, TrendingUp, ShieldOff, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchAnalytics();
  }, [isAdmin, adminLoading, navigate]);

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
      setData((prev) => prev ? { ...prev, disabled: true } : null);
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setDisabling(false);
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
            <p className="text-muted-foreground text-sm">
              ניתן להפעיל מחדש דרך SQL Editor:
            </p>
            <code className="block bg-muted p-3 rounded-lg text-xs" dir="ltr">
              UPDATE app_settings SET value = 'true' WHERE key = 'analytics_dashboard_enabled';
            </code>
            <Button variant="outline" onClick={() => navigate("/")}>
              חזרה לדף הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = data?.summary;
  const eventRows = data?.byEvent ? Object.entries(data.byEvent).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">דשבורד אנליטיקס</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAnalytics}>
              רענון
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <ShieldOff className="h-4 w-4 ml-2" />
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
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">סה״כ אירועים</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{summary?.totalEvents ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">משתמשים ייחודיים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{summary?.uniqueUsers ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">הורדות PDF</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{summary?.pdfDownloads ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">שיעור המרה</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{summary?.conversionRate ?? 0}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {data?.daily && data.daily.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">אירועים לפי יום</CardTitle>
            </CardHeader>
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

        {/* Event Table */}
        {eventRows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">פירוט אירועים</CardTitle>
            </CardHeader>
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

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
