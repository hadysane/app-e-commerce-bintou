import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Bintou" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte Bintou." },
      { property: "og:title", content: "Nouveau mot de passe — Bintou" },
      { property: "og:description", content: "Choisissez un nouveau mot de passe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("Le lien a expiré. Redemandez un lien de réinitialisation.");
      return;
    }
    toast.success("Mot de passe mis à jour.");
    await navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="text-4xl">Nouveau mot de passe</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pw">Mot de passe</Label>
          <Input id="pw" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" variant="ink" size="xl" className="w-full" disabled={busy}>Enregistrer</Button>
      </form>
    </div>
  );
}
