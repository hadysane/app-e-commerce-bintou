import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value, "http://x");
    const path = url.pathname + url.search;
    return path.startsWith("/") && !path.startsWith("//") ? path : undefined;
  } catch {
    return undefined;
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: safeRedirect(search["redirect"]),
  }),
  head: () => ({
    meta: [
      { title: "Espace équipe — Bintou" },
      { name: "description", content: "Connexion à l'espace équipe Bintou." },
      { property: "og:title", content: "Espace équipe — Bintou" },
      { property: "og:description", content: "Connexion à l'espace équipe Bintou." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const target = redirect ?? "/admin";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: target, replace: true });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${target}` },
        });
        if (error) throw error;
        setSent("Vérifiez votre boîte mail pour confirmer votre compte, puis connectez-vous.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("Si un compte existe, un lien de réinitialisation vient de vous être envoyé.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("Invalid login") ? "E-mail ou mot de passe incorrect." : "Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "Connexion" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié";

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <p className="text-eyebrow text-primary">Espace équipe</p>
      <h1 className="mt-3 text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Réservé à l'équipe Bintou pour gérer les stocks et les commandes.</p>

      {sent ? (
        <p className="mt-10 rounded-sm border border-border bg-card p-6 text-sm">{sent}</p>
      ) : (
        <>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <Button type="submit" variant="ink" size="xl" className="w-full" disabled={busy}>
              {mode === "signin" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-sm">
            {mode === "signin" && (
              <>
                <button type="button" className="text-left underline-offset-4 hover:underline" onClick={() => setMode("forgot")}>Mot de passe oublié ?</button>
                <button type="button" className="text-left underline-offset-4 hover:underline" onClick={() => setMode("signup")}>Pas encore de compte ? Créer un compte</button>
              </>
            )}
            {mode !== "signin" && (
              <button type="button" className="text-left underline-offset-4 hover:underline" onClick={() => setMode("signin")}>J'ai déjà un compte</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
