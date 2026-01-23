import { ArrowRight, ChefHat, BookOpen, Award, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import DishCard from "@/components/DishCard";
import { userDishes } from "@/data/mockData";

const UserProfile = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: "🍳", label: "מתכונים שבושלו", value: userDishes.length },
    { icon: "⭐", label: "דירוג ממוצע", value: "4.5" },
    { icon: "🔥", label: "רצף בישולים", value: "3 ימים" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground">מה שיש</span>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-24 h-24 bg-accent rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-5xl">👨‍🍳</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">שף מתחיל</h1>
          <p className="text-muted-foreground">מבשלים ביחד מינואר 2025</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="card-warm text-center py-4"
            >
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Achievement Badge */}
        <div className="bg-accent rounded-2xl p-4 mb-8 flex items-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="bg-primary rounded-full p-3">
            <Award className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">הישג חדש!</h3>
            <p className="text-sm text-muted-foreground">בישלתם 5 מתכונים - מגיע לכם כוכב! ⭐</p>
          </div>
        </div>

        {/* Cookbook Section */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              ספר המתכונים שלי
            </h2>
            <span className="text-muted-foreground">{userDishes.length} מנות</span>
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {userDishes.map((dish, index) => (
              <div 
                key={dish.id}
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                className="animate-scale-in"
              >
                <DishCard dish={dish} />
              </div>
            ))}
          </div>
        </div>

        {/* Empty State (for when there are no dishes) */}
        {userDishes.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📖</span>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ספר המתכונים ריק
            </h3>
            <p className="text-muted-foreground mb-4">
              בשלו את המתכון הראשון שלכם כדי להתחיל!
            </p>
            <Button variant="default" onClick={() => navigate("/ingredients")}>
              התחילו לבשל
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserProfile;
