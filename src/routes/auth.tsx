import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}

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

  async function social(provider: "google" | "lovable") {
    if (redirect) sessionStorage.setItem("bintou-after-login", redirect);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) {
      toast.error("La connexion n'a pas abouti.");
      return;
    }
    if (result.redirected) return;
    await navigate({ to: target, replace: true });
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
          {mode !== "forgot" && (
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => social("google")}
                className="flex h-11 w-full items-center justify-center gap-[10px] rounded-sm border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium text-[#1F1F1F]"
              >
                <GoogleLogo />
                Continuer avec Google
              </button>
              <button type="button" className="lovable-auth-button w-full" onClick={() => social("lovable")}>
                Continuer avec Lovable
              </button>
              <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>
            </div>
          )}

          <form onSubmit={submit} className="mt-4 space-y-4">
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
