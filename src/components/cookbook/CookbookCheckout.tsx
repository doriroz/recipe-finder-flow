import { useState } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, MapPin, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CookbookSettings, CookbookRecipe, ExportOption } from "@/types/cookbook";
import { exportOptions } from "@/types/cookbook";
import { toast } from "@/hooks/use-toast";

interface CookbookCheckoutProps {
  settings: CookbookSettings;
  recipes: CookbookRecipe[];
  isOpen: boolean;
  onClose: () => void;
}

const CookbookCheckout = ({
  settings,
  recipes,
  isOpen,
  onClose,
}: CookbookCheckoutProps) => {
  const [selectedOption, setSelectedOption] = useState<string>("pdf");
  const [step, setStep] = useState<"select" | "shipping" | "payment" | "complete">("select");
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });

  const selectedExportOption = exportOptions.find((o) => o.id === selectedOption);
  const needsShipping = selectedOption !== "pdf";

  const handleContinue = () => {
    if (step === "select") {
      if (needsShipping) {
        setStep("shipping");
      } else {
        handleDownloadPDF();
      }
    } else if (step === "shipping") {
      if (!shippingInfo.fullName || !shippingInfo.address || !shippingInfo.city) {
        toast({
          title: "חסרים פרטים",
          description: "נא למלא את כל השדות הנדרשים",
          variant: "destructive",
        });
        return;
      }
      setStep("payment");
    }
  };

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    // Simulate PDF generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setStep("complete");
    toast({
      title: "ה-PDF מוכן!",
      description: "הספר שלך מוכן להורדה",
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setStep("complete");
    toast({
      title: "ההזמנה התקבלה!",
      description: "נשלח לך עדכון כשהספר יישלח",
    });
  };

  const renderContent = () => {
    switch (step) {
      case "select":
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-center mb-6">
              בחרו את הפורמט הרצוי לספר "{settings.title}"
            </p>
            
            <div className="space-y-3">
              {exportOptions.map((option) => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full p-4 rounded-xl border-2 text-right transition-all ${
                    selectedOption === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{option.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">
                          {option.name}
                        </h4>
                        <span className="font-bold text-primary">
                          {option.price === 0 ? "חינם" : `₪${option.price}`}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                    {selectedOption === option.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">סה״כ לתשלום:</span>
                <span className="text-2xl font-bold text-primary">
                  {selectedExportOption?.price === 0
                    ? "חינם"
                    : `₪${selectedExportOption?.price}`}
                </span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleContinue}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    מעבד...
                  </>
                ) : needsShipping ? (
                  "המשך לפרטי משלוח"
                ) : (
                  <>
                    <Download className="w-4 h-4 ml-2" />
                    הורד PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case "shipping":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">פרטי משלוח</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">שם מלא</Label>
                <Input
                  id="fullName"
                  value={shippingInfo.fullName}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, fullName: e.target.value })
                  }
                  placeholder="ישראל ישראלי"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">כתובת</Label>
                <Input
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, address: e.target.value })
                  }
                  placeholder="רחוב הדוגמה 123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">עיר</Label>
                  <Input
                    id="city"
                    value={shippingInfo.city}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, city: e.target.value })
                    }
                    placeholder="תל אביב"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">מיקוד</Label>
                  <Input
                    id="postalCode"
                    value={shippingInfo.postalCode}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, postalCode: e.target.value })
                    }
                    placeholder="1234567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  value={shippingInfo.phone}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, phone: e.target.value })
                  }
                  placeholder="050-1234567"
                />
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleContinue}>
              המשך לתשלום
            </Button>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">פרטי תשלום</h3>
            </div>

            {/* Stripe-like payment form UI */}
            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">מספר כרטיס</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">תוקף</Label>
                  <Input id="expiry" placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{selectedExportOption?.name}</span>
                <span>₪{selectedExportOption?.price}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">משלוח</span>
                <span>₪25</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-border">
                <span>סה״כ</span>
                <span className="text-primary">
                  ₪{(selectedExportOption?.price || 0) + 25}
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  מעבד תשלום...
                </>
              ) : (
                `שלם ₪${(selectedExportOption?.price || 0) + 25}`
              )}
            </Button>
          </div>
        );

      case "complete":
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-primary" />
            </motion.div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {needsShipping ? "ההזמנה התקבלה!" : "הספר מוכן!"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {needsShipping
                ? "נשלח לך אימייל עם פרטי המשלוח"
                : "לחץ להורדת ה-PDF"}
            </p>
            {!needsShipping && (
              <Button size="lg" className="gap-2">
                <Download className="w-4 h-4" />
                הורד PDF
              </Button>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === "complete" ? "🎉" : "סיום והדפסה"}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default CookbookCheckout;
