import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, PenTool, ChefHat, Images, BookOpen } from "lucide-react";

const steps = [
  {
    Icon: PenTool,
    title: "1. אוספים",
    text: "מוסיפים מתכונים מהמחשב או בנייד. נעזרים ב-AI לבניית מתכונים ממרכיבים שיש לכם.",
  },
  {
    Icon: ChefHat,
    title: "2. מבשלים וחווים",
    text: "עברו למצב בישול אינטראקטיבי. עקבו אחר השלבים, צלמו את המנה, ותהנו מהחוויה!",
  },
  {
    Icon: Images,
    title: "3. מארגנים בגלריה",
    text: "כל מתכון נשמר בגלריה המשותפת. מסדרים לפי קטגוריות, מוסיפים תמונות משפחתיות.",
  },
  {
    Icon: BookOpen,
    title: "4. משמרים לדורות",
    text: "כל המתכונים נשמרים בענן. בקרוב: אופציה להזמנת ספר מודפס ומעוצב.",
  },
];

const HowItWorksModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        size="lg"
        className="w-[45%] rounded-full gap-1.5 bg-primary hover:bg-primary/90 backdrop-blur-md text-primary-foreground border border-primary-foreground/30 shadow-soft"
      >
        <HelpCircle className="w-4 h-4" />
        איך זה עובד?
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-3xl bg-card rounded-3xl p-6 md:p-8 text-center">
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-2xl md:text-3xl font-bold text-primary text-center">
              ?איך זה עובד? - המדריך המהיר
            </DialogTitle>
            <DialogDescription className="text-foreground/70 text-sm md:text-base text-center">
              4 צעדים פשוטים להפוך זיכרונות לספר בישול דיגיטלי
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-4 mt-4">
            {steps.map(({ Icon, title, text }) => (
              <div key={title} className="flex flex-col items-center text-center px-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-snug">{text}</p>
              </div>
            ))}
          </div>

          <div
            className="mt-6 w-full rounded-2xl bg-primary text-primary-foreground font-bold text-center py-4 px-6 cursor-default select-none shadow-soft"
            aria-hidden="true"
          >
            בואו נתחיל לשמר ולבשל!
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HowItWorksModal;
