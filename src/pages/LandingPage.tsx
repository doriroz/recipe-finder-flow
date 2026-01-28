import { ChefHat, Sparkles, Heart, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-fridge.jpg";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: "🥘", title: "מתכונים מהמקרר", description: "הכניסו את מה שיש והקסם יקרה" },
    { icon: "💡", title: "החלפות חכמות", description: "אין לכם מצרך? יש לנו פתרון" },
    { icon: "👨‍🍳", title: "מצב בישול", description: "הוראות צעד אחר צעד" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cream to-accent">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <ChefHat className="w-7 h-7 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">מה שיש</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/profile")}
                className="hover:bg-accent rounded-full"
                title="הפרופיל שלי"
              >
                <User className="w-5 h-5 text-foreground" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 rounded-full border-primary/30 hover:bg-primary/10"
              >
                <LogIn className="w-4 h-4" />
                התחברות
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-8 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Text Content with entrance animations */}
          <div className="text-center lg:text-right order-2 lg:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-in">
              הפכו את השאריות
              <br />
              <span className="text-primary">לארוחה מושלמת</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
              בחרו את מה שיש לכם במקרר, ואנחנו נמצא לכם מתכון מושלם.
              <br />
              בישול פשוט, טעים, ובלי בזבוז!
            </p>

            <div className="animate-scale-in" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
              <Button 
                size="lg"
                onClick={() => navigate("/ingredients")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 h-auto rounded-full shadow-elevated hover:shadow-card transition-all duration-300"
              >
                <Sparkles className="w-6 h-6" />
                בואו נתחיל לבשל
              </Button>
            </div>
          </div>

          {/* Hero Image with gentle animations */}
          <div className="order-1 lg:order-2 relative animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
            <div className="relative rounded-3xl overflow-hidden shadow-elevated">
              <img 
                src={heroImage} 
                alt="מישהו מחפש מה לבשל במקרר" 
                className="w-full h-auto object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            </div>
            
            {/* Floating decorative elements with gentle pulse animation */}
            <span className="absolute -top-4 -left-4 text-4xl animate-pulse opacity-80">🍳</span>
            <span className="absolute -bottom-2 -right-4 text-3xl animate-pulse opacity-80" style={{ animationDelay: "0.7s" }}>🥗</span>
          </div>
        </div>

        {/* Features with staggered entrance */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl shadow-card p-6 text-center border border-border/30 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${0.4 + index * 0.1}s`, animationFillMode: "both" }}
            >
              <span className="text-5xl mb-4 block">{feature.icon}</span>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Encouraging Message */}
        <div className="mt-20 text-center animate-fade-in" style={{ animationDelay: "0.7s", animationFillMode: "both" }}>
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-6 py-3 rounded-full border border-secondary/20">
            <Heart className="w-5 h-5" />
            <span className="font-medium">נעשה לכם בישול קל ומהנה</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
