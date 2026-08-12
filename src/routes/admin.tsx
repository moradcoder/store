import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, Eye, EyeOff,
  Search, X, Save, Image as ImageIcon,
  Package, ShoppingBag, Users, Star, Tag,
  Layers, Palette, Ruler, Truck, Percent,
  MessageSquare, Mail, Settings, LogOut,
  Home, ShoppingCart, User, Award,
  Clock, AlertCircle, CheckCircle, XCircle,
  Menu, Upload, Video, FileImage, RefreshCw,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n, statusKey } from "@/lib/i18n";
import { fetchCategories, fetchColors, fetchProducts, fetchSizes, fetchZones } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم - دار الأناقة | Dashboard" },
      { name: "description", content: "إدارة كاملة للمتجر" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

// ============================================
// TYPES
// ============================================

type AdminTab = "dashboard" | "products" | "orders" | "customers" | "reviews" | "coupons" | "zones" | "catalog";

// ============================================
// COMPOSANT DE CHANGEMENT DE LANGUE
// ============================================

// ✅ استبدل الكود القديم بهذا الكود الصحيح

function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();  // ✅ استخدم lang و setLang
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}  // ✅ استخدم setLang
      className="flex items-center gap-2"
    >
      <Globe className="h-4 w-4" />
      {lang === 'ar' ? 'Français' : 'العربية'}
    </Button>
  );
}

// ============================================
// COMPOSANTS D'ÉDITION AVEC TRADUCTION
// ============================================

