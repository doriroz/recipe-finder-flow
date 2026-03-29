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
    position: "top" as const,
  },
  {
    icon: iconCuisines,
    title: "מתכונים פופולאריים לפי מטבחים",
    description: "חקרו טעמים עולמיים וגלו מתכונים אהובים ממטבחים שונים.",
    position: "bottom" as const,
  },
  {
    icon: iconAiRobot,
    title: "AI יוצר מתכון",
    description: "מתכון מותאם אישית תוך שניות",
    position: "top" as const,
  },
  {
    icon: iconCooking,
    title: "בישול בהנחיה",
    description: "שלב אחר שלב עד למנה מושלמת.",
    position: "bottom" as const,
  },
  {
    icon: iconCookbook,
    title: "יצירת ספר מתכונים אישי",
    description: "אגדו, ערכו והדפיסו את האוסף המלא שלכם",
    position: "top" as const,
  },
];

// Layout constants
const W = 1000;
const H = 420;
const TOP = 120;   // y-center for top nodes
const BOT = 300;   // y-center for bottom nodes
const ICON = 80;

// X positions right-to-left: node 1 → node 5
const nodeX = [850, 675, 500, 325, 150];

const HowItWorks = () => (
  <section className="mt-20 max-w-5xl mx-auto px-4">
    <h2 className="text-2xl font-bold text-foreground text-center mb-12">
      ✨ איך זה עובד?
    </h2>

    {/* Desktop */}
    <div className="hidden md:block relative" style={{ height: H }}>
      <svg
        className="absolute inset-0 w-full pointer-events-none"
        style={{ height: H }}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Smooth S-curve path flowing right to left through all 5 nodes */}
        <path
          d={`
            M ${nodeX[0]} ${TOP}
            C ${nodeX[0] - 60} ${TOP}, ${nodeX[1] + 60} ${BOT}, ${nodeX[1]} ${BOT}
            C ${nodeX[1] - 60} ${BOT}, ${nodeX[2] + 60} ${TOP}, ${nodeX[2]} ${TOP}
            C ${nodeX[2] - 60} ${TOP}, ${nodeX[3] + 60} ${BOT}, ${nodeX[3]} ${BOT}
            C ${nodeX[3] - 60} ${BOT}, ${nodeX[4] + 60} ${TOP}, ${nodeX[4]} ${TOP}
          `}
          stroke="hsl(var(--primary) / 0.35)"
          strokeWidth="46"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrow at the end (left) */}
        <polygon
          points={`${nodeX[4] - 40},${TOP} ${nodeX[4] - 10},${TOP - 22} ${nodeX[4] - 10},${TOP + 22}`}
          fill="hsl(var(--primary) / 0.5)"
        />
      </svg>

      {/* Nodes */}
      {steps.map((step, i) => {
        const cx = nodeX[i];
        const cy = step.position === "top" ? TOP : BOT;
        const isTop = step.position === "top";

        return (
          <div
            key={i}
            className="absolute animate-slide-up"
            style={{
              left: (cx / W) * 100 + "%",
              top: cy,
              transform: "translate(-50%, -50%)",
              width: 170,
              animationDelay: `${0.1 * i}s`,
              animationFillMode: "both",
            }}
          >
            {/* Text ABOVE for top nodes */}
            {isTop && (
              <div
                className="absolute left-1/2 -translate-x-1/2 text-center w-44"
                style={{ bottom: ICON / 2 + 10 }}
              >
                <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-snug">
                  {step.description}
                </p>
              </div>
            )}

            {/* Icon circle — centred on the path */}
            <div
              className="relative left-1/2 -translate-x-1/2 rounded-full bg-accent border-[3px] border-primary/40 flex items-center justify-center shadow-soft z-10"
              style={{ width: ICON, height: ICON }}
            >
              <img
                src={step.icon}
                alt={step.title}
                className="w-14 h-14 object-contain"
                loading="lazy"
                width={56}
                height={56}
              />
            </div>

            {/* Text BELOW for bottom nodes */}
            {!isTop && (
              <div
                className="absolute left-1/2 -translate-x-1/2 text-center w-44"
                style={{ top: ICON / 2 + 10 }}
              >
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
          <div className="w-16 h-16 rounded-full bg-accent border-[3px] border-primary/40 flex items-center justify-center shadow-soft z-10 flex-shrink-0">
            <img src={step.icon} alt={step.title} className="w-11 h-11 object-contain" loading="lazy" width={44} height={44} />
          </div>
          <div className={`flex-1 ${i % 2 === 0 ? "text-right" : "text-left"}`}>
            <h3 className="font-semibold text-foreground text-sm mb-0.5">{step.title}</h3>
            <p className="text-muted-foreground text-xs leading-snug">{step.description}</p>
          </div>
        </div>
      ))}
      <div className="text-primary/50 text-2xl mt-2">▼</div>
    </div>
  </section>
);

export default HowItWorks;
