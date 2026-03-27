const steps = [
  { emoji: "🥕", title: "בחרו מצרכים", description: "סמנו מה יש לכם במקרר" },
  { emoji: "🤖", title: "AI יוצר מתכון", description: "מתכון מותאם אישית תוך שניות" },
  { emoji: "🍽️", title: "בישול בהנחיה", description: "שלב אחר שלב עד למנה מושלמת" },
];

const HowItWorks = () => (
  <section className="mt-20 max-w-4xl mx-auto">
    <h2 className="text-2xl font-bold text-foreground text-center mb-10">איך זה עובד? 🪄</h2>
    <div className="grid md:grid-cols-3 gap-8">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex flex-col items-center text-center animate-slide-up"
          style={{ animationDelay: `${0.1 * i}s`, animationFillMode: "both" }}
        >
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-4xl mb-4 shadow-soft">
            {step.emoji}
          </div>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-3">
            {i + 1}
          </div>
          <h3 className="font-semibold text-foreground text-lg mb-1">{step.title}</h3>
          <p className="text-muted-foreground text-sm">{step.description}</p>
        </div>
      ))}
    </div>
  </section>
);

export default HowItWorks;
