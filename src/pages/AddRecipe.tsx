import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Globe2, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeritageUploadDialog from "@/components/HeritageUploadDialog";
import addRecipeBook from "@/assets/add-recipe-book.png";

const AddRecipe = () => {
  const navigate = useNavigate();
  const [heritageOpen, setHeritageOpen] = useState(false);

  const options = [
    {
      id: "ai",
      title: "בנה מתכון עם AI",
      description: "בחרו מצרכים מהמקרר ותנו ל-AI להציע מנה מותאמת אישית.",
      icon: Sparkles,
      accent: "from-primary to-[hsl(28_95%_65%)]",
      emoji: "✨",
      onClick: () => navigate("/select-ingredients"),
    },
    {
      id: "global",
      title: "מהמטבח העולמי",
      description: "גלו מתכונים פופולריים מ-9 מטבחים מסביב לעולם.",
      icon: Globe2,
      accent: "from-secondary to-[hsl(150_45%_50%)]",
      emoji: "🌍",
      onClick: () => navigate("/categories"),
    },
    {
      id: "heritage",
      title: "זיכרון משפחתי",
      description: "העלו תמונה של מתכון מהבית — סבתא, אמא, או הספר הישן.",
      icon: Heart,
      accent: "from-[hsl(28_70%_55%)] to-[hsl(15_75%_60%)]",
      emoji: "🥧",
      onClick: () => setHeritageOpen(true),
    },
  ];

  return (
    <div
      className="min-h-screen"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, hsl(var(--cream)) 0%, hsl(36 40% 92%) 100%)",
      }}
    >
      {/* Header — title left, back right (consistent with cookbook) */}
      <header
        className="relative z-20"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(28 95% 65%) 100%)",
        }}
      >
        <div className="container mx-auto px-4 py-3">
          {/* <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between"> */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => navigate("/v2-dashboard")}
              aria-label="חזרה"
            >
              חזרה
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-primary-foreground">הוסיפו מתכון</h1>
            </div>
            {/*<Button
              variant="ghost"
              size="icon"
              className="rounded-xl bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground hover:bg-primary-foreground/30"
              onClick={() => navigate(-1)}
              aria-label="חזרה"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>*/}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-10 pb-6 text-center space-y-4">
        <img
          src={addRecipeBook}
          alt="ספר מתכונים פתוח עם כפית עץ ועלי תבלין"
          width={512}
          height={512}
          className="w-32 h-32 mx-auto object-contain drop-shadow-lg"
        />
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">איך תרצו להוסיף את המתכון?</h2>
        <p className="text-muted-foreground text-base">בחרו את הדרך שמתאימה לכם — נבנה ביחד את הספר שלכם.</p>
      </section>

      {/* Options */}
      <section className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={opt.onClick}
              className="group text-right rounded-2xl bg-card border border-border p-6 shadow-sm hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${opt.accent} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                {opt.title} <span>{opt.emoji}</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{opt.description}</p>
              <div className="mt-4 text-sm font-medium text-primary group-hover:gap-2 inline-flex items-center gap-1 transition-all">
                התחילו
                <ArrowRight className="w-4 h-4 rotate-180" />
              </div>
            </button>
          );
        })}
      </section>

      <HeritageUploadDialog open={heritageOpen} onOpenChange={setHeritageOpen} />
    </div>
  );
};

export default AddRecipe;
