import iconIngredients from "@/assets/icon-ingredients.png";
import iconAiRobot from "@/assets/icon-ai-robot.png";
import iconCuisines from "@/assets/icon-cuisines.png";

const steps = [
  {
    icon: iconIngredients,
    title: "בחרו מצרכים",
    description: "סמנו מה יש לכם במקרר",
  },
  {
    icon: iconAiRobot,
    title: "AI יוצר מתכון",
    description: "מתכון מותאם אישית תוך שניות",
  },
  {
    icon: iconCuisines,
    title: "מתכונים פופולאריים לפי מטבחים",
    description: "חקרו טעמים עולמיים וגלו מתכונים אהובים ממטבחים שונים.",
  },
];

const HowItWorks = () => (
  <section className="mt-20 max-w-4xl mx-auto px-4">
    <h2 className="text-2xl font-bold text-foreground text-center mb-12">
      ✨ איך זה עובד?
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex flex-col items-center text-center animate-slide-up"
          style={{ animationDelay: `${0.1 * i}s`, animationFillMode: "both" }}
        >
          {/* Text above circle */}
          <h3 className="font-semibold text-foreground text-lg leading-tight mb-1">
            {step.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-snug mb-4 max-w-[200px]">
            {step.description}
          </p>

          {/* Circle with icon */}
          <div className="w-24 h-24 rounded-full bg-accent border-[3px] border-primary/40 flex items-center justify-center shadow-soft relative">
            <img
              src={step.icon}
              alt={step.title}
              className="w-16 h-16 object-contain"
              loading="lazy"
              width={64}
              height={64}
            />
            {/* Orange dot at bottom */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary shadow-sm" />
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default HowItWorks;
