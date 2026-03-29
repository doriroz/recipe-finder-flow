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

    {/* Desktop: icons positioned ON the zig-zag path */}
    <div className="hidden md:block relative" style={{ height: "420px" }}>
      {/* SVG zig-zag arrow background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 420"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M950 130 L750 130 Q700 130 700 180 L700 290 Q700 340 650 340 L550 340 Q500 340 500 290 L500 180 Q500 130 450 130 L250 130 Q200 130 200 180 L200 290 Q200 340 150 340 L50 340"
          stroke="hsl(var(--primary) / 0.35)"
          strokeWidth="50"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrow head at the end (left side) */}
        <polygon
          points="30,340 70,315 70,365"
          fill="hsl(var(--primary) / 0.5)"
        />
      </svg>

      {/* Steps absolutely positioned on the path */}
      {steps.map((step, i) => {
        const isTop = i % 2 === 0;
        // X positions for 5 columns (right-to-left in a 1000-wide viewbox mapped to %)
        const xPositions = [90, 70, 50, 30, 10]; // percentage from left
        // Icons sit ON the path: top path at ~130, bottom path at ~340 in viewbox
        // Map to container: top icons centered at ~31%, bottom icons at ~81%
        const iconTop = isTop ? "28%" : "68%";

        return (
          <div
            key={i}
            className="absolute flex flex-col items-center text-center animate-slide-up"
            style={{
              left: `${xPositions[i]}%`,
              top: iconTop,
              transform: "translate(-50%, -50%)",
              width: "160px",
              animationDelay: `${0.1 * i}s`,
              animationFillMode: "both",
            }}
          >
            {/* For top steps: text above, icon below */}
            {isTop && (
              <div className="mb-2">
                <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-snug">
                  {step.description}
                </p>
              </div>
            )}

            {/* Circle with icon - sits on the path */}
            <div className="w-20 h-20 rounded-full bg-accent border-[3px] border-primary/40 flex items-center justify-center shadow-soft flex-shrink-0">
              <img
                src={step.icon}
                alt={step.title}
                className="w-14 h-14 object-contain"
                loading="lazy"
                width={56}
                height={56}
              />
            </div>

            {/* For bottom steps: text below icon */}
            {!isTop && (
              <div className="mt-2">
                <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-snug">
                  {step.description}
                </p>
              </div>
            )}
          </div>
        );
      })}
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
