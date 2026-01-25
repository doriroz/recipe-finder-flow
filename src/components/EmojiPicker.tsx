import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FOOD_EMOJIS = [
  // Fruits
  "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝",
  // Vegetables
  "🍅", "🥕", "🥔", "🌽", "🌶️", "🫑", "🥒", "🥬", "🥦", "🧅", "🧄", "🍆", "🥑", "🫛", "🥗",
  // Proteins
  "🥚", "🍗", "🍖", "🥩", "🐟", "🦐", "🦑", "🦀", "🥓",
  // Dairy & Cheese
  "🧀", "🥛", "🧈", "🍦",
  // Grains & Bread
  "🍞", "🥖", "🥐", "🥯", "🥨", "🌾", "🍚", "🍝",
  // Prepared Foods
  "🍳", "🥘", "🍲", "🥣", "🍜", "🍛", "🍱", "🍣", "🥙", "🌮", "🌯", "🥪", "🍕", "🍔", "🥧",
  // Condiments & Others
  "🫒", "🥜", "🌰", "🍯", "🧂", "🫚", "🧁", "🍰", "🍫", "☕", "🍵",
];

interface EmojiPickerProps {
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

const EmojiPicker = ({ selectedEmoji, onSelect, disabled }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className={cn(
            "h-12 w-12 text-2xl rounded-xl border-2 border-dashed border-border",
            "hover:border-primary/50 hover:bg-primary/5 transition-all",
            open && "border-primary bg-primary/5"
          )}
          title="בחר אימוג'י"
        >
          {selectedEmoji}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-3 bg-card border border-border z-50" 
        align="start"
        side="bottom"
      >
        <div className="mb-2 text-sm font-medium text-muted-foreground text-right">
          בחרו אימוג'י למצרך
        </div>
        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {FOOD_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              className={cn(
                "h-8 w-8 flex items-center justify-center text-xl rounded-lg",
                "hover:bg-accent transition-colors cursor-pointer",
                selectedEmoji === emoji && "bg-primary/20 ring-2 ring-primary/50"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
