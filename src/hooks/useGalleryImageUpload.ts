import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useGalleryImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (base64Image: string, userId: string): Promise<string> => {
    setIsUploading(true);
    
    try {
      // Convert base64 to blob
      const base64Data = base64Image.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      // Generate unique filename
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("gallery-images")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("gallery-images")
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
};
