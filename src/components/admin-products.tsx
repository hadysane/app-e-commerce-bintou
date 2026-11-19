import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Pencil, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIES,
  PRODUCT_IMAGES_BUCKET,
  formatPrice,
  slugify,
  toProduct,
  type Category,
  type ProductRow,
} from "@/lib/products";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Every product, hidden ones included (admins see them through RLS). */
export const adminProductsQueryOptions = queryOptions({
  queryKey: ["admin-products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("position")
      .order("name");
    if (error) throw error;
    return data;
  },
});

export function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    void queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };
}

const SIZE_PRESETS = [
  { label: "XS → XL", sizes: "XS, S, M, L, XL" },
  { label: "S → XXL", sizes: "S, M, L, XL, XXL" },
  { label: "Taille unique", sizes: "Taille unique" },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Draft = {
  slug: string;
  name: string;
  category: Category;
  price: string;
  fabric: string;
  short: string;
  description: string;
  sizes: string;
  isNew: boolean;
  active: boolean;
  position: string;
};

function emptyDraft(position: number): Draft {
  return {
    slug: "",
    name: "",
    category: "femme",
    price: "",
    fabric: "",
    short: "",
    description: "",
    sizes: SIZE_PRESETS[0]!.sizes,
    isNew: true,
    active: true,
    position: String(position),
  };
}

function rowToDraft(row: ProductRow): Draft {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category as Category,
    price: (row.price_cents / 100).toFixed(2).replace(".", ","),
    fabric: row.fabric,
    short: row.short,
    description: row.description,
    sizes: row.sizes.join(", "),
    isNew: row.is_new,
    active: row.active,
    position: String(row.position),
  };
}

