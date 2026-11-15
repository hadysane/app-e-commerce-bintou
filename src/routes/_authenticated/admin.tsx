import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS, formatPrice } from "@/lib/products";
import { stockKey } from "@/lib/cart-logic";
import { reconcileOrders } from "@/lib/shop.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Gestion de la boutique — Bintou" },
      { name: "description", content: "Stocks, commandes et équipe Bintou." },
      { property: "og:title", content: "Gestion de la boutique — Bintou" },
      { property: "og:description", content: "Stocks, commandes et équipe Bintou." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-primary">Espace équipe</p>
          <h1 className="mt-2 text-4xl md:text-5xl">Gestion de la boutique</h1>
          <p className="mt-2 text-sm text-muted-foreground">Connecté·e : {user.email}</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut /> Se déconnecter
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="mt-16 size-6 animate-spin text-primary" />
      ) : !isAdmin ? (
        <div className="mt-12 rounded-sm border border-border bg-card p-8">
          <h2 className="text-2xl">Accès réservé</h2>
          <p className="mt-2 text-muted-foreground">
            Votre compte n'a pas encore accès à la gestion. Demandez à un membre de l'équipe de vous inviter avec l'adresse {user.email}.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="stock" className="mt-10">
          <TabsList>
            <TabsTrigger value="stock">Stocks</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="team">Équipe</TabsTrigger>
          </TabsList>
          <TabsContent value="stock" className="mt-8"><StockTab /></TabsContent>
          <TabsContent value="orders" className="mt-8"><OrdersTab /></TabsContent>
          <TabsContent value="team" className="mt-8"><TeamTab currentUserId={user.id} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ---------------- Stocks ---------------- */

function StockTab() {
  const queryClient = useQueryClient();
  const { data: stock, isLoading } = useQuery({
    queryKey: ["admin-stock"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_stock").select("product_slug, size, quantity");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of data) map[stockKey(r.product_slug, r.size)] = r.quantity;
      return map;
    },
  });
  const [draft, setDraft] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: async (slug: string) => {
      const product = PRODUCTS.find((p) => p.slug === slug)!;
      const rows = product.sizes.map((size) => {
        const raw = draft[stockKey(slug, size)];
        const quantity = raw === undefined ? (stock?.[stockKey(slug, size)] ?? 0) : Number(raw);
        if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Quantité invalide");
        return { product_slug: slug, size, quantity, updated_at: new Date().toISOString() };
      });
      const { error } = await supabase.from("product_stock").upsert(rows);
      if (error) throw error;
      return slug;
    },
    onSuccess: (slug) => {
      setDraft((d) => Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith(`${slug}|`))));
      void queryClient.invalidateQueries({ queryKey: ["admin-stock"] });
      void queryClient.invalidateQueries({ queryKey: ["stock"] });
      toast.success("Stock enregistré");
    },
    onError: (e) => toast.error(e instanceof Error && e.message === "Quantité invalide" ? "Saisissez des nombres entiers positifs." : "Enregistrement impossible."),
  });

  if (isLoading) return <Loader2 className="size-6 animate-spin text-primary" />;

  return (
    <div className="space-y-4">
      {PRODUCTS.map((p) => {
        const dirty = p.sizes.some((s) => draft[stockKey(p.slug, s)] !== undefined);
        const total = p.sizes.reduce((n, s) => n + (stock?.[stockKey(p.slug, s)] ?? 0), 0);
        return (
          <div key={p.slug} className="flex flex-col gap-5 rounded-sm border border-border bg-card p-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4 md:w-64">
              <img src={p.image} alt="" width={768} height={1024} loading="lazy" className="h-16 w-12 rounded-sm object-cover" />
              <div>
                <p className="font-display text-lg leading-tight">{p.name}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(p.price)} · {total} en stock</p>
              </div>
            </div>
            <div className="flex flex-1 flex-wrap gap-3">
              {p.sizes.map((s) => {
                const key = stockKey(p.slug, s);
                const current = stock?.[key] ?? 0;
                const value = draft[key] ?? String(current);
                const n = Number(value);
                return (
                  <label key={s} className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{s}</span>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={value}
                      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                      className={cn("h-9 w-20", n === 0 && "border-destructive/60", n > 0 && n <= 3 && "border-primary/60")}
                    />
                    <span className={cn("text-[10px]", n === 0 ? "text-destructive" : n <= 3 ? "text-primary" : "invisible")}>
                      {n === 0 ? "Épuisé" : "Stock faible"}
                    </span>
                  </label>
                );
              })}
            </div>
            <Button variant="ink" disabled={!dirty || save.isPending} onClick={() => save.mutate(p.slug)}>
              Enregistrer
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Orders ---------------- */

type OrderItem = { slug: string; size: string; qty: number; name: string; price: number };
type Shipping = { name?: string; address?: { line1?: string; line2?: string | null; postal_code?: string; city?: string; country?: string } } | null;

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente de paiement", className: "bg-muted text-muted-foreground" },
  paid: { label: "Payée — à expédier", className: "bg-accent text-accent-foreground" },
  shipped: { label: "Expédiée", className: "bg-forest text-primary-foreground" },
  expired: { label: "Abandonnée", className: "bg-muted text-muted-foreground line-through" },
};

function OrdersTab() {
  const queryClient = useQueryClient();
  const reconcile = useServerFn(reconcileOrders);
  const [filter, setFilter] = useState<"todo" | "all">("todo");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    reconcile()
      .then((r) => {
        if (r.updated > 0) {
          void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-stock"] });
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markShipped = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ status: "shipped" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Commande marquée comme expédiée");
    },
    onError: () => toast.error("Mise à jour impossible."),
  });

  if (isLoading) return <Loader2 className="size-6 animate-spin text-primary" />;

  const list = (orders ?? []).filter((o) => (filter === "todo" ? o.status === "paid" : true));

  return (
    <div>
      <div className="flex gap-2">
        {(["todo", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn("rounded-full border px-4 py-1.5 text-sm", filter === f ? "border-foreground bg-foreground text-background" : "border-border")}
          >
            {f === "todo" ? "À expédier" : "Toutes"}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-10 text-muted-foreground">{filter === "todo" ? "Aucune commande à expédier." : "Aucune commande pour le moment."}</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((o) => {
            const items = o.items as unknown as OrderItem[];
            const ship = o.shipping as Shipping;
            const st = STATUS[o.status] ?? STATUS["pending"]!;
            return (
              <li key={o.id} className="rounded-sm border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl">{formatPrice(o.amount_total / 100)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })} · n° {o.id.slice(0, 8)}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs", st.className)}>{st.label}</span>
                </div>
                <ul className="mt-4 space-y-1 text-sm">
                  {items.map((i) => (
                    <li key={`${i.slug}-${i.size}`}>
                      {i.qty} × {i.name} <span className="text-muted-foreground">({i.size})</span>
                    </li>
                  ))}
                </ul>
                {(o.customer_name || o.customer_email || ship?.address) && (
                  <div className="mt-4 border-t border-border pt-4 text-sm">
                    <p className="font-medium">{ship?.name || o.customer_name}</p>
                    {o.customer_email && <p className="text-muted-foreground">{o.customer_email}</p>}
                    {ship?.address && (
                      <p className="mt-1 text-muted-foreground">
                        {[ship.address.line1, ship.address.line2].filter(Boolean).join(", ")} — {ship.address.postal_code} {ship.address.city}, {ship.address.country}
                      </p>
                    )}
                  </div>
                )}
                {o.status === "paid" && (
                  <Button variant="ink" size="sm" className="mt-4" disabled={markShipped.isPending} onClick={() => markShipped.mutate(o.id)}>
                    Marquer comme expédiée
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Team ---------------- */

function TeamTab({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-team"],
    queryFn: async () => {
      const [roles, invites] = await Promise.all([
        supabase.from("user_roles").select("id, user_id, email, created_at").eq("role", "admin").order("created_at"),
        supabase.from("team_invites").select("email, created_at").order("created_at"),
      ]);
      if (roles.error) throw roles.error;
      if (invites.error) throw invites.error;
      return { members: roles.data, invites: invites.data };
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-team"] });

  async function invite(e: FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;
    const { error } = await supabase.from("team_invites").insert({ email: value, invited_by: currentUserId });
    if (error && !error.message.includes("duplicate")) {
      toast.error("Invitation impossible.");
      return;
    }
    setEmail("");
    toast.success(`${value} a maintenant accès (dès la création de son compte s'il n'en a pas encore).`);
    void refresh();
  }

  async function removeMember(id: string) {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) toast.error("Suppression impossible.");
    void refresh();
  }

  async function cancelInvite(value: string) {
    const { error } = await supabase.from("team_invites").delete().eq("email", value);
    if (error) toast.error("Annulation impossible.");
    void refresh();
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <h2 className="text-2xl">Inviter un membre</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Saisissez l'e-mail de la personne. Elle crée ensuite son compte depuis « Espace équipe » avec cette même adresse.
        </p>
        <form onSubmit={invite} className="mt-5 flex gap-2">
          <Input type="email" required placeholder="prenom@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" variant="ink">Inviter</Button>
        </form>

        {data && data.invites.length > 0 && (
          <div className="mt-8">
            <p className="text-eyebrow text-muted-foreground">Invitations en attente</p>
            <ul className="mt-3 divide-y divide-border rounded-sm border border-border bg-card">
              {data.invites.map((i) => (
                <li key={i.email} className="flex items-center justify-between px-4 py-3 text-sm">
                  {i.email}
                  <button type="button" aria-label={`Annuler l'invitation de ${i.email}`} onClick={() => cancelInvite(i.email)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl">Membres de l'équipe</h2>
        <ul className="mt-5 divide-y divide-border rounded-sm border border-border bg-card">
          {data?.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {m.email ?? "—"} {m.user_id === currentUserId && <span className="text-muted-foreground">(vous)</span>}
              </span>
              {m.user_id !== currentUserId && (
                <button type="button" aria-label={`Retirer ${m.email ?? "ce membre"}`} onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
