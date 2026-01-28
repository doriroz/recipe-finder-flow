import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        toast({
          title: "נשלח! 📧",
          description: "בדוק את המייל שלך לאיפוס הסיסמה",
        });
        setMode("login");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "ברוכים הבאים! 🎉",
          description: "התחברת בהצלחה",
        });
        navigate("/ingredients");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "נרשמת בהצלחה! 📧",
          description: "בדוק את המייל שלך לאישור החשבון",
        });
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "משהו השתבש, נסה שוב",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "reset") return "שכחת סיסמה? 🔑";
    if (mode === "login") return "שמחים לראות אותך! 👋";
    return "הצטרפו אלינו! 🍳";
  };

  const getDescription = () => {
    if (mode === "reset") return "הכנס את המייל שלך ונשלח לך קישור לאיפוס";
    if (mode === "login") return "התחברו כדי להמשיך לבשל";
    return "צרו חשבון ותתחילו לבשל";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cream to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ChefHat className="w-8 h-8 text-primary" />
          </div>
          <span className="text-2xl font-bold text-foreground">מה שיש</span>
        </div>

        <Card className="shadow-elevated border-border/30">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {getDescription()}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  אימייל
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10 text-left"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {mode !== "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    סיסמה
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 pl-10 text-left"
                      dir="ltr"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="text-left">
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-sm text-primary hover:underline"
                  >
                    שכחת סיסמה?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">מעבד...</span>
                ) : (
                  <>
                    {mode === "reset" ? "שלח קישור לאיפוס" : mode === "login" ? "התחברות" : "הרשמה"}
                    <ArrowRight className="w-5 h-5 mr-2" />
                  </>
                )}
              </Button>
            </form>

            {mode === "reset" ? (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:underline font-medium inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  חזרה להתחברות
                </button>
              </div>
            ) : (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-primary hover:underline font-medium"
                >
                  {mode === "login"
                    ? "אין לך חשבון? הירשם עכשיו"
                    : "כבר יש לך חשבון? התחבר"}
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                חזרה לדף הבית
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