function parseSizes(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

/** PostgREST `in` list, quoting values such as "Taille unique". */
function postgrestList(values: string[]): string {
  return `(${values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(",")})`;
}

export function ProductsTab() {
  const invalidate = useInvalidateCatalog();
  const { data: rows, isLoading } = useQuery(adminProductsQueryOptions);
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);

  const toggleActive = useMutation({
    mutationFn: async (row: ProductRow) => {
      const { error } = await supabase
        .from("products")
        .update({ active: !row.active })
        .eq("slug", row.slug);
      if (error) throw error;
      return !row.active;
    },
    onSuccess: (active) => {
      invalidate();
      toast.success(active ? "Produit visible dans la boutique" : "Produit masqué de la boutique");
    },
    onError: () => toast.error("Mise à jour impossible."),
  });

  if (isLoading) return <Loader2 className="size-6 animate-spin text-primary" />;

  const nextPosition = Math.max(0, ...(rows ?? []).map((r) => r.position)) + 1;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows?.length ?? 0} produit{(rows?.length ?? 0) > 1 ? "s" : ""} · les produits masqués
          n'apparaissent pas dans la boutique.
        </p>
        <Button variant="ink" onClick={() => setEditing("new")}>
          <Plus /> Nouveau produit
        </Button>
      </div>

      <ul className="mt-6 space-y-3">
        {rows?.map((row) => {
          const p = toProduct(row);
          return (
            <li
              key={row.slug}
              className={cn(
                "flex flex-wrap items-center gap-4 rounded-sm border border-border bg-card p-4",
                !row.active && "opacity-60",
              )}
            >
              <ProductImage src={p.image} alt="" loading="lazy" className="h-16 w-12 rounded-sm" />
              <div className="min-w-40 flex-1">
                <p className="font-display text-lg leading-tight">
                  {p.name}{" "}
                  {!row.active && (
                    <span className="ml-1 text-xs text-muted-foreground">(masqué)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORIES.find((c) => c.value === p.category)?.label} · {formatPrice(p.price)} ·{" "}
                  {p.sizes.join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(row)}>
                  <Pencil /> Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={toggleActive.isPending}
                  onClick={() => toggleActive.mutate(row)}
                >
                  {row.active ? <EyeOff /> : <Eye />} {row.active ? "Masquer" : "Afficher"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-lg">
          {editing !== null && (
            <ProductForm
              key={editing === "new" ? "new" : editing.slug}
              row={editing === "new" ? null : editing}
              nextPosition={nextPosition}
              onDone={() => {
                setEditing(null);
                invalidate();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProductForm({
  row,
  nextPosition,
  onDone,
}: {
  row: ProductRow | null;
  nextPosition: number;
  onDone: () => void;
}) {
  const isNew = row === null;
  const [draft, setDraft] = useState<Draft>(() =>
    row ? rowToDraft(row) : emptyDraft(nextPosition),
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(row ? toProduct(row).image : null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) {
      toast.error("Photo au format JPG, PNG ou WebP uniquement.");
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error("La photo dépasse 5 Mo.");
      return;
    }
    setFile(f);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    const slug = isNew ? draft.slug.trim() : row.slug;
    const price = Number(draft.price.replace(",", ".").trim());
    const sizes = parseSizes(draft.sizes);
    const position = Number(draft.position);

    if (!name) {
      toast.error("Donnez un nom au produit.");
      return;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      toast.error("L'adresse doit contenir uniquement des minuscules, chiffres et tirets.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Indiquez un prix valide.");
      return;
    }
    if (sizes.length === 0) {
      toast.error("Indiquez au moins une taille.");
      return;
    }
    if (!Number.isInteger(position)) {
      toast.error("L'ordre d'affichage doit être un nombre entier.");
      return;
    }
    if (isNew && !file) {
      toast.error("Ajoutez une photo.");
      return;
    }

    setBusy(true);
    let uploaded: string | null = null;
    try {
      if (file) {
        const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        uploaded = `${slug}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(uploaded, file, { contentType: file.type, upsert: false });
        if (error) {
          uploaded = null;
          throw new Error("upload");
        }
      }

      const values = {
        name,
        category: draft.category,
        price_cents: Math.round(price * 100),
        fabric: draft.fabric.trim(),
        short: draft.short.trim(),
        description: draft.description.trim(),
        sizes,
        is_new: draft.isNew,
        active: draft.active,
        position,
        ...(uploaded ? { image_path: uploaded } : {}),
      };

      const { error } = isNew
        ? await supabase.from("products").insert({ slug, ...values })
        : await supabase.from("products").update(values).eq("slug", slug);
      if (error) throw new Error(error.code === "23505" ? "duplicate" : "save");

      if (!isNew) {
        // Old photo and stock rows for sizes that no longer exist are cleaned up best-effort.
        if (uploaded && row.image_path)
          await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([row.image_path]);
        await supabase
          .from("product_stock")
          .delete()
          .eq("product_slug", slug)
          .not("size", "in", postgrestList(sizes));
      }

      toast.success(isNew ? "Produit créé. Pensez à renseigner son stock." : "Produit enregistré");
      onDone();
    } catch (err) {
      if (uploaded) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([uploaded]);
      const code = err instanceof Error ? err.message : "";
      toast.error(
        code === "duplicate"
          ? "Un produit utilise déjà cette adresse. Choisissez-en une autre."
          : code === "upload"
            ? "L'envoi de la photo a échoué."
            : "Enregistrement impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 p-6">
      <div>
        <SheetTitle className="font-display text-2xl">
          {isNew ? "Nouveau produit" : `Modifier ${row.name}`}
        </SheetTitle>
        <SheetDescription>
          Les changements apparaissent dans la boutique dès l'enregistrement.
        </SheetDescription>
      </div>

      <div className="flex items-end gap-4">
        <ProductImage src={preview} alt="Aperçu" className="h-32 w-24 shrink-0 rounded-sm" />
        <div className="space-y-1.5">
          <Label htmlFor="p-image">
            Photo {isNew ? "" : "(laisser vide pour garder l'actuelle)"}
          </Label>
          <Input
            id="p-image"
            type="file"
            accept={IMAGE_TYPES.join(",")}
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WebP, 5 Mo maximum. Format portrait 3:4 conseillé.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-name">Nom</Label>
        <Input
          id="p-name"
          required
          value={draft.name}
          onChange={(e) => {
            const value = e.target.value;
            setDraft((d) => ({
              ...d,
              name: value,
              ...(isNew && !slugTouched ? { slug: slugify(value) } : {}),
            }));
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-slug">Adresse de la page</Label>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          /produit/
          <Input
            id="p-slug"
            required
            disabled={!isNew}
            value={draft.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
          />
        </div>
        {!isNew && (
          <p className="text-xs text-muted-foreground">
            L'adresse ne change pas après la création, pour ne pas casser les liens partagés.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Catégorie</Label>
          <Select value={draft.category} onValueChange={(v) => set("category", v as Category)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-price">Prix (€)</Label>
          <Input
            id="p-price"
            required
            inputMode="decimal"
            placeholder="89,00"
            value={draft.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-sizes">Tailles (séparées par des virgules)</Label>
        <Input
          id="p-sizes"
          required
          value={draft.sizes}
          onChange={(e) => set("sizes", e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {SIZE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => set("sizes", preset.sizes)}
              className="rounded-full border border-border px-3 py-1 text-xs hover:border-foreground"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-fabric">Tissu</Label>
        <Input
          id="p-fabric"
          placeholder="Wax ankara 100 % coton"
          value={draft.fabric}
          onChange={(e) => set("fabric", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-short">Accroche (une ligne)</Label>
        <Input id="p-short" value={draft.short} onChange={(e) => set("short", e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-description">Description</Label>
        <Textarea
          id="p-description"
          rows={5}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-position">Ordre d'affichage</Label>
          <Input
            id="p-position"
            type="number"
            step={1}
            value={draft.position}
            onChange={(e) => set("position", e.target.value)}
          />
        </div>
        <div className="space-y-3 pt-6">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={draft.isNew} onCheckedChange={(v) => set("isNew", v)} /> Badge «
            Nouveau »
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={draft.active} onCheckedChange={(v) => set("active", v)} /> Visible dans
            la boutique
          </label>
        </div>
      </div>

      <Button type="submit" variant="ink" size="lg" className="w-full" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        {isNew ? "Créer le produit" : "Enregistrer"}
      </Button>
    </form>
  );
}