// --- Éditeur de Produit ---
function ProductEditor({
  product,
  onSave,
  onCancel,
  categories,
  colors,
  sizes
}: {
  product?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  categories: any[];
  colors: any[];
  sizes: any[];
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    id: product?.id || undefined,
    name_ar: product?.name_ar || "",
    name_fr: product?.name_fr || "",
    description_ar: product?.description_ar || "",
    description_fr: product?.description_fr || "",
    price: product?.price || 0,
    old_price: product?.old_price || null,
    category_id: product?.category_id || "",
    featured: product?.featured || false,
    is_new: product?.is_new || false,
    best_seller: product?.best_seller || false,
    active: product?.active !== undefined ? product.active : true,
    slug: product?.slug || "",
    sku: product?.sku || "",
  });
  const [images, setImages] = useState<string[]>(product?.product_images?.map((img: any) => img.url) || []);
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<any[]>(product?.product_variants || []);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImages([...images, publicUrl]);
      toast.success(t("imageUploaded"));
    } catch (error: any) {
      toast.error(t("imageUploadFailed") + ": " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug && form.name_ar) {
      form.slug = generateSlug(form.name_ar);
    }
    setLoading(true);
    await onSave({
      ...form,
      images: images.filter(Boolean),
      variants,
    });
    setLoading(false);
  };

  const addVariant = () => {
    setVariants([...variants, { color_id: "", size_id: "", stock: 0 }]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[85vh] overflow-y-auto p-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">📋 {t("productInfo")}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("nameAr")} *</Label>
            <Input
              value={form.name_ar}
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, name_ar: val });
                if (!form.slug) {
                  setForm(prev => ({ ...prev, slug: generateSlug(val) }));
                }
              }}
              required
              placeholder={t("productNameAr")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("nameFr")} *</Label>
            <Input
              value={form.name_fr}
              onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
              required
              placeholder={t("productNameFr")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("descriptionAr")}</Label>
          <Textarea
            value={form.description_ar}
            onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
            rows={3}
            placeholder={t("descriptionArPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("descriptionFr")}</Label>
          <Textarea
            value={form.description_fr}
            onChange={(e) => setForm({ ...form, description_fr: e.target.value })}
            rows={3}
            placeholder={t("descriptionFrPlaceholder")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">💰 {t("price")}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("priceMAD")} *</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
              required
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("oldPriceMAD")}</Label>
            <Input
              type="number"
              step="0.01"
              value={form.old_price || ""}
              onChange={(e) => setForm({ ...form, old_price: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">📂 {t("category")}</h3>
        <Select
          value={form.category_id}
          onValueChange={(v) => setForm({ ...form, category_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">🖼️ {t("productImages")}</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 ml-2" />
            {uploading ? t("uploading") : t("uploadImage")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img}
                alt={`${t("image")} ${i + 1}`}
                className="h-20 w-20 object-cover rounded border"
              />
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition"
                onClick={() => setImages(images.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">📦 {t("stock")}</h3>
          <Button type="button" size="sm" onClick={addVariant}>
            <Plus className="h-4 w-4 ml-1" /> {t("addOption")}
          </Button>
        </div>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-end bg-secondary/30 p-3 rounded-lg">
              <div className="flex-1 min-w-[100px]">
                <Label className="text-xs">{t("color")}</Label>
                <Select
                  value={v.color_id}
                  onValueChange={(val) => updateVariant(i, "color_id", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select")} />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex }} />
                          {c.name_ar}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[80px]">
                <Label className="text-xs">{t("size")}</Label>
                <Select
                  value={v.size_id}
                  onValueChange={(val) => updateVariant(i, "size_id", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select")} />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[100px]">
                <Label className="text-xs">{t("stock")}</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, "stock", parseInt(e.target.value) || 0)}
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="self-end"
                onClick={() => removeVariant(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {variants.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noOptionsAdded")}</p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">👁️ {t("productVisibility")}</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-secondary/30">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span>🟢 {t("productActive")}</span>
          </label>
          <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-secondary/30">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            <span>⭐ {t("productFeatured")}</span>
          </label>
          <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-secondary/30">
            <input
              type="checkbox"
              checked={form.is_new}
              onChange={(e) => setForm({ ...form, is_new: e.target.checked })}
            />
            <span>🆕 {t("productNew")}</span>
          </label>
          <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-secondary/30">
            <input
              type="checkbox"
              checked={form.best_seller}
              onChange={(e) => setForm({ ...form, best_seller: e.target.checked })}
            />
            <span>🔥 {t("productBestSeller")}</span>
          </label>
        </div>
      </div>

      <details className="space-y-2 border rounded-lg p-4 bg-secondary/10">
        <summary className="font-medium cursor-pointer">⚙️ {t("advancedOptions")}</summary>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="space-y-2">
            <Label>{t("slug")}</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder={t("autoGenerated")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("sku")}</Label>
            <Input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
              placeholder={t("skuPlaceholder")}
            />
          </div>
        </div>
      </details>

      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? t("saving") : "💾 " + t("save")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

// --- Éditeur de Catégorie ---
function CategoryEditor({ category, onSave, onCancel }: { category?: any; onSave: (data: any) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    id: category?.id || undefined,
    name_ar: category?.name_ar || "",
    name_fr: category?.name_fr || "",
    image_url: category?.image_url || "",
    position: category?.position || 0,
    active: category?.active !== undefined ? category.active : true,
    slug: category?.slug || "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath);

      setForm({ ...form, image_url: publicUrl });
      toast.success(t("imageUploaded"));
    } catch (error: any) {
      toast.error(t("imageUploadFailed") + ": " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = '';
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("nameAr")} *</Label>
          <Input
            value={form.name_ar}
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, name_ar: val });
              if (!form.slug) {
                setForm(prev => ({ ...prev, slug: generateSlug(val) }));
              }
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("nameFr")} *</Label>
          <Input
            value={form.name_fr}
            onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("categoryImage")}</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 ml-2" />
            {uploading ? t("uploading") : t("uploadImage")}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          {form.image_url && (
            <img src={form.image_url} alt="" className="h-12 w-12 object-cover rounded" />
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("position")}</Label>
          <Input
            type="number"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("active")}</Label>
          <div className="pt-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
          </div>
        </div>
      </div>
      <details className="border rounded-lg p-3">
        <summary className="cursor-pointer text-sm">⚙️ {t("advancedOptions")}</summary>
        <div className="pt-2">
          <Label className="text-xs">{t("slug")}</Label>
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
          />
        </div>
      </details>
      <div className="flex gap-2">
        <Button type="submit">💾 {t("save")}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

// --- Éditeur de Couleur ---
function ColorEditor({ color, onSave, onCancel }: { color?: any; onSave: (data: any) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    id: color?.id || undefined,
    name_ar: color?.name_ar || "",
    name_fr: color?.name_fr || "",
    hex: color?.hex || "#000000",
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("nameAr")} *</Label>
          <Input
            value={form.name_ar}
            onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("nameFr")} *</Label>
          <Input
            value={form.name_fr}
            onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("hexCode")} *</Label>
        <div className="flex gap-2 items-center">
          <Input
            value={form.hex}
            onChange={(e) => setForm({ ...form, hex: e.target.value })}
            required
          />
          <div className="w-10 h-10 rounded border" style={{ backgroundColor: form.hex }} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">💾 {t("save")}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

// --- Éditeur de Taille ---
function SizeEditor({ size, onSave, onCancel }: { size?: any; onSave: (data: any) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    id: size?.id || undefined,
    label: size?.label || "",
    position: size?.position || 0,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>{t("sizeLabel")} *</Label>
        <Input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value.toUpperCase() })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{t("position")}</Label>
        <Input
          type="number"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">💾 {t("save")}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

// --- Éditeur de Zone de Livraison ---
function ZoneEditor({ zone, onSave, onCancel }: { zone?: any; onSave: (data: any) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    id: zone?.id || undefined,
    name_ar: zone?.name_ar || "",
    name_fr: zone?.name_fr || "",
    fee: zone?.fee || 0,
    eta_ar: zone?.eta_ar || "",
    eta_fr: zone?.eta_fr || "",
    active: zone?.active !== undefined ? zone.active : true,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("nameAr")} *</Label>
          <Input
            value={form.name_ar}
            onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("nameFr")} *</Label>
          <Input
            value={form.name_fr}
            onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("deliveryFeeMAD")} *</Label>
          <Input
            type="number"
            step="0.01"
            value={form.fee}
            onChange={(e) => setForm({ ...form, fee: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("status")}</Label>
          <div className="pt-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span className="mr-2">{t("active")}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("etaAr")}</Label>
          <Input
            value={form.eta_ar}
            onChange={(e) => setForm({ ...form, eta_ar: e.target.value })}
            placeholder={t("etaArPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("etaFr")}</Label>
          <Input
            value={form.eta_fr}
            onChange={(e) => setForm({ ...form, eta_fr: e.target.value })}
            placeholder={t("etaFrPlaceholder")}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">💾 {t("save")}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

// --- Éditeur de Coupon ---
function CouponEditor({ coupon, onSave, onCancel }: { coupon?: any; onSave: (data: any) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    id: coupon?.id || undefined,
    code: coupon?.code || "",
    type: coupon?.type || "percent",
    value: coupon?.value || 0,
    min_order: coupon?.min_order || 0,
    usage_limit: coupon?.usage_limit || null,
    expires_at: coupon?.expires_at || "",
    active: coupon?.active !== undefined ? coupon.active : true,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("couponCode")} *</Label>
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
            placeholder={t("couponCodePlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("discountType")} *</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm({ ...form, type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">{t("percent")}</SelectItem>
              <SelectItem value="fixed">{t("fixedAmount")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("discountValue")} *</Label>
          <Input
            type="number"
            step="0.01"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("minOrderMAD")}</Label>
          <Input
            type="number"
            step="0.01"
            value={form.min_order}
            onChange={(e) => setForm({ ...form, min_order: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("usageLimit")}</Label>
          <Input
            type="number"
            value={form.usage_limit || ""}
            onChange={(e) => setForm({ ...form, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("expiryDate")}</Label>
          <Input
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("status")}</Label>
        <div className="pt-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          <span className="mr-2">{t("active")}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">💾 {t("save")}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

function AdminDashboard() {
  const { t, pick, money, locale, setLocale } = useI18n();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // États pour les dialogues
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingColor, setEditingColor] = useState<any>(null);
  const [editingSize, setEditingSize] = useState<any>(null);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirection si non admin
  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [loading, isAdmin, navigate]);

  // Fonction pour forcer le rafraîchissement des données
  const refreshAllData = async () => {
    setIsRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["admin-orders"] });
    await qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    await qc.invalidateQueries({ queryKey: ["admin-products"] });
    await qc.invalidateQueries({ queryKey: ["admin-categories"] });
    await qc.invalidateQueries({ queryKey: ["admin-colors"] });
    await qc.invalidateQueries({ queryKey: ["admin-sizes"] });
    await qc.invalidateQueries({ queryKey: ["admin-zones"] });
    await qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    toast.success(t("dataUpdated"));
    setIsRefreshing(false);
  };

  // ============================================
  // REQUÊTES
  // ============================================

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products", searchTerm],
    enabled: isAdmin,
    queryFn: async () => {
      console.log("🔍 جلب المنتجات...");
      try {
        let q = supabase
          .from("products")
          .select(`
            *,
            category:categories(id,name_ar,name_fr),
            product_images(id,url,position),
            product_variants(
              id,color_id,size_id,stock,
              colors(id,name_ar,name_fr,hex),
              sizes(id,label,position)
            )
          `)
          .order("created_at", { ascending: false });

        if (searchTerm) {
          q = q.or(`name_ar.ilike.%${searchTerm}%,name_fr.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
        }

        const { data, error } = await q;
        
        if (error) {
          console.error("❌ خطأ في جلب المنتجات:", error);
          throw error;
        }
        
        console.log("✅ تم جلب المنتجات:", data?.length || 0);
        return data ?? [];
      } catch (err) {
        console.error("❌ استثناء في جلب المنتجات:", err);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    enabled: isAdmin,
    queryFn: async () => {
      console.log("🔍 جلب التصنيفات...");
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("position", { ascending: true });
        
        if (error) {
          console.error("❌ خطأ في جلب التصنيفات:", error);
          throw error;
        }
        
        console.log("✅ تم جلب التصنيفات:", data?.length || 0);
        return data ?? [];
      } catch (err) {
        console.error("❌ استثناء في جلب التصنيفات:", err);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: colors = [] } = useQuery({
    queryKey: ["admin-colors"],
    enabled: isAdmin,
    queryFn: async () => {
      console.log("🔍 جلب الألوان...");
      try {
        const { data, error } = await supabase
          .from("colors")
          .select("*")
          .order("name_ar", { ascending: true });
        
        if (error) {
          console.error("❌ خطأ في جلب الألوان:", error);
          throw error;
        }
        
        console.log("✅ تم جلب الألوان:", data?.length || 0);
        return data ?? [];
      } catch (err) {
        console.error("❌ استثناء في جلب الألوان:", err);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["admin-sizes"],
    enabled: isAdmin,
    queryFn: async () => {
      console.log("🔍 جلب المقاسات...");
      try {
        const { data, error } = await supabase
          .from("sizes")
          .select("*")
          .order("position", { ascending: true });
        
        if (error) {
          console.error("❌ خطأ في جلب المقاسات:", error);
          throw error;
        }
        
        console.log("✅ تم جلب المقاسات:", data?.length || 0);
        return data ?? [];
      } catch (err) {
        console.error("❌ استثناء في جلب المقاسات:", err);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["admin-zones"],
    enabled: isAdmin,
    queryFn: async () => {
      console.log("🔍 جلب مناطق التوصيل...");
      try {
        const { data, error } = await supabase
          .from("delivery_zones")
          .select("*")
          .order("name_ar", { ascending: true });
        
        if (error) {
          console.error("❌ خطأ في جلب مناطق التوصيل:", error);
          throw error;
        }
        
        console.log("✅ تم جلب مناطق التوصيل:", data?.length || 0);
        return data ?? [];
      } catch (err) {
        console.error("❌ استثناء في جلب مناطق التوصيل:", err);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons"],
    enabled: isAdmin,
    queryFn: async () => {
      console.log("🔍 جلب العروض...");
      try {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("❌ خطأ في جلب العروض:", error);
          throw error;
        }
        
        console.log("✅ تم جلب العروض:", data?.length || 0);
        return data ?? [];
      } catch (err) {
        console.error("❌ استثناء في جلب العروض:", err);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    enabled: isAdmin,
    queryFn: async () => {
      console.log("🔍 جلب الطلبات...");
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        
        if (error) {
          console.error("❌ خطأ في جلب الطلبات:", error);
          throw error;
        }
        
        console.log("✅ تم جلب الطلبات:", data?.length || 0);
        return data ?? [];
      } catch (err) {
        console.error("❌ استثناء في جلب الطلبات:", err);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

// 🔧 استبدال استعلام التقييمات في admin.tsx

const { data: reviews = [] } = useQuery({
  queryKey: ["admin-reviews"],
  enabled: isAdmin,
  queryFn: async () => {
    console.log("🔍 جلب التقييمات للـ Admin...");
    try {
      // ✅ استعلام مبسط بدون JOIN معقد
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) {
        console.error("❌ خطأ في جلب التقييمات:", error);
        throw error;
      }
      
      console.log("✅ تم جلب التقييمات:", data?.length || 0);
      return data ?? [];
    } catch (err) {
      console.error("❌ استثناء في جلب التقييمات:", err);
      return [];
    }
  },
  retry: 3,
  retryDelay: 1000,
});

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const saveProduct = async (data: any) => {
    try {
      let productId = data.id;

      const { data: product, error } = await supabase
        .from("products")
        .upsert({
          id: productId,
          slug: data.slug,
          sku: data.sku,
          name_ar: data.name_ar,
          name_fr: data.name_fr,
          description_ar: data.description_ar,
          description_fr: data.description_fr,
          price: data.price,
          old_price: data.old_price,
          category_id: data.category_id,
          featured: data.featured,
          is_new: data.is_new,
          best_seller: data.best_seller,
          active: data.active,
        })
        .select("id")
        .single();

      if (error) throw error;
      productId = product.id;

      if (data.images?.length) {
        await supabase.from("product_images").delete().eq("product_id", productId);
        await supabase.from("product_images").insert(
          data.images.map((url: string, i: number) => ({
            product_id: productId,
            url,
            position: i,
          }))
        );
      }

      if (data.variants?.length) {
        await supabase.from("product_variants").delete().eq("product_id", productId);
        await supabase.from("product_variants").insert(
          data.variants.map((v: any) => ({
            product_id: productId,
            color_id: v.color_id,
            size_id: v.size_id,
            stock: v.stock || 0,
          }))
        );
      }

      toast.success(t("productSaved"));
      await qc.invalidateQueries({ queryKey: ["admin-products"] });
      setDialogOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      toast.error(t("error") + ": " + err.message);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm(t("confirmDeleteProduct"))) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("productDeleted"));
      await qc.invalidateQueries({ queryKey: ["admin-products"] });
    }
  };

  const saveCategory = async (data: any) => {
    const { error } = await supabase
      .from("categories")
      .upsert({ id: data.id, ...data });

    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("categorySaved"));
      await qc.invalidateQueries({ queryKey: ["admin-categories"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
      setDialogOpen(false);
      setEditingCategory(null);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm(t("confirmDeleteCategory"))) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("categoryDeleted"));
      await qc.invalidateQueries({ queryKey: ["admin-categories"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
    }
  };

  const saveColor = async (data: any) => {
    const { error } = await supabase
      .from("colors")
      .upsert({ id: data.id, ...data });

    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("colorSaved"));
      await qc.invalidateQueries({ queryKey: ["admin-colors"] });
      await qc.invalidateQueries({ queryKey: ["colors"] });
      setDialogOpen(false);
      setEditingColor(null);
    }
  };

  const deleteColor = async (id: string) => {
    if (!confirm(t("confirmDeleteColor"))) return;
    const { error } = await supabase.from("colors").delete().eq("id", id);
    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("colorDeleted"));
      await qc.invalidateQueries({ queryKey: ["admin-colors"] });
      await qc.invalidateQueries({ queryKey: ["colors"] });
    }
  };

  const saveSize = async (data: any) => {
    const { error } = await supabase
      .from("sizes")
      .upsert({ id: data.id, ...data });

    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("sizeSaved"));
      await qc.invalidateQueries({ queryKey: ["admin-sizes"] });
      await qc.invalidateQueries({ queryKey: ["sizes"] });
      setDialogOpen(false);
      setEditingSize(null);
    }
  };

  const deleteSize = async (id: string) => {
    if (!confirm(t("confirmDeleteSize"))) return;
    const { error } = await supabase.from("sizes").delete().eq("id", id);
    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("sizeDeleted"));
      await qc.invalidateQueries({ queryKey: ["admin-sizes"] });
      await qc.invalidateQueries({ queryKey: ["sizes"] });
    }
  };

  const saveZone = async (data: any) => {
    const { error } = await supabase
      .from("delivery_zones")
      .upsert({ id: data.id, ...data });

    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("zoneSaved"));
      await qc.invalidateQueries({ queryKey: ["admin-zones"] });
      await qc.invalidateQueries({ queryKey: ["zones"] });
      setDialogOpen(false);
      setEditingZone(null);
    }
  };

  const deleteZone = async (id: string) => {
    if (!confirm(t("confirmDeleteZone"))) return;
    const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("zoneDeleted"));
      await qc.invalidateQueries({ queryKey: ["admin-zones"] });
      await qc.invalidateQueries({ queryKey: ["zones"] });
    }
  };

  const saveCoupon = async (data: any) => {
    const { error } = await supabase
      .from("coupons")
      .upsert({ id: data.id, ...data });

    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("couponSaved"));
      await qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDialogOpen(false);
      setEditingCoupon(null);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm(t("confirmDeleteCoupon"))) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("couponDeleted"));
      await qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("orderStatusUpdated"));
      await qc.invalidateQueries({ queryKey: ["admin-orders"] });
    }
  };

  const toggleReviewApproval = async (id: string, approved: boolean) => {
    const { error } = await supabase.from("reviews").update({ approved }).eq("id", id);
    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(approved ? t("reviewApproved") : t("reviewRejected"));
      await qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm(t("confirmDeleteReview"))) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) toast.error(t("error") + ": " + error.message);
    else {
      toast.success(t("reviewDeleted"));
      await qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    }
  };

  // ============================================
  // STATISTIQUES
  // ============================================

  const stats = {
    products: products.length,
    categories: categories.length,
    orders: orders.length,
    revenue: orders
      .filter((o: any) => !["cancelled", "returned"].includes(o.status))
      .reduce((s: number, o: any) => s + Number(o.total), 0),
    reviews: reviews.length,
    pendingReviews: reviews.filter((r: any) => !r.approved).length,
    pendingOrders: orders.filter((o: any) => o.status === "pending").length,
    customers: new Set(orders.map((o: any) => o.user_id).filter(Boolean)).size,
    lowStock: products.filter((p: any) => {
      const totalStock = p.product_variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0;
      return totalStock < 5 && totalStock > 0;
    }).length,
    outOfStock: products.filter((p: any) => {
      const totalStock = p.product_variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0;
      return totalStock === 0;
    }).length,
  };

  // ============================================
  // RENDU
  // ============================================

  if (loading) return <div className="container-page py-20 text-center text-lg">⏳ {t("loading")}</div>;
  if (!isAdmin) return <div className="container-page py-20 text-center text-muted-foreground">⛔ {t("accessDenied")}</div>;

  // Sidebar items
  const sidebarItems = [
    { id: "dashboard", icon: <Home className="h-5 w-5" />, label: t("dashboard") },
    { id: "products", icon: <Package className="h-5 w-5" />, label: t("products") },
    { id: "orders", icon: <ShoppingCart className="h-5 w-5" />, label: t("orders") },
    { id: "customers", icon: <Users className="h-5 w-5" />, label: t("customers") },
    { id: "reviews", icon: <Star className="h-5 w-5" />, label: t("reviews") },
    { id: "coupons", icon: <Tag className="h-5 w-5" />, label: t("coupons") },
    { id: "zones", icon: <Truck className="h-5 w-5" />, label: t("delivery") },
    { id: "catalog", icon: <Layers className="h-5 w-5" />, label: t("catalogSettings") },
  ];

  const Sidebar = () => (
    <div className="h-full bg-white border-l w-64 p-4 flex flex-col">
      <div className="mb-6">
        <h2 className="font-display text-xl">🛍️ {t("storeName")}</h2>
        <p className="text-xs text-muted-foreground">{t("dashboard")}</p>
      </div>
      <nav className="flex-1 space-y-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id as AdminTab); setSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition",
              activeTab === item.id
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-secondary"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.id === "reviews" && stats.pendingReviews > 0 && (
              <Badge variant="destructive" className="mr-auto">{stats.pendingReviews}</Badge>
            )}
            {item.id === "orders" && stats.pendingOrders > 0 && (
              <Badge variant="destructive" className="mr-auto">{stats.pendingOrders}</Badge>
            )}
          </button>
        ))}
      </nav>
      <div className="border-t pt-4 mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">{t("admin")}</p>
          </div>
        </div>
      
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => navigate({ to: "/" })}
        >
          <LogOut className="h-4 w-4 ml-2" />
          {t("viewStore")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar pour desktop */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Sidebar pour mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden fixed top-4 right-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="p-0 w-72">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto">
        <ScrollArea className="h-full">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* En-tête mobile */}
            <div className="flex items-center justify-between lg:hidden mb-4">
              <h1 className="font-display text-xl">🛍️ {t("storeName")}</h1>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isRefreshing}>
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ============================================ */}
            {/* TAB: DASHBOARD */}
            {/* ============================================ */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl">🏠 {t("dashboard")}</h1>
                    <p className="text-muted-foreground">{t("welcomeDashboard")}</p>
                  </div>
                  <div className="flex gap-2">
                    <LanguageSwitcher />
                    <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isRefreshing}>
                      <RefreshCw className={cn("h-4 w-4 ml-2", isRefreshing && "animate-spin")} />
                      {t("refresh")}
                    </Button>
                  </div>
                </div>

                {/* Cartes de statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-accent">{money(stats.revenue)}</p>
                      <p className="text-xs text-muted-foreground">💰 {t("sales")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{stats.orders}</p>
                      <p className="text-xs text-muted-foreground">📦 {t("orders")}</p>
                    </CardContent>
                  </Card>
                  <Card className={stats.pendingOrders > 0 ? "border-red-500" : ""}>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-red-500">{stats.pendingOrders}</p>
                      <p className="text-xs text-muted-foreground">⏳ {t("pendingOrders")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{stats.products}</p>
                      <p className="text-xs text-muted-foreground">🛍️ {t("products")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{stats.customers}</p>
                      <p className="text-xs text-muted-foreground">👥 {t("customers")}</p>
                    </CardContent>
                  </Card>
                  <Card className={stats.pendingReviews > 0 ? "border-yellow-500" : ""}>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-500">{stats.pendingReviews}</p>
                      <p className="text-xs text-muted-foreground">⭐ {t("pendingReviews")}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* تنبيهات */}
                {(stats.pendingOrders > 0 || stats.pendingReviews > 0 || stats.lowStock > 0 || stats.outOfStock > 0) && (
                  <Card className="border-yellow-500 bg-yellow-50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold flex items-center gap-2 text-yellow-700">
                        <AlertCircle className="h-5 w-5" />
                        ⚠️ {t("needsAttention")}
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm">
                        {stats.pendingOrders > 0 && (
                          <li>• {stats.pendingOrders} {t("newOrdersNeedProcessing")}</li>
                        )}
                        {stats.pendingReviews > 0 && (
                          <li>• {stats.pendingReviews} {t("reviewsNeedModeration")}</li>
                        )}
                        {stats.lowStock > 0 && (
                          <li>• {stats.lowStock} {t("productsLowStock")}</li>
                        )}
                        {stats.outOfStock > 0 && (
                          <li className="text-red-600">• {stats.outOfStock} {t("productsOutOfStock")}</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* آخر الطلبات */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display text-xl">📦 {t("latestOrders")}</h2>
                    <div className="flex gap-2">
                      <Button variant="link" onClick={() => setActiveTab("orders")}>{t("viewAll")}</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((o: any) => (
                      <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 bg-secondary/20 p-4 rounded-lg border">
                        <div>
                          <p className="font-mono text-sm font-semibold">{o.order_number}</p>
                          <p className="text-xs text-muted-foreground">{o.full_name}</p>
                        </div>
                        <span className="font-semibold">{money(Number(o.total))}</span>
                        <Badge variant={
                          o.status === "pending" ? "destructive" :
                          o.status === "delivered" ? "default" :
                          "outline"
                        }>
                          {t(statusKey(o.status))}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => setActiveTab("orders")}>
                          {t("view")}
                        </Button>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-10">{t("noOrdersYet")}</p>
                    )}
                  </div>
                </div>

                {/* آخر التقييمات */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display text-xl">⭐ {t("latestReviews")}</h2>
                    <Button variant="link" onClick={() => setActiveTab("reviews")}>{t("viewAll")}</Button>
                  </div>
                  <div className="space-y-2">
                    {reviews.slice(0, 5).map((r: any) => (
                      <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 bg-secondary/20 p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{r.author_name}</p>
                          <p className="text-xs text-muted-foreground">{r.rating}/5 ⭐</p>
                          <p className="text-sm line-clamp-1">{r.comment}</p>
                        </div>
                        <Badge variant={r.approved ? "default" : "outline"}>
                          {r.approved ? "✅ " + t("approved") : "⏳ " + t("pending")}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => setActiveTab("reviews")}>
                          {t("manage")}
                        </Button>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-10">{t("noReviewsYet")}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* TAB: PRODUCTS */}
            {/* ============================================ */}
            {activeTab === "products" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h1 className="font-display text-2xl md:text-3xl">🛍️ {t("productManagement")}</h1>
                  <div className="flex gap-2">
                    <LanguageSwitcher />
                    <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isRefreshing}>
                      <RefreshCw className={cn("h-4 w-4 ml-2", isRefreshing && "animate-spin")} />
                      {t("refresh")}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder={t("searchProducts")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => { setEditingProduct({}); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4 ml-2" /> {t("addProduct")}
                  </Button>
                </div>

                <div className="space-y-2">
                  {products.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-10">{t("noProducts")}</p>
                  ) : (
                    products.map((p: any) => {
                      const totalStock = p.product_variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0;
                      const isLowStock = totalStock < 5 && totalStock > 0;
                      const isOutOfStock = totalStock === 0;

                      return (
                        <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition">
                          <div className="flex items-center gap-4">
                            {p.product_images?.[0]?.url && (
                              <img
                                src={p.product_images[0].url}
                                alt=""
                                className="h-16 w-14 object-cover rounded-lg border"
                              />
                            )}
                            <div>
                              <p className="font-medium">{p.name_ar}</p>
                              <p className="text-xs text-muted-foreground">{p.category?.name_ar}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-accent">{money(Number(p.price))}</span>
                            <Badge variant={
                              isOutOfStock ? "destructive" :
                              isLowStock ? "outline" :
                              "default"
                            }>
                              {isOutOfStock ? "❌ " + t("outOfStock") :
                               isLowStock ? "⚠️ " + t("lowStock") :
                               "✅ " + t("inStock")}
                            </Badge>
                            <Badge variant={p.active ? "default" : "destructive"}>
                              {p.active ? t("active") : t("inactive")}
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => { setEditingProduct(p); setDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteProduct(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* TAB: ORDERS */}
            {/* ============================================ */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h1 className="font-display text-2xl md:text-3xl">📦 {t("orderManagement")}</h1>
                  <div className="flex gap-2">
                    <LanguageSwitcher />
                    <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isRefreshing}>
                      <RefreshCw className={cn("h-4 w-4 ml-2", isRefreshing && "animate-spin")} />
                      {t("refresh")}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "📋 " + t("all") },
                    { value: "pending", label: "🆕 " + t("new") },
                    { value: "confirmed", label: "✅ " + t("confirmed") },
                    { value: "processing", label: "📦 " + t("processing") },
                    { value: "shipped", label: "🚚 " + t("shipped") },
                    { value: "delivered", label: "✔️ " + t("delivered") },
                    { value: "cancelled", label: "❌ " + t("cancelled") },
                  ].map((filter) => (
                    <Button
                      key={filter.value}
                      variant={orderFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setOrderFilter(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  {orders.filter((o: any) => orderFilter === "all" || o.status === orderFilter).length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-10">
                      {orderFilter === "all" ? t("noOrders") : t("noOrdersFilter")}
                    </p>
                  ) : (
                    orders
                      .filter((o: any) => orderFilter === "all" || o.status === orderFilter)
                      .map((o: any) => (
                        <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border shadow-sm">
                          <div>
                            <p className="font-mono text-sm font-semibold">{o.order_number}</p>
                            <p className="text-xs text-muted-foreground">{o.full_name} • {o.phone} • {o.city}</p>
                          </div>
                          <span className="font-semibold">{money(Number(o.total))}</span>
                          <Badge variant={
                            o.status === "pending" ? "destructive" :
                            o.status === "delivered" ? "default" :
                            "outline"
                          }>
                            {t(statusKey(o.status))}
                          </Badge>
                          <Select
                            value={o.status}
                            onValueChange={(v) => updateOrderStatus(o.id, v)}
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"].map((s) => (
                                <SelectItem key={s} value={s}>{t(statusKey(s))}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* TAB: CUSTOMERS */}
            {/* ============================================ */}
            {activeTab === "customers" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h1 className="font-display text-2xl md:text-3xl">👥 {t("customers")}</h1>
                  <div className="flex gap-2">
                    <LanguageSwitcher />
                    <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isRefreshing}>
                      <RefreshCw className={cn("h-4 w-4 ml-2", isRefreshing && "animate-spin")} />
                      {t("refresh")}
                    </Button>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">{t("noCustomersYet")}</p>
                ) : (
                  <div className="space-y-2">
                    {orders
                      .reduce((acc: any[], o: any) => {
                        const existing = acc.find(c => c.user_id === o.user_id);
                        if (existing) {
                          existing.orders++;
                          existing.total += Number(o.total);
                          existing.lastOrder = new Date(o.created_at) > new Date(existing.lastOrder) ? o.created_at : existing.lastOrder;
                        } else if (o.user_id) {
                          acc.push({
                            user_id: o.user_id,
                            full_name: o.full_name,
                            email: o.user?.email || o.email,
                            phone: o.phone,
                            orders: 1,
                            total: Number(o.total),
                            lastOrder: o.created_at,
                          });
                        }
                        return acc;
                      }, [])
                      .sort((a, b) => b.total - a.total)
                      .map((c: any) => (
                        <div key={c.user_id} className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border shadow-sm">
                          <div>
                            <p className="font-medium">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground">{c.phone} • {c.email}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span>📦 {c.orders} {t("orders")}</span>
                            <span className="font-semibold text-accent">{money(c.total)}</span>
                            <span className="text-xs text-muted-foreground">
                              {t("lastOrder")}: {new Date(c.lastOrder).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* TAB: REVIEWS */}
            {/* ============================================ */}
            {activeTab === "reviews" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h1 className="font-display text-2xl md:text-3xl">⭐ {t("reviewManagement")}</h1>
                  <div className="flex gap-2">
                    <LanguageSwitcher />
                    <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isRefreshing}>
                      <RefreshCw className={cn("h-4 w-4 ml-2", isRefreshing && "animate-spin")} />
                      {t("refresh")}
                    </Button>
                  </div>
                </div>

                {stats.pendingReviews > 0 && (
                  <Card className="border-yellow-500 bg-yellow-50">
                    <CardContent className="p-4">
                      <p className="text-yellow-700">⚠️ {stats.pendingReviews} {t("reviewsNeedModeration")}</p>
                    </CardContent>
                  </Card>
                )}

                {reviews.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">{t("noReviewsYet")}</p>
                ) : (
                  <div className="space-y-2">
                    {reviews.map((r: any) => (
                      <div key={r.id} className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex flex-wrap justify-between items-center">
                          <div>
                            <span className="font-medium">{r.author_name}</span>
                            <span className="mr-2 text-accent">{r.rating}/5 ⭐</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={r.approved ? "outline" : "default"}
                              onClick={() => toggleReviewApproval(r.id, !r.approved)}
                            >
                              {r.approved ? "❌ " + t("reject") : "✅ " + t("approve")}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteReview(r.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm mt-2">{r.comment}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* TAB: COUPONS */}
            {/* ============================================ */}
            {activeTab === "coupons" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h1 className="font-display text-2xl md:text-3xl">🎟️ {t("couponsAndOffers")}</h1>
                  <div className="flex gap-2">
                    <LanguageSwitcher />
                    <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isRefreshing}>
                      <RefreshCw className={cn("h-4 w-4 ml-2", isRefreshing && "animate-spin")} />
                      {t("refresh")}
                    </Button>
                  </div>
                </div>

                <Button onClick={() => { setEditingCoupon({}); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 ml-2" /> {t("addOffer")}
                </Button>

                {coupons.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">{t("noCouponsYet")}</p>
                ) : (
                  <div className="space-y-2">
                    {coupons.map((c: any) => (
                      <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border shadow-sm">
                        <div>
                          <p className="font-mono font-bold text-lg">{c.code}</p>
                          <p className="text-sm">
                            {c.type === "percent" ? `${c.value}%` : `${money(Number(c.value))}`}
                            {c.min_order > 0 && ` (${t("minOrder")}: ${money(Number(c.min_order))})`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {t("used")}: {c.used_count}/{c.usage_limit || "∞"}
                          </span>
                          <Badge variant={c.active ? "default" : "destructive"}>
                            {c.active ? t("active") : t("inactive")}
                          </Badge>
                          {c.expires_at && (
                            <span className="text-xs text-muted-foreground">
                              {t("expires")}: {new Date(c.expires_at).toLocaleDateString()}
                            </span>
                          )}
                          <Button size="sm" variant="outline" onClick={() => { setEditingCoupon(c); setDialogOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteCoupon(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* TAB: ZONES */}
            {/* ============================================ */}
            {activeTab === "zones" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h1 className="font-display text-2xl md:text-3xl">🚚 {t("deliveryManagement")}</h1>
                  <div className="flex gap-2">
                    <LanguageSwitcher />
                    <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isRefreshing}>
                      <RefreshCw className={cn("h-4 w-4 ml-2", isRefreshing && "animate-spin")} />
                      {t("refresh")}
                    </Button>
                  </div>
                </div>

                <Button onClick={() => { setEditingZone({}); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 ml-2" /> {t("addZone")}
                </Button>

                {zones.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">{t("noZonesYet")}</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {zones.map((z: any) => (
                      <div key={z.id} className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{z.name_ar}</p>
                            <p className="text-sm text-muted-foreground">{z.name_fr}</p>
                            <p className="text-sm font-semibold text-accent">{money(Number(z.fee))}</p>
                            <p className="text-xs text-muted-foreground">{z.eta_ar}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={z.active ? "default" : "destructive"}>
                              {z.active ? t("active") : t("inactive")}
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => { setEditingZone(z); setDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteZone(z.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* TAB: CATALOG */}
            {/* ============================================ */}
            {activeTab === "catalog" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="font-display text-2xl md:text-3xl">📂 {t("catalogSettings")}</h1>
                  <div className="flex gap-2">
                    <LanguageSwitcher />
                    <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isRefreshing}>
                      <RefreshCw className={cn("h-4 w-4 ml-2", isRefreshing && "animate-spin")} />
                      {t("refresh")}
                    </Button>
                  </div>
                </div>

                {/* التصنيفات */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display text-xl">📂 {t("categories")}</h2>
                    <Button size="sm" onClick={() => { setEditingCategory({}); setDialogOpen(true); }}>
                      <Plus className="h-4 w-4 ml-1" /> {t("add")}
                    </Button>
                  </div>
                  {categories.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">{t("noCategoriesYet")}</p>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categories.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                          <div className="flex items-center gap-3">
                            {c.image_url && (
                              <img src={c.image_url} alt="" className="h-10 w-10 object-cover rounded" />
                            )}
                            <span className="font-medium">{c.name_ar}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => { setEditingCategory(c); setDialogOpen(true); }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteCategory(c.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* الألوان */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display text-xl">🎨 {t("colors")}</h2>
                    <Button size="sm" onClick={() => { setEditingColor({}); setDialogOpen(true); }}>
                      <Plus className="h-4 w-4 ml-1" /> {t("add")}
                    </Button>
                  </div>
                  {colors.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">{t("noColorsYet")}</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {colors.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                          <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: c.hex }} />
                          <span className="text-sm">{c.name_ar}</span>
                          <Button size="sm" variant="outline" onClick={() => { setEditingColor(c); setDialogOpen(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteColor(c.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* المقاسات */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display text-xl">📏 {t("sizes")}</h2>
                    <Button size="sm" onClick={() => { setEditingSize({}); setDialogOpen(true); }}>
                      <Plus className="h-4 w-4 ml-1" /> {t("add")}
                    </Button>
                  </div>
                  {sizes.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">{t("noSizesYet")}</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {sizes.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                          <span className="font-bold">{s.label}</span>
                          <Button size="sm" variant="outline" onClick={() => { setEditingSize(s); setDialogOpen(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteSize(s.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ============================================ */}
      {/* DIALOG D'ÉDITION */}
      {/* ============================================ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct && (editingProduct.id ? "✏️ " + t("editProduct") : "➕ " + t("addNewProduct"))}
              {editingCategory && (editingCategory.id ? "✏️ " + t("editCategory") : "➕ " + t("addNewCategory"))}
              {editingColor && (editingColor.id ? "✏️ " + t("editColor") : "➕ " + t("addNewColor"))}
              {editingSize && (editingSize.id ? "✏️ " + t("editSize") : "➕ " + t("addNewSize"))}
              {editingZone && (editingZone.id ? "✏️ " + t("editZone") : "➕ " + t("addNewZone"))}
              {editingCoupon && (editingCoupon.id ? "✏️ " + t("editCoupon") : "➕ " + t("addNewCoupon"))}
            </DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <ProductEditor
              product={editingProduct}
              onSave={saveProduct}
              onCancel={() => { setEditingProduct(null); setDialogOpen(false); }}
              categories={categories}
              colors={colors}
              sizes={sizes}
            />
          )}
          {editingCategory && (
            <CategoryEditor
              category={editingCategory}
              onSave={saveCategory}
              onCancel={() => { setEditingCategory(null); setDialogOpen(false); }}
            />
          )}
          {editingColor && (
            <ColorEditor
              color={editingColor}
              onSave={saveColor}
              onCancel={() => { setEditingColor(null); setDialogOpen(false); }}
            />
          )}
          {editingSize && (
            <SizeEditor
              size={editingSize}
              onSave={saveSize}
              onCancel={() => { setEditingSize(null); setDialogOpen(false); }}
            />
          )}
          {editingZone && (
            <ZoneEditor
              zone={editingZone}
              onSave={saveZone}
              onCancel={() => { setEditingZone(null); setDialogOpen(false); }}
            />
          )}
          {editingCoupon && (
            <CouponEditor
              coupon={editingCoupon}
              onSave={saveCoupon}
              onCancel={() => { setEditingCoupon(null); setDialogOpen(false); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}