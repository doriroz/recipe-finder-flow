import { ChefHat, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: "🥘", title: "מתכונים מהמקרר", description: "הכניסו את מה שיש והקסם יקרה" },
    { icon: "💡", title: "החלפות חכמות", description: "אין לכם מצרך? יש לנו פתרון" },
    { icon: "👨‍🍳", title: "מצב בישול", description: "הוראות צעד אחר צעד" },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground">מה שיש</span>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/profile")}
          >
            הפרופיל שלי
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-12 pb-24">
        <div className="text-center max-w-3xl mx-auto">
          {/* Floating Emojis */}
          <div className="relative mb-8">
            <span className="absolute -right-4 top-0 text-5xl animate-float" style={{ animationDelay: "0s" }}>🍳</span>
            <span className="absolute -left-4 top-8 text-4xl animate-float" style={{ animationDelay: "0.5s" }}>🥗</span>
            <span className="absolute right-1/4 -top-4 text-3xl animate-float" style={{ animationDelay: "1s" }}>🍅</span>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight animate-fade-in">
              הפכו את השאריות
              <br />
              <span className="text-primary">לארוחה מושלמת</span>
            </h1>
          </div>

          <p className="text-xl text-muted-foreground mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            בחרו את מה שיש לכם במקרר, ואנחנו נמצא לכם מתכון מושלם.
            <br />
            בישול פשוט, טעים, ובלי בזבוז!
          </p>

          <Button 
            variant="hero" 
            size="xl"
            onClick={() => navigate("/ingredients")}
            className="animate-scale-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Sparkles className="w-6 h-6" />
            בואו נתחיל לבשל
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card-warm text-center animate-slide-up"
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              <span className="text-5xl mb-4 block">{feature.icon}</span>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Encouraging Message */}
        <div className="mt-20 text-center animate-fade-in" style={{ animationDelay: "1s" }}>
          <div className="inline-flex items-center gap-2 bg-sage-light text-sage-dark px-6 py-3 rounded-full">
            <Heart className="w-5 h-5" />
            <span className="font-medium">נעשה לכם בישול קל ומהנה</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
