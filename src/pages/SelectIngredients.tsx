import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Sparkles, Check, Camera, Plus, ArrowRight, ChefHat, Star, Pencil, Trash2 } from "lucide-react";
import CreditCounter from "@/components/CreditCounter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { ingredients as mockIngredients, type Ingredient } from "@/data/mockData";
import { useCustomIngredients } from "@/hooks/useCustomIngredients";
import { useGenerateRecipe } from "@/hooks/useGenerateRecipe";
import { useIngredientPairings } from "@/hooks/useIngredientPairings";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsMobile } from "@/hooks/use-mobile";
import GeneratingRecipeLoader from "@/components/GeneratingRecipeLoader";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import dairyImg from "@/assets/categories/dairy.jpg";
import vegetablesImg from "@/assets/categories/vegetables.jpg";
import fruitsImg from "@/assets/categories/fruits.jpg";
import grainsImg from "@/assets/categories/grains.jpg";
import proteinsImg from "@/assets/categories/proteins.jpg";
import cannedImg from "@/assets/categories/canned.jpg";
import oilsImg from "@/assets/categories/oils.jpg";
import spicesImg from "@/assets/categories/spices.jpg";
import bakeryImg from "@/assets/categories/bakery.jpg";

interface CustomCategoryMeta {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
  hue: string;
  image_url: string | null;
}

const HUE_PALETTE = [
  { label: "כתום", value: "30 60% 82%" },
  { label: "ורוד", value: "340 55% 82%" },
  { label: "סגול", value: "270 45% 82%" },
  { label: "כחול", value: "200 55% 82%" },
  { label: "ירוק", value: "142 45% 82%" },
  { label: "צהוב", value: "48 70% 81%" },
  { label: "אדום", value: "12 60% 82%" },
  { label: "טורקיז", value: "180 50% 82%" },
];

const CATEGORY_META: Record<string, { hue: string; subtitle: string; image: string }> = {
  חלבי: { hue: "200 55% 82%", subtitle: "גבינות וחלב", image: dairyImg },
  ירקות: { hue: "142 45% 82%", subtitle: "טריים ומזינים", image: vegetablesImg },
  פירות: { hue: "340 55% 82%", subtitle: "מתוקים וצבעוניים", image: fruitsImg },
  דגנים: { hue: "48 70% 81%", subtitle: "פחמימות ואנרגיה", image: grainsImg },
  חלבונים: { hue: "32 65% 82%", subtitle: "בשר, דגים וביצים", image: proteinsImg },
  שימורים: { hue: "18 60% 81%", subtitle: "מוצרים עמידים", image: cannedImg },
  שמנים: { hue: "88 50% 81%", subtitle: "שומנים בריאים", image: oilsImg },
  תבלינים: { hue: "355 55% 82%", subtitle: "טעמים וריחות", image: spicesImg },
  מאפים: { hue: "30 60% 82%", subtitle: "טרי מהתנור", image: bakeryImg },
  אחר: { hue: "270 45% 82%", subtitle: "עוד מצרכים", image: "" },
};

// Fixed 9 categories to always render
const FIXED_CATEGORIES = ["חלבי", "ירקות", "פירות", "דגנים", "חלבונים", "שימורים", "שמנים", "תבלינים", "מאפים"];

