import iconIngredients from "@/assets/icon-ingredients.png";
import iconAiRobot from "@/assets/icon-ai-robot.png";
import iconCuisines from "@/assets/icon-cuisines.png";
import iconCooking from "@/assets/icon-cooking.png";
import iconCookbook from "@/assets/icon-cookbook.png";

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
  {
    icon: iconCooking,
    title: "בישול בהנחיה",
    description: "שלב אחר שלב עד למנה מושלמת.",
  },
  {
    icon: iconCookbook,
    title: "יצירת ספר מתכונים אישי",
    description: "אגדו, ערכו והדפיסו את האוסף המלא שלכם",
  },
];

const HowItWorks = () => (
  <section className="mt-20 max-w-5xl mx-auto px-4">
    <h2 className="text-2xl font-bold text-foreground text-center mb-12">
      ✨ איך זה עובד?
    </h2>

    {/* Desktop zig-zag */}
    <div className="hidden md:block relative">
      {/* SVG zig-zag arrow background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 420"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M950 100 L750 100 Q700 100 700 150 L700 270 Q700 320 650 320 L550 320 Q500 320 500 270 L500 150 Q500 100 450 100 L250 100 Q200 100 200 150 L200 270 Q200 320 150 320 L50 320"
          stroke="hsl(25 85% 75%)"
          strokeWidth="50"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.35"
        />
        {/* Arrow head at the end (left side) */}
        <polygon
          points="30,320 70,295 70,345"
          fill="hsl(25 85% 70%)"
          opacity="0.5"
        />
      </svg>

      {/* Steps grid - 5 columns */}
      <div className="relative grid grid-cols-5 gap-4" style={{ minHeight: "420px" }}>
        {steps.map((step, i) => {
          // Zig-zag: steps 0,2,4 on top; steps 1,3 on bottom
          const isTop = i % 2 === 0;
          return (
            <div
              key={i}
              className={`flex flex-col items-center text-center ${
                isTop ? "self-start pt-0" : "self-end pb-0"
              } animate-slide-up`}
              style={{ animationDelay: `${0.1 * i}s`, animationFillMode: "both" }}
            >
              {/* Circle with icon */}
              <div className="w-20 h-20 rounded-full bg-accent border-[3px] border-primary/40 flex items-center justify-center shadow-soft mb-3 relative">
                <img
                  src={step.icon}
                  alt={step.title}
                  className="w-14 h-14 object-contain"
                  loading="lazy"
                  width={56}
                  height={56}
                />
                {/* Orange dot connector */}
                <div
                  className={`absolute w-3 h-3 rounded-full bg-primary shadow-sm ${
                    isTop ? "-bottom-1.5" : "-top-1.5"
                  } left-1/2 -translate-x-1/2`}
                />
              </div>

              <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 max-w-[140px]">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-xs leading-snug max-w-[150px]">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>

    {/* Mobile: vertical timeline */}
    <div className="md:hidden flex flex-col items-center gap-0 relative">
      {/* Vertical line */}
      <div className="absolute top-0 bottom-0 w-1 bg-primary/20 rounded-full" />

      {steps.map((step, i) => (
        <div
          key={i}
          className="relative flex items-center gap-4 py-4 animate-slide-up"
          style={{
            animationDelay: `${0.1 * i}s`,
            animationFillMode: "both",
            flexDirection: i % 2 === 0 ? "row-reverse" : "row",
          }}
        >
          {/* Circle */}
          <div className="w-16 h-16 rounded-full bg-accent border-[3px] border-primary/40 flex items-center justify-center shadow-soft z-10 flex-shrink-0">
            <img
              src={step.icon}
              alt={step.title}
              className="w-11 h-11 object-contain"
              loading="lazy"
              width={44}
              height={44}
            />
          </div>

          {/* Text */}
          <div className={`flex-1 ${i % 2 === 0 ? "text-right" : "text-left"}`}>
            <h3 className="font-semibold text-foreground text-sm mb-0.5">{step.title}</h3>
            <p className="text-muted-foreground text-xs leading-snug">{step.description}</p>
          </div>
        </div>
      ))}

      {/* Arrow at bottom */}
      <div className="text-primary/50 text-2xl mt-2">▼</div>
    </div>
  </section>
);

export default HowItWorks;
