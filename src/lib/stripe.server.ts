// Minimal Stripe REST client (fetch-based, works on the edge runtime).
type Params = Record<string, string>;

export async function stripeRequest<T>(path: string, method: "GET" | "POST" = "GET", params?: Params): Promise<T> {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Le paiement n'est pas configuré.");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "POST" && params ? new URLSearchParams(params).toString() : undefined,
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    console.error("[stripe]", path, json.error?.message);
    throw new Error("Le service de paiement est indisponible. Réessayez dans un instant.");
  }
  return json;
}

export type StripeSession = {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  amount_total: number | null;
  customer_details: { email: string | null; name: string | null } | null;
  shipping_details?: unknown;
  collected_information?: { shipping_details?: unknown } | null;
};

export function sessionShipping(s: StripeSession): unknown {
  return s.collected_information?.shipping_details ?? s.shipping_details ?? null;
}