const SelectIngredients = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [pendingSelections, setPendingSelections] = useState<Set<number>>(new Set());
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const { customIngredients } = useCustomIngredients();
  const { generateRecipe, isGenerating } = useGenerateRecipe();

  // Admin: custom categories from Supabase
  const [customCategories, setCustomCategories] = useState<CustomCategoryMeta[]>([]);
  const [customDbIngredients, setCustomDbIngredients] = useState<Ingredient[]>([]);
  // Map numeric synthetic id -> DB uuid (for admin delete)
  const [dbIngredientUuidById, setDbIngredientUuidById] = useState<Map<number, string>>(new Map());
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🍽️");
  const [newCatSubtitle, setNewCatSubtitle] = useState("");
  const [newCatHue, setNewCatHue] = useState(HUE_PALETTE[0].value);
  const [newCatImageFile, setNewCatImageFile] = useState<File | null>(null);
  const [newCatImagePreview, setNewCatImagePreview] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);

  // Inline ingredient adder (inside category dialog)
  const [newIngName, setNewIngName] = useState("");
  const [newIngEmoji, setNewIngEmoji] = useState("🥗");
  const [savingIngredient, setSavingIngredient] = useState(false);
  // "Add missing ingredient" (pending) — flow from search bar
  const [addingPending, setAddingPending] = useState(false);

  const fetchCustomCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("custom_categories")
      .select("id, name, emoji, subtitle, hue, image_url")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Failed to load custom categories:", error);
      return;
    }
    setCustomCategories((data || []) as CustomCategoryMeta[]);
  }, []);

  const fetchDbIngredients = useCallback(async () => {
    const { data, error } = await supabase.from("ingredients").select("id, name, emoji, category");
    if (error) {
      console.error("Failed to load ingredients:", error);
      return;
    }
    // Map UUID rows to numeric-id Ingredient shape (hash uuid -> stable number)
    const uuidMap = new Map<number, string>();
    const mapped: Ingredient[] = (data || []).map((row) => {
      let hash = 0;
      for (let i = 0; i < row.id.length; i++) hash = ((hash << 5) - hash + row.id.charCodeAt(i)) | 0;
      const numericId = 100000 + Math.abs(hash % 900000);
      uuidMap.set(numericId, row.id);
      return {
        id: numericId,
        name: row.name,
        emoji: row.emoji,
        category: row.category,
        popularityScore: 50,
      };
    });
    setCustomDbIngredients(mapped);
    setDbIngredientUuidById(uuidMap);
  }, []);

  useEffect(() => {
    fetchCustomCategories();
    fetchDbIngredients();
  }, [fetchCustomCategories, fetchDbIngredients]);

  const handleCategoryImagePick = (file: File | null) => {
    setNewCatImageFile(file);
    if (newCatImagePreview) URL.revokeObjectURL(newCatImagePreview);
    setNewCatImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const resetAddCategoryForm = () => {
    setEditingCategoryId(null);
    setNewCatName("");
    setNewCatEmoji("🍽️");
    setNewCatSubtitle("");
    setNewCatHue(HUE_PALETTE[0].value);
    if (newCatImagePreview) URL.revokeObjectURL(newCatImagePreview);
    setNewCatImageFile(null);
    setNewCatImagePreview(null);
  };

  const openEditCategory = (c: CustomCategoryMeta) => {
    setEditingCategoryId(c.id);
    setNewCatName(c.name);
    setNewCatEmoji(c.emoji);
    setNewCatSubtitle(c.subtitle);
    setNewCatHue(c.hue);
    setNewCatImageFile(null);
    setNewCatImagePreview(c.image_url);
    setShowAddCategoryDialog(true);
  };

  const handleDeleteCategory = async (c: CustomCategoryMeta) => {
    if (!confirm(`למחוק את הקטגוריה "${c.name}"?`)) return;
    const { error } = await supabase.from("custom_categories").delete().eq("id", c.id);
    if (error) {
      toast({ title: "שגיאה במחיקה", description: error.message, variant: "destructive" });
      return;
    }
    await fetchCustomCategories();
    toast({ title: "קטגוריה נמחקה", description: c.name });
  };

  const handleDeleteIngredient = async (ing: Ingredient) => {
    const uuid = dbIngredientUuidById.get(ing.id);
    if (!uuid) {
      toast({ title: "לא ניתן למחוק", description: "ניתן למחוק רק מצרכים שנוספו ידנית", variant: "destructive" });
      return;
    }
    if (!confirm(`למחוק את "${ing.name}"?`)) return;
    const { error } = await supabase.from("ingredients").delete().eq("id", uuid);
    if (error) {
      toast({ title: "שגיאה במחיקה", description: error.message, variant: "destructive" });
      return;
    }
    setSelected((prev) => prev.filter((s) => s.id !== ing.id));
    setPendingSelections((prev) => {
      const next = new Set(prev);
      next.delete(ing.id);
      return next;
    });
    await fetchDbIngredients();
    toast({ title: "מצרך נמחק", description: ing.name });
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) {
      toast({ title: "שם קטגוריה חסר", description: "אנא הזינו שם לקטגוריה", variant: "destructive" });
      return;
    }
    const exists =
      FIXED_CATEGORIES.includes(name) || customCategories.some((c) => c.name === name && c.id !== editingCategoryId);
    if (exists) {
      toast({ title: "קטגוריה כבר קיימת", description: name, variant: "destructive" });
      return;
    }
    setSavingCategory(true);
    try {
      let image_url: string | null = null;
      if (newCatImageFile) {
        const ext = newCatImageFile.name.split(".").pop() || "jpg";
        const path = `${user?.id || "admin"}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("category-images")
          .upload(path, newCatImageFile, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("category-images").getPublicUrl(path);
        image_url = pub.publicUrl;
      } else if (editingCategoryId) {
        // keep existing image when editing without a new file
        image_url = customCategories.find((c) => c.id === editingCategoryId)?.image_url ?? null;
      }
      if (editingCategoryId) {
        const { error: updErr } = await supabase
          .from("custom_categories")
          .update({
            name,
            emoji: newCatEmoji || "🍽️",
            subtitle: newCatSubtitle.trim() || "קטגוריה חדשה",
            hue: newCatHue,
            image_url,
          })
          .eq("id", editingCategoryId);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from("custom_categories").insert({
          name,
          emoji: newCatEmoji || "🍽️",
          subtitle: newCatSubtitle.trim() || "קטגוריה חדשה",
          hue: newCatHue,
          image_url,
          created_by: user?.id ?? null,
        });
        if (insErr) throw insErr;
      }
      await fetchCustomCategories();
      const wasEditing = !!editingCategoryId;
      resetAddCategoryForm();
      setShowAddCategoryDialog(false);
      toast({ title: wasEditing ? "קטגוריה עודכנה" : "קטגוריה נוספה", description: name });
    } catch (e: any) {
      console.error(e);
      toast({ title: "שגיאה בשמירת קטגוריה", description: e?.message || "נסו שוב", variant: "destructive" });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleAddIngredientToCategory = async () => {
    if (!openCategory) return;
    const name = newIngName.trim();
    if (!name) return;
    // Global, case-insensitive duplicate check across the whole ingredients catalog
    const lower = name.toLowerCase();
    const localDup = mockIngredients.some((i) => i.name.toLowerCase() === lower);
    if (localDup) {
      toast({ title: "מצרך זה כבר קיים", description: name, variant: "destructive" });
      return;
    }
    setSavingIngredient(true);
    try {
      const { data: existing, error: chkErr } = await supabase
        .from("ingredients")
        .select("id")
        .ilike("name", name)
        .limit(1);
      if (chkErr) throw chkErr;
      if (existing && existing.length > 0) {
        toast({ title: "מצרך זה כבר קיים", description: name, variant: "destructive" });
        setSavingIngredient(false);
        return;
      }
      const { error } = await supabase.from("ingredients").insert({
        name,
        emoji: newIngEmoji || "🥗",
        category: openCategory,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      setNewIngName("");
      setNewIngEmoji("🥗");
      await fetchDbIngredients();
      toast({ title: "מצרך נוסף", description: name });
    } catch (e: any) {
      console.error(e);
      toast({ title: "שגיאה בהוספת מצרך", description: e?.message || "נסו שוב", variant: "destructive" });
    } finally {
      setSavingIngredient(false);
    }
  };

  const allIngredients = useMemo<Ingredient[]>(() => {
    const custom = customIngredients.map((c) => ({ ...c, popularityScore: 50 }));
    const seen = new Set<number>(mockIngredients.map((i) => i.id));
    const out: Ingredient[] = [...mockIngredients];
    for (const c of [...custom, ...customDbIngredients]) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        out.push(c);
      }
    }
    return out;
  }, [customIngredients, customDbIngredients]);

  console.log("allIngredients : " + allIngredients);
  const categories = useMemo(() => Array.from(new Set(allIngredients.map((i) => i.category))), [allIngredients]);

  const { relatedCategories, pairedIngredientIds, pairingSources, hasSelection } = useIngredientPairings(
    selected,
    allIngredients,
  );

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allIngredients.filter((i) => i.name.includes(searchQuery.trim()));
  }, [allIngredients, searchQuery]);

  const handleAddPendingIngredient = useCallback(async () => {
    const name = searchQuery.trim();
    if (!name) return;
    if (!user) {
      toast({ title: "יש להתחבר", description: "התחברו כדי להוסיף מצרך חדש", variant: "destructive" });
      return;
    }
    const lower = name.toLowerCase();
    // Local catalog duplicate (mock + already-loaded DB)
    const localDup = allIngredients.some((i) => i.name.toLowerCase() === lower);
    if (localDup) {
      toast({ title: "מצרך זה כבר קיים", description: name, variant: "destructive" });
      return;
    }
    setAddingPending(true);
    try {
      // Server-side case-insensitive duplicate check across approved + pending (RLS-visible)
      const { data: existing, error: chkErr } = await supabase
        .from("ingredients")
        .select("id")
        .ilike("name", name)
        .limit(1);
      if (chkErr) throw chkErr;
      if (existing && existing.length > 0) {
        toast({ title: "מצרך זה כבר קיים", description: name, variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("ingredients").insert({
        name,
        emoji: "🥗",
        category: "ממתין לסיווג",
        status: "pending",
        created_by: user.id,
      });
      if (error) throw error;
      // Build a local-only Ingredient so the user sees it in their selected list immediately.
      // (Pending rows are not visible via RLS to non-admins, so we can't refetch.)
      const localId = 900000 + Math.floor(Math.random() * 99999);
      const localIng: Ingredient = {
        id: localId,
        name,
        emoji: "🥗",
        category: "ממתין לסיווג",
        popularityScore: 50,
      };
      setSelected((prev) => [...prev, localIng]);
      setSearchQuery("");
      toast({ title: "המצרך נוסף", description: `${name} נוסף לרשימה שלך` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "שגיאה בהוספת מצרך", description: e?.message || "נסו שוב", variant: "destructive" });
    } finally {
      setAddingPending(false);
    }
  }, [searchQuery, allIngredients, user]);

  const toggle = useCallback((ingredient: Ingredient) => {
    setSelected((prev) => {
      const exists = prev.find((i) => i.id === ingredient.id);
      return exists ? prev.filter((i) => i.id !== ingredient.id) : [...prev, ingredient];
    });
  }, []);

  const remove = useCallback((id: number) => {
    setSelected((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const openModal = useCallback(
    (cat: string) => {
      if (showImageDialog) return; // disable when camera active
      const preSelected = new Set(
        allIngredients.filter((i) => i.category === cat && selected.some((s) => s.id === i.id)).map((i) => i.id),
      );
      setPendingSelections(preSelected);
      setOpenCategory(cat);
    },
    [allIngredients, selected, showImageDialog],
  );

  const confirmSelections = useCallback(() => {
    if (!openCategory) return;
    const catIngredients = allIngredients.filter((i) => i.category === openCategory);
    catIngredients.forEach((ing) => {
      const wasSelected = selected.some((s) => s.id === ing.id);
      const isNowPending = pendingSelections.has(ing.id);
      if (!wasSelected && isNowPending) toggle(ing);
      if (wasSelected && !isNowPending) toggle(ing);
    });
    setOpenCategory(null);
    setPendingSelections(new Set());
  }, [openCategory, allIngredients, selected, pendingSelections, toggle]);

  const togglePending = useCallback((id: number) => {
    setPendingSelections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleGenerate = async () => {
    if (selected.length >= 2) {
      await generateRecipe({ ingredients: selected });
    }
  };

  const handleImageGenerate = async () => {
    if (imageBase64) {
      await generateRecipe({ imageBase64 });
      setShowImageDialog(false);
      setImageBase64(null);
    }
  };

  const canGenerate = selected.length >= 2;
  const customMetaMap = useMemo(() => {
    const m: Record<string, { hue: string; subtitle: string; image: string; emoji?: string }> = {};
    customCategories.forEach((c) => {
      m[c.name] = { hue: c.hue, subtitle: c.subtitle, image: c.image_url || "", emoji: c.emoji };
    });
    return m;
  }, [customCategories]);

  const openMeta = openCategory
    ? (CATEGORY_META[openCategory] ?? customMetaMap[openCategory] ?? { hue: "30 30% 82%", subtitle: "", image: "" })
    : null;
  const openIngredients = openCategory
    ? allIngredients
        .filter((i) => i.category === openCategory)
        .sort((a, b) => {
          // Paired ingredients float to the top
          const aPaired = pairedIngredientIds.has(a.id) ? 1 : 0;
          const bPaired = pairedIngredientIds.has(b.id) ? 1 : 0;
          if (aPaired !== bPaired) return bPaired - aPaired;
          return b.popularityScore - a.popularityScore;
        })
    : [];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background" dir="rtl">
      {isGenerating && <GeneratingRecipeLoader />}
      <header
        className="relative z-20"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(28 95% 65%) 100%)",
        }}
      >
        <div className="w-full px-0 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-primary-foreground">מה שיש</span>
            </div>
          </div>
        </div>
      </header>
      {/* bg-accent */}
      {/* bg-gradient-to-l from-primary/10 via-accent to-card */}
      <div className="flex min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-cream to-accent">
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Search bar border-border */}
          <div className="px-0 md:pt-8 flex items-center" style={{ height: "70px" }}>
            <div className="w-full">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="מה יש לכם במקרר היום?"
                    className="pr-10 rounded-2xl h-12 text-base border-primary bg-muted/30 focus:bg-card"
                  />

                  {/* Search results dropdown */}
                  {searchQuery.trim() && filteredBySearch.length > 0 && (
                    <div className="relative">
                      <div className="absolute top-2 left-0 right-0 z-50 bg-card border border-border rounded-2xl shadow-sm max-h-48 overflow-y-auto scrollbar-hide">
                        {filteredBySearch.map((ing) => {
                          const isSelected = selected.some((s) => s.id === ing.id);
                          return (
                            <button
                              key={ing.id}
                              onClick={() => {
                                toggle(ing);
                                setSearchQuery("");
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-muted/60 transition-colors",
                                isSelected && "bg-accent",
                              )}
                            >
                              <span className="text-xl">{ing.emoji}</span>
                              <span className="flex-1 text-sm font-medium text-foreground">{ing.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No results — offer to add as pending */}
                  {searchQuery.trim() && filteredBySearch.length === 0 && (
                    <div className="relative">
                      <div className="absolute top-2 left-0 right-0 z-50 bg-card border border-border rounded-2xl shadow-sm p-3">
                        <p className="text-sm text-muted-foreground mb-2 text-right">
                          לא נמצאו תוצאות עבור "{searchQuery.trim()}"
                        </p>
                        <Button
                          onClick={handleAddPendingIngredient}
                          disabled={addingPending}
                          className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 opacity-100"
                          variant="default"
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          {addingPending ? "מוסיף..." : `הוספת "${searchQuery.trim()}" לרשימה שלי`}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-2xl shrink-0 border-border bg-primary/50 hover:bg-primary"
                  onClick={() => setShowImageDialog(true)}
                  title="מצא מתכון מתמונה"
                >
                  <Camera className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bento Category Grid */}
          <main className="flex-1 overflow-y-auto scrollbar-hide pb-32 md:pb-8">
            <div className="w-full px-0 py-6">
              <h2 className="text-lg font-bold text-foreground mb-4">בחרו קטגוריה</h2>

              {/* Uniform 3x3 Grid */}
              <div
                className={cn(isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3")}
              >
                {FIXED_CATEGORIES.map((cat, idx) => {
                  const meta = CATEGORY_META[cat] ?? { hue: "30 30% 82%", subtitle: "", image: "" };
                  const catIngredients = allIngredients.filter((i) => i.category === cat);
                  const selectedCount = catIngredients.filter((i) => selected.some((s) => s.id === i.id)).length;

                  // Pairing logic
                  const isRelated = !hasSelection || relatedCategories.has(cat);
                  const isDimmed = hasSelection && !isRelated;
                  const isGlowing = hasSelection && isRelated && selectedCount === 0;
                  const isDisabledByCamera = showImageDialog;

                  return (
                    <motion.button
                      key={cat}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        //opacity: isDimmed ? 0.6 : 1,
                        y: 0,
                        scale: 1,
                        //filter: isDimmed ? "blur(2px)" : "blur(0px)",
                      }}
                      whileTap={{ scale: isDisabledByCamera ? 1 : 0.97 }}
                      transition={{
                        opacity: { duration: 0.5, ease: "easeOut" },
                        filter: { duration: 0.5, ease: "easeOut" },
                        y: { duration: 0.3, delay: idx * 0.04 },
                        scale: { type: "spring", stiffness: 260, damping: 18, bounce: 0.5 },
                      }}
                      onClick={() => openModal(cat)}
                      disabled={isDisabledByCamera}
                      className={cn(
                        "group relative rounded-2xl overflow-hidden cursor-pointer select-none",
                        "aspect-[16/9]",
                        isDisabledByCamera && "opacity-50 cursor-not-allowed",
                      )}
                      style={{
                        boxShadow: isGlowing
                          ? `0 0 28px 8px hsl(38 95% 60% / 0.55), 0 4px 16px -4px hsl(0 0% 0% / 0.15)`
                          : selectedCount > 0
                            ? `0 0 12px 2px hsl(${meta.hue} / 0.3), 0 2px 10px -2px hsl(0 0% 0% / 0.1)`
                            : "0 4px 12px -2px hsl(0 0% 0% / 0.12)",
                      }}
                    >
                      {/* Background image with zoom-on-hover */}
                      {meta.image && (
                        <img
                          src={meta.image}
                          alt={cat}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.07]"
                        />
                      )}
                      {!meta.image && <div className="absolute inset-0" style={{ background: `hsl(${meta.hue})` }} />}

                      {/* Dark gradient overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />

                      {/* Selected badge */}
                      <AnimatePresence>
                        {selectedCount > 0 && (
                          <motion.span
                            key="badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-full font-bold leading-none"
                          >
                            {selectedCount}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Glow pulse ring for matched categories */}
                      {isGlowing && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                          style={{
                            background: `radial-gradient(ellipse at center, hsl(38 95% 60% / 0.35) 0%, transparent 65%)`,
                          }}
                          animate={{ opacity: [0.4, 0.85, 0.4] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}

                      {/* Star badge: at least one paired ingredient lives in this category */}
                      {isGlowing && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          className="absolute top-3 right-3 z-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full p-1.5 shadow-lg"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </motion.div>
                      )}

                      {/* Text overlay at bottom center */}
                      <div className="absolute bottom-0 inset-x-0 z-10 flex flex-col items-center justify-end pb-3 px-3">
                        <p className="font-bold text-white text-sm leading-tight drop-shadow-md">{cat}</p>
                        <p className="text-xs text-white/80 mt-0.5 drop-shadow-sm">{meta.subtitle}</p>
                      </div>
                    </motion.button>
                  );
                })}

                {/* Custom (admin-added) categories */}
                {customCategories.map((c) => {
                  const catIngredients = allIngredients.filter((i) => i.category === c.name);
                  const selectedCount = catIngredients.filter((i) => selected.some((s) => s.id === i.id)).length;
                  return (
                    <motion.button
                      key={`custom-${c.name}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => openModal(c.name)}
                      className="group relative rounded-2xl overflow-hidden cursor-pointer select-none aspect-[16/9]"
                      style={{
                        background: `hsl(${c.hue})`,
                        boxShadow: "0 4px 12px -2px hsl(0 0% 0% / 0.12)",
                      }}
                    >
                      {c.image_url && (
                        <img
                          src={c.image_url}
                          alt={c.name}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.07]"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
                      {selectedCount > 0 && (
                        <span className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-full font-bold leading-none">
                          {selectedCount}
                        </span>
                      )}
                      {isAdmin && (
                        <div className="absolute top-2 right-2 z-20 flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditCategory(c);
                            }}
                            aria-label={`ערוך ${c.name}`}
                            className="p-1.5 rounded-full bg-white/90 hover:bg-white text-foreground shadow-md"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(c);
                            }}
                            aria-label={`מחק ${c.name}`}
                            className="p-1.5 rounded-full bg-white/90 hover:bg-destructive hover:text-destructive-foreground text-destructive shadow-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {!c.image_url && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1">
                          <span className="text-4xl leading-none drop-shadow">{c.emoji}</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 z-10 flex flex-col items-center justify-end pb-3 px-3">
                        <p className="font-bold text-white text-sm leading-tight drop-shadow-md">{c.name}</p>
                        <p className="text-xs text-white/80 mt-0.5 drop-shadow-sm">{c.subtitle}</p>
                      </div>
                    </motion.button>
                  );
                })}

                {/* Admin-only add category button */}
                {isAdmin && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer aspect-[16/9]"
                    onClick={() => setShowAddCategoryDialog(true)}
                  >
                    <Plus className="w-8 h-8" />
                    <span className="text-xs font-medium">הוסף קטגוריה</span>
                  </motion.button>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="w-72 lg:w-80 shrink-0 h-screen sticky top-0 flex flex-col order-first animate-slide-in-right">
            {/*border-border */}
            <div className="px-5 flex items-center" style={{ height: "70px" }}>
              <h2 className="font-bold text-primary text-base">המצרכים שלי</h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-1.5">
              <Button
                variant="hero"
                className="w-full"
                disabled={!canGenerate || isGenerating}
                onClick={handleGenerate}
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? "יוצר מתכון..." : "מצא לי מתכונים!"}
                {canGenerate && !isGenerating && (
                  <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs mr-1">
                    {selected.length} מצרכים
                  </span>
                )}
              </Button>
              {selected.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">בחרו מצרכים כדי להתחיל 🧑‍🍳</p>
              ) : (
                <AnimatePresence>
                  {selected.map((ing, index) => (
                    <motion.div
                      key={ing.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/60 group"
                    >
                      <span className="text-lg leading-none">{ing.emoji}</span>
                      <span className="flex-1 text-sm font-medium text-foreground">{ing.name}</span>
                      <button
                        onClick={() => remove(ing.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5"
                        aria-label={`הסר ${ing.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile floating bottom drawer */}
      {isMobile && (
        <div className="fixed bottom-16 inset-x-0 z-30 px-4 pb-3">
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-lg p-3 space-y-2">
            {selected.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {selected.map((ing) => (
                  <span
                    key={ing.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground border border-primary/20 shrink-0"
                  >
                    <span>{ing.emoji}</span>
                    <span>{ing.name}</span>
                    <button
                      onClick={() => remove(ing.id)}
                      className="mr-0.5 hover:text-destructive"
                      aria-label={`הסר ${ing.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Button variant="hero" className="w-full" disabled={!canGenerate || isGenerating} onClick={handleGenerate}>
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "יוצר מתכון..." : "מצא לי מתכונים!"}
              {canGenerate && !isGenerating && (
                <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs mr-1">
                  {selected.length} מצרכים
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Image Upload Dialog */}
      <Dialog
        open={showImageDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowImageDialog(false);
            setImageBase64(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 bg-gradient-to-l from-primary/10 to-accent/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-right">
                <Camera className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold text-foreground">מצא מתכון מתמונה</span>
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              צלמו או העלו תמונה של המצרכים שלכם ונמצא לכם מתכון מתאים
            </p>
            <ImageUpload onImageSelect={(base64) => setImageBase64(base64)} disabled={isGenerating} />
            <Button
              variant="hero"
              className="w-full"
              disabled={!imageBase64 || isGenerating}
              onClick={handleImageGenerate}
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "מחפש מתכון..." : "מצא מתכון מהתמונה"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin: Add Category Dialog */}
      <Dialog
        open={showAddCategoryDialog}
        onOpenChange={(o) => {
          if (!o) resetAddCategoryForm();
          setShowAddCategoryDialog(o);
        }}
      >
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {editingCategoryId ? "ערוך קטגוריה" : "הוסיפו קטגוריה חדשה"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 px-6 max-h-[70vh] overflow-y-auto scrollbar-hide" dir="rtl">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">שם הקטגוריה</Label>
              <Input
                id="cat-name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="לדוגמה: ממתקים"
                className="text-right"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat-emoji">אימוג'י</Label>
                <Input
                  id="cat-emoji"
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  placeholder="🍫"
                  maxLength={4}
                  className="text-right text-2xl w-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label>צבע רקע</Label>
                <div className="flex flex-wrap gap-2">
                  {HUE_PALETTE.map((h) => (
                    <button
                      key={h.value}
                      type="button"
                      title={h.label}
                      onClick={() => setNewCatHue(h.value)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all",
                        newCatHue === h.value ? "border-primary scale-110" : "border-transparent",
                      )}
                      style={{ background: `hsl(${h.value})` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-subtitle">כותרת משנה</Label>
              <Input
                id="cat-subtitle"
                value={newCatSubtitle}
                onChange={(e) => setNewCatSubtitle(e.target.value)}
                placeholder="תיאור קצר"
                className="text-right"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-image">תמונת רקע (אופציונלי)</Label>
              <Input
                id="cat-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleCategoryImagePick(e.target.files?.[0] || null)}
                className="text-right"
              />
              <div
                className="mt-2 aspect-[16/9] rounded-xl overflow-hidden relative border border-border"
                style={{ background: `hsl(${newCatHue})` }}
              >
                {newCatImagePreview ? (
                  <img src={newCatImagePreview} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">{newCatEmoji}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <p className="font-bold text-white text-sm drop-shadow">{newCatName || "שם הקטגוריה"}</p>
                  <p className="text-xs text-white/80 drop-shadow">{newCatSubtitle || "כותרת משנה"}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <Button variant="hero" onClick={handleAddCategory} disabled={savingCategory}>
              {savingCategory ? "שומר..." : editingCategoryId ? "שמור שינויים" : "הוסיפו קטגוריה"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetAddCategoryForm();
                setShowAddCategoryDialog(false);
              }}
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={!!openCategory}
        onOpenChange={(open) => {
          if (!open) {
            setOpenCategory(null);
            setPendingSelections(new Set());
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden backdrop-blur-sm">
          {openCategory && openMeta && (
            <>
              <div className="px-6 pt-6 pb-4" style={{ background: `hsl(${openMeta.hue})` }}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-foreground text-right">{openCategory}</DialogTitle>
                </DialogHeader>
              </div>

              <div className="max-h-[50vh] overflow-y-auto scrollbar-hide px-4 py-3 space-y-1">
                {openIngredients.map((ing) => {
                  const isPending = pendingSelections.has(ing.id);
                  const isPaired = pairedIngredientIds.has(ing.id);
                  const pairSource = pairingSources.get(ing.id);
                  const isDbIngredient = dbIngredientUuidById.has(ing.id);
                  return (
                    <motion.div
                      key={ing.id}
                      layout
                      initial={isPaired ? { backgroundColor: "hsl(38 95% 60% / 0.25)" } : false}
                      animate={{
                        backgroundColor: isPending
                          ? `hsl(${openMeta.hue} / 0.45)`
                          : isPaired
                            ? "hsl(38 95% 60% / 0.12)"
                            : "transparent",
                      }}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right border cursor-pointer",
                        isPending ? "border-current/30" : isPaired ? "border-primary/40" : "border-transparent",
                      )}
                      onClick={() => togglePending(ing.id)}
                      onMouseEnter={(e) => {
                        if (!isPending) e.currentTarget.style.backgroundColor = `hsl(${openMeta.hue} / 0.2)`;
                      }}
                      onMouseLeave={(e) => {
                        if (!isPending)
                          e.currentTarget.style.backgroundColor = isPaired ? "hsl(38 95% 60% / 0.12)" : "";
                      }}
                    >
                      <Checkbox checked={isPending} className="pointer-events-none" />
                      <span className="text-xl">{ing.emoji}</span>
                      <span className="flex-1 text-sm font-medium text-foreground flex items-center gap-1.5">
                        {ing.name}
                        {isPaired && (
                          <span
                            title={pairSource ? `משתלב עם ${pairSource}` : "מתאים לבחירה שלך"}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                          >
                            <Star className="w-2.5 h-2.5 fill-current" />
                            מומלץ
                          </span>
                        )}
                      </span>
                      {isAdmin && isDbIngredient && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteIngredient(ing);
                          }}
                          aria-label={`מחק ${ing.name}`}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
                {openIngredients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">אין עדיין מצרכים בקטגוריה זו</p>
                )}
              </div>

              {/* Admin inline ingredient adder */}
              {isAdmin && (
                <div className="px-4 py-3 border-t border-border bg-muted/30" dir="rtl">
                  <p className="text-xs font-bold text-foreground mb-2">הוספת מצרך לקטגוריה</p>
                  <div className="flex gap-2">
                    <Input
                      value={newIngEmoji}
                      onChange={(e) => setNewIngEmoji(e.target.value)}
                      maxLength={4}
                      className="text-center text-xl w-14 shrink-0"
                    />
                    <Input
                      value={newIngName}
                      onChange={(e) => setNewIngName(e.target.value)}
                      placeholder="שם המצרך"
                      className="text-right flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newIngName.trim()) handleAddIngredientToCategory();
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!newIngName.trim() || savingIngredient}
                      onClick={handleAddIngredientToCategory}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div
                className="px-4 pb-5 pt-3 border-t"
                style={{ background: `hsl(${openMeta.hue} / 0.15)`, borderColor: `hsl(${openMeta.hue} / 0.3)` }}
              >
                <p className="text-xs text-muted-foreground text-center mb-2">
                  {pendingSelections.size > 0 ? `נבחרו ${pendingSelections.size} מצרכים` : "בחרו מצרכים"}
                </p>
                <Button
                  className="w-full text-white font-bold"
                  disabled={pendingSelections.size === 0}
                  onClick={confirmSelections}
                  style={{
                    backgroundColor: `hsl(${openMeta.hue.replace(/\d+%$/, (m) => `${Math.max(parseInt(m) - 30, 35)}%`)})`,
                  }}
                >
                  הוסף מצרכים ({pendingSelections.size})
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelectIngredients;
