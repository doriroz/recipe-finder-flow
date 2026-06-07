import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RefreshCw, Plus, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  credits: { credits_remaining: number; daily_ai_calls: number; total_ai_calls: number } | null;
};

const AdminCredits = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-list-users");
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } else {
      setUsers((data as any)?.users ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, authLoading, adminLoading]);

  const update = async (user_id: string, mode: "set" | "add") => {
    const raw = inputs[user_id];
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount)) {
      toast({ title: "ערך לא תקין", description: "הזינו מספר", variant: "destructive" });
      return;
    }
    setBusy(user_id);
    const { data, error } = await supabase.functions.invoke("admin-update-credits", {
      body: { user_id, new_credit_amount: amount, mode },
    });
    setBusy(null);
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
    setInputs((p) => ({ ...p, [user_id]: "" }));
  };

  const filtered = users.filter((u) =>
    !filter ? true : (u.email ?? "").toLowerCase().includes(filter.toLowerCase()) || u.id.includes(filter),
  );

  if (authLoading || adminLoading) {
    return <div className="p-8 text-center text-muted-foreground">טוען…</div>;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-muted">
      <header className="bg-gradient-to-l from-primary to-secondary text-primary-foreground p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-primary-foreground">
          <ArrowRight className="ml-2 h-4 w-4" /> חזרה
        </Button>
        <h1 className="text-xl font-bold">ניהול קרדיטים</h1>
        <Button variant="ghost" size="sm" onClick={load} className="text-primary-foreground">
          <RefreshCw className="ml-2 h-4 w-4" /> רענון
        </Button>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <Input
          placeholder="חיפוש לפי אימייל או מזהה"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-background"
        />

        <div className="bg-background rounded-lg border overflow-hidden">
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
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">טוען…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">לא נמצאו משתמשים</TableCell></TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium" dir="ltr">{u.email ?? "—"}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{u.id}</div>
                    </TableCell>
                    <TableCell className="font-bold">{u.credits?.credits_remaining ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(u.credits?.daily_ai_calls ?? 0)} / {(u.credits?.total_ai_calls ?? 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-24 h-9"
                          value={inputs[u.id] ?? ""}
                          onChange={(e) => setInputs((p) => ({ ...p, [u.id]: e.target.value }))}
                          placeholder="כמות"
                        />
                        <Button
                          size="sm" variant="outline"
                          onClick={() => update(u.id, "set")}
                          disabled={busy === u.id}
                        >
                          <Save className="ml-1 h-3 w-3" /> קבע
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => update(u.id, "add")}
                          disabled={busy === u.id}
                        >
                          <Plus className="ml-1 h-3 w-3" /> הוסף
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminCredits;