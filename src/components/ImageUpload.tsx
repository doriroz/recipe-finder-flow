import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageSelect: (base64: string | null) => void;
  disabled?: boolean;
}

const ImageUpload = ({ onImageSelect, disabled }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      onImageSelect(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20">
          <img
            src={preview}
            alt="תצוגה מקדימה"
            className="w-full h-48 object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            onClick={clearImage}
            disabled={disabled}
            className="absolute top-2 left-2 h-8 w-8 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="text-white text-sm text-center">
              התמונה תישלח לזיהוי מצרכים
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-1 h-14 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5"
          >
            <Upload className="w-5 h-5 ml-2" />
            העלאת תמונה
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "environment");
                fileInputRef.current.click();
              }
            }}
            disabled={disabled}
            className="flex-1 h-14 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5"
          >
            <Camera className="w-5 h-5 ml-2" />
            צילום מצרכים
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
