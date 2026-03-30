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
    icon: iconCookbook,
    title: "יצירת ספר מתכונים אישי",
    description: "אגדו, ערכו והדפיסו את האוסף המלא שלכם",
  },
  {
    icon: iconCooking,
    title: "בישול בהנחיה",
    description: "שלב אחר שלב עד למנה מושלמת.",
  },
];

// ViewBox height = container height → Y coords map 1:1 to CSS px
const H = 480;
const TOP_Y = 150;
const BOT_Y = 330;
const ICON = 80;
const HALF = ICON / 2;
const XS = [88, 70, 50, 30, 12]; // % from left, right-to-left

const HowItWorks = () => (
  <section className="mt-20 max-w-5xl mx-auto px-4">
    <h2 className="text-2xl font-bold text-foreground text-center mb-12">
      ✨ איך זה עובד?
    </h2>

    {/* Desktop */}
    <div className="hidden md:block relative" style={{ height: H }}>
      {/* SVG zig-zag path */}
      <svg
        className="absolute inset-0 w-full pointer-events-none"
        style={{ height: H }}
        viewBox={`0 0 1000 ${H}`}
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d={`M950 ${TOP_Y} L750 ${TOP_Y} Q700 ${TOP_Y} 700 ${TOP_Y + 45} L700 ${BOT_Y - 45} Q700 ${BOT_Y} 650 ${BOT_Y} L550 ${BOT_Y} Q500 ${BOT_Y} 500 ${BOT_Y - 45} L500 ${TOP_Y + 45} Q500 ${TOP_Y} 450 ${TOP_Y} L250 ${TOP_Y} Q200 ${TOP_Y} 200 ${TOP_Y + 45} L200 ${BOT_Y - 45} Q200 ${BOT_Y} 150 ${BOT_Y} L50 ${BOT_Y}`}
          stroke="hsl(var(--primary) / 0.35)"
          strokeWidth="50"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={`30,${BOT_Y} 70,${BOT_Y - 25} 70,${BOT_Y + 25}`}
          fill="hsl(var(--primary) / 0.5)"
        />
      </svg>

      {/* Steps — each icon absolutely centred on the path line */}
      {steps.map((step, i) => {
        const isTop = i % 2 === 0;
        const cy = isTop ? TOP_Y : BOT_Y;

        return (
          <div
            key={i}
            className="absolute animate-slide-up"
            style={{
              left: `${XS[i]}%`,
              top: 0,
              width: 160,
              height: H,
              transform: "translateX(-50%)",
              animationDelay: `${0.1 * i}s`,
              animationFillMode: "both",
            }}
          >
            {/* Icon circle — centred exactly on the path */}
            <div
              className="absolute left-1/2 w-20 h-20 rounded-full bg-accent border-[3px] border-primary/40 flex items-center justify-center shadow-soft z-10"
              style={{ top: cy - HALF, transform: "translateX(-50%)" }}
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

            {/* Text block — ABOVE icon for top steps, BELOW for bottom */}
            <div
              className="absolute left-0 right-0 text-center"
              style={
                isTop
                  ? { bottom: H - cy + HALF + 8 }
                  : { top: cy + HALF + 8 }
              }
            >
              <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-xs leading-snug">
                {step.description}
              </p>
            </div>
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
