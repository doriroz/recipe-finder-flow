import { useState } from "react";
import { Lightbulb, Send, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Substitution {
  original: string;
  alternative: string;
  reason: string;
}

interface ValidationResult {
  isValid: boolean;
  confidence: "high" | "medium" | "low";
  explanation: string;
  tips?: string;
}

interface UserSuggestion {
  original: string;
  suggested: string;
  result: ValidationResult | null;
  isLoading: boolean;
}

interface SubstitutionSectionProps {
  substitutions: Substitution[];
  ingredients: string[];
  recipeTitle: string;
}

const SubstitutionSection = ({ substitutions, ingredients, recipeTitle }: SubstitutionSectionProps) => {
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [suggestedReplacement, setSuggestedReplacement] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateSubstitution = async () => {
    if (!selectedIngredient || !suggestedReplacement.trim()) {
      toast.error("יש לבחור מצרך ולהקליד תחליף מוצע");
      return;
    }

    setIsValidating(true);
    
    // Add pending suggestion
    const newSuggestion: UserSuggestion = {
      original: selectedIngredient,
      suggested: suggestedReplacement.trim(),
      result: null,
      isLoading: true,
    };
    setUserSuggestions(prev => [...prev, newSuggestion]);

    try {
      const { data, error } = await supabase.functions.invoke("validate-substitution", {
        body: {
          originalIngredient: selectedIngredient,
          suggestedReplacement: suggestedReplacement.trim(),
          recipeTitle,
          recipeContext: ingredients.join(", "),
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Update the suggestion with result
      setUserSuggestions(prev => 
        prev.map((s, i) => 
          i === prev.length - 1 
            ? { ...s, result: data.result, isLoading: false }
            : s
        )
      );

      // Clear inputs
      setSelectedIngredient("");
      setSuggestedReplacement("");

    } catch (err) {
      console.error("Validation error:", err);
      toast.error("שגיאה בבדיקת ההחלפה");
      // Remove the failed suggestion
      setUserSuggestions(prev => prev.slice(0, -1));
    } finally {
      setIsValidating(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case "high": return "ודאות גבוהה";
      case "medium": return "ודאות בינונית";
      case "low": return "ודאות נמוכה";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing AI Substitutions */}
      {substitutions && substitutions.length > 0 && (
        <div className="bg-sage-light rounded-xl p-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-sage-dark">
            <span>💡</span>
            החלפות חכמות
          </h3>
          <div className="space-y-3">
            {substitutions.map((sub, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-card rounded-lg p-3 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{sub.original}</span>
                    <span className="text-muted-foreground">←</span>
                    <span className="font-medium text-secondary">{sub.alternative}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{sub.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Suggestion Section */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-foreground">
          <Lightbulb className="w-5 h-5 text-primary" />
          יש לך רעיון להחלפה?
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          בחר מצרך והצע תחליף - המערכת תבדוק האם ההחלפה תתאים למתכון
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Ingredient Select */}
          <select
            value={selectedIngredient}
            onChange={(e) => setSelectedIngredient(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isValidating}
          >
            <option value="">בחר מצרך להחלפה...</option>
            {ingredients.map((ing, i) => (
              <option key={i} value={ing}>{ing}</option>
            ))}
          </select>

          {/* Replacement Input */}
          <div className="flex-1 flex gap-2">
            <Input
              value={suggestedReplacement}
              onChange={(e) => setSuggestedReplacement(e.target.value)}
              placeholder="הקלד את התחליף המוצע..."
              disabled={isValidating}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleValidateSubstitution();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleValidateSubstitution}
              disabled={isValidating || !selectedIngredient || !suggestedReplacement.trim()}
              size="icon"
              className="shrink-0"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* User Suggestions Results */}
        {userSuggestions.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="text-sm font-medium text-muted-foreground">תוצאות הבדיקה:</h4>
            {userSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`rounded-lg p-3 border ${
                  suggestion.isLoading
                    ? "bg-muted/30 border-muted"
                    : suggestion.result?.isValid
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                }`}
              >
                {suggestion.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>בודק את ההחלפה...</span>
                  </div>
                ) : suggestion.result ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {suggestion.result.isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium text-foreground">
                        {suggestion.original}
                      </span>
                      <span className="text-muted-foreground">←</span>
                      <span className={`font-medium ${suggestion.result.isValid ? "text-green-600" : "text-red-600"}`}>
                        {suggestion.suggested}
                      </span>
                      <span className={`text-xs ${getConfidenceColor(suggestion.result.confidence)}`}>
                        ({getConfidenceText(suggestion.result.confidence)})
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.result.explanation}</p>
                    {suggestion.result.tips && (
                      <div className="flex items-start gap-2 text-sm text-primary">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{suggestion.result.tips}</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubstitutionSection;
