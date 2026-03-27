import { Home, ChefHat, Image, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: User, label: "פרופיל", path: "/profile" },
  { icon: Image, label: "גלריה", path: "/gallery" },
  { icon: ChefHat, label: "בישול", path: "/ingredients" },
  { icon: Home, label: "בית", path: "/" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on cooking mode and post-cooking
  const hiddenPaths = ["/cooking", "/complete", "/login"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/50 shadow-[0_-2px_10px_-3px_hsl(25_30%_20%/0.08)] safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive && "scale-110"
                )}
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
