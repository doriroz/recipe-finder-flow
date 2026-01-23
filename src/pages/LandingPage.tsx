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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-800">מה שיש</span>
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
            <span className="absolute -right-4 top-0 text-5xl animate-bounce" style={{ animationDelay: "0s" }}>🍳</span>
            <span className="absolute -left-4 top-8 text-4xl animate-bounce" style={{ animationDelay: "0.5s" }}>🥗</span>
            <span className="absolute right-1/4 -top-4 text-3xl animate-bounce" style={{ animationDelay: "1s" }}>🍅</span>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 leading-tight">
              הפכו את השאריות
              <br />
              <span className="text-orange-500">לארוחה מושלמת</span>
            </h1>
          </div>

          <p className="text-xl text-gray-600 mb-10">
            בחרו את מה שיש לכם במקרר, ואנחנו נמצא לכם מתכון מושלם.
            <br />
            בישול פשוט, טעים, ובלי בזבוז!
          </p>

          <Button 
            size="lg"
            onClick={() => navigate("/ingredients")}
            className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 h-auto rounded-full"
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
              className="bg-white rounded-2xl shadow-lg p-6 text-center"
            >
              <span className="text-5xl mb-4 block">{feature.icon}</span>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Encouraging Message */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full">
            <Heart className="w-5 h-5" />
            <span className="font-medium">נעשה לכם בישול קל ומהנה</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;