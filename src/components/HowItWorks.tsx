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

// Fixed pixel positions for precise alignment
const TOP_LINE_Y = 160; // center of top horizontal path
const BOTTOM_LINE_Y = 340; // center of bottom horizontal path
const ICON_SIZE = 80; // w-20 = 80px
const CONTAINER_HEIGHT = 480;

// X positions (percentage from left) for 5 steps, right-to-left order
const X_POSITIONS = [88, 70, 50, 30, 12];

const HowItWorks = () => (
  <section className="mt-20 max-w-5xl mx-auto px-4">
    <h2 className="text-2xl font-bold text-foreground text-center mb-12">
      ✨ איך זה עובד?
    </h2>

    {/* Desktop: icons ON the zig-zag path */}
    <div className="hidden md:block relative" style={{ height: `${CONTAINER_HEIGHT}px` }}>
      {/* SVG zig-zag path */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 1000 ${CONTAINER_HEIGHT}`}
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d={`M950 ${TOP_LINE_Y} L750 ${TOP_LINE_Y} Q700 ${TOP_LINE_Y} 700 ${TOP_LINE_Y + 50} L700 ${BOTTOM_LINE_Y - 50} Q700 ${BOTTOM_LINE_Y} 650 ${BOTTOM_LINE_Y} L550 ${BOTTOM_LINE_Y} Q500 ${BOTTOM_LINE_Y} 500 ${BOTTOM_LINE_Y - 50} L500 ${TOP_LINE_Y + 50} Q500 ${TOP_LINE_Y} 450 ${TOP_LINE_Y} L250 ${TOP_LINE_Y} Q200 ${TOP_LINE_Y} 200 ${TOP_LINE_Y + 50} L200 ${BOTTOM_LINE_Y - 50} Q200 ${BOTTOM_LINE_Y} 150 ${BOTTOM_LINE_Y} L50 ${BOTTOM_LINE_Y}`}
          stroke="hsl(var(--primary) / 0.35)"
          strokeWidth="50"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={`30,${BOTTOM_LINE_Y} 70,${BOTTOM_LINE_Y - 25} 70,${BOTTOM_LINE_Y + 25}`}
          fill="hsl(var(--primary) / 0.5)"
        />
      </svg>

      {/* Steps positioned with icons centered ON the path */}
      {steps.map((step, i) => {
        const isTop = i % 2 === 0;
        // Icon center aligns with the path line
        const iconCenterY = isTop ? TOP_LINE_Y : BOTTOM_LINE_Y;
        // Convert viewBox Y to percentage of container
        const iconTopPx = (iconCenterY / CONTAINER_HEIGHT) * 100;

        return (
          <div
            key={i}
            className="absolute flex flex-col items-center text-center animate-slide-up"
            style={{
              left: `${X_POSITIONS[i]}%`,
              transform: "translateX(-50%)",
              width: "160px",
              animationDelay: `${0.1 * i}s`,
              animationFillMode: "both",
              // Position the whole column so icon center lands on the line
              ...(isTop
                ? {
                    // Top steps: text above, then icon. Bottom of icon center = line
                    bottom: `${100 - iconTopPx}%`,
                    // Use flex-end so the icon (last child) aligns to bottom
                    justifyContent: "flex-end",
                    paddingBottom: `${ICON_SIZE / 2}px`,
                    top: "0",
                  }
                : {
                    // Bottom steps: icon on top, text below. Top of icon center = line  
                    top: `${iconTopPx}%`,
                    marginTop: `-${ICON_SIZE / 2}px`,
                    bottom: "0",
                  }),
            }}
          >
            {isTop && (
              <div className="mb-3">
                <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-snug">
                  {step.description}
                </p>
              </div>
            )}

            <div className="w-20 h-20 rounded-full bg-accent border-[3px] border-primary/40 flex items-center justify-center shadow-soft flex-shrink-0 relative z-10">
              <img
                src={step.icon}
                alt={step.title}
                className="w-14 h-14 object-contain"
                loading="lazy"
                width={56}
                height={56}
              />
            </div>

            {!isTop && (
              <div className="mt-3">
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
            <img
              src={step.icon}
              alt={step.title}
              className="w-11 h-11 object-contain"
              loading="lazy"
              width={44}
              height={44}
            />
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
