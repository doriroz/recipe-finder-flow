import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ChefHat, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const UserMenu = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "להתראות! 👋",
        description: "התנתקת בהצלחה",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו להתנתק",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        onClick={() => navigate("/login")}
        className="flex items-center gap-2 rounded-full border-primary/30 hover:bg-primary/10"
      >
        <LogIn className="w-4 h-4" />
        התחברות
      </Button>
    );
  }

  const userEmail = user.email || "";
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:bg-accent"
        >
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">
              שלום! 👋
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate max-w-[180px]" dir="ltr">
              {userEmail}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/profile")}
          className="cursor-pointer"
        >
          <User className="ml-2 h-4 w-4" />
          הפרופיל שלי
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/ingredients")}
          className="cursor-pointer"
        >
          <ChefHat className="ml-2 h-4 w-4" />
          בישול חדש
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="ml-2 h-4 w-4" />
          {isLoggingOut ? "מתנתק..." : "התנתקות"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
