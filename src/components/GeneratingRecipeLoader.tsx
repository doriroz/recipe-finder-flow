import { ChefHat } from "lucide-react";

const GeneratingRecipeLoader = () => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-6 p-8 animate-fade-in">
        {/* Animated chef hat */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="relative bg-primary/10 rounded-full w-24 h-24 flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-primary animate-bounce" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            השף חושב...
          </h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            מנתח את המצרכים ויוצר מתכון מושלם במיוחד בשבילכם
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {/* Fun tips */}
        <p className="text-sm text-muted-foreground italic">
          💡 טיפ: תוכלו תמיד להחליף מצרכים לפי ההמלצות שנציע
        </p>
      </div>
    </div>
  );
};

export default GeneratingRecipeLoader;
