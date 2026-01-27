import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserGalleryItem } from "@/types/recipe";

// Fetch all gallery items for current user
export const useUserGallery = () => {
  return useQuery({
    queryKey: ["user-gallery"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        return [];
      }

      const { data, error } = await supabase
        .from("user_gallery")
        .select(`
          *,
          recipe:recipes(id, title)
        `)
        .eq("user_id", session.session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as UserGalleryItem[];
    },
  });
};

// Insert a new gallery item
export const useInsertGalleryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      recipe_id?: string;
      image_url: string;
      user_notes?: string;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error("User must be logged in to save to gallery");
      }

      const { data, error } = await supabase
        .from("user_gallery")
        .insert({
          user_id: session.session.user.id,
          recipe_id: item.recipe_id || null,
          image_url: item.image_url,
          user_notes: item.user_notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-gallery"] });
    },
  });
};

// Delete a gallery item
export const useDeleteGalleryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("user_gallery")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-gallery"] });
    },
  });
};
