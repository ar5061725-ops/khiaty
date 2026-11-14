// Shared payment code. IDENTICAL copy lives in functions/check-payment/shared.ts — keep both in sync.
import { createClient } from "jsr:@supabase/supabase-js@2";

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const APP_URL = (Deno.env.get("APP_URL") ?? "https://khiaty-nine.vercel.app").replace(/\/$/, "");
export const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// deno-lint-ignore no-explicit-any
export type Any = any;

/* ---------- gateway config (Deno env first, then Supabase Vault) ---------- */
let cfg: { key: string; base: string } | null = null;
async function config() {
  if (cfg) return cfg;
  const secret = async (name: string) => (await admin.rpc("khiaty_get_secret", { p_name: name })).data as string | null;
  const key = Deno.env.get("MYFATOORAH_API_KEY") ?? (await secret("myfatoorah_api_key"));
  const base = Deno.env.get("MYFATOORAH_BASE_URL") ?? (await secret("myfatoorah_base_url")) ?? "https://apitest.myfatoorah.com";
  if (!key) throw new HttpError(500, "بوابة الدفع غير مهيّأة");
  cfg = { key, base: base.replace(/\/$/, "") };
  return cfg;
}

export async function mf(path: string, body: Record<string, unknown>): Promise<Any> {
  const { key, base } = await config();
  const res = await fetch(`${base}/v2/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => null);
  if (res.status === 401) cfg = null; // key rotated? reload next time
  if (!res.ok || !out?.IsSuccess) {
    console.error("MyFatoorah error", path, res.status, JSON.stringify(out)?.slice(0, 500));
    throw new HttpError(502, "تعذّر الاتصال ببوابة الدفع. حاول مرة أخرى.");
  }
  return out.Data;
}

/* ---------- auth ---------- */
export async function authUser(req: Request) {
  const header = req.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) throw new HttpError(401, "سجّل الدخول أولاً.");
  const db = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: header } }, auth: { persistSession: false } });
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "انتهت الجلسة. سجّل الدخول من جديد.");
  return { user: data.user, db };
}

/* ---------- settle: turn a gateway status into a recorded payment ---------- */
export type PayStatus = "success" | "pending" | "cancelled" | "rejected" | "ignored";
export type Settled = { status: PayStatus; orderId?: string; phase?: string };

export async function settle(data: Any, fallbackPaymentId: string, callerId?: string): Promise<Settled> {
  const [orderId, phase] = String(data.CustomerReference ?? "").split(":");
  if (!UUID_RE.test(orderId ?? "") || (phase !== "up" && phase !== "fin")) return { status: "ignored" };

  const { data: order } = await admin.from("khiaty_orders").select("customer_id,up,fin").eq("id", orderId).maybeSingle();
  if (!order) return { status: "ignored" };
  if (callerId && order.customer_id !== callerId) throw new HttpError(403, "هذه الدفعة لا تخصّ حسابك.");

  const invoiceId = Number(data.InvoiceId);
  // record a terminal failure state on the still-pending payment row (a later success can still override it)
  const mark = async (status: "cancelled" | "rejected", paymentId?: string) => {
    await admin.from("khiaty_payments").update({ status, gateway_payment_id: paymentId ?? null })
      .eq("invoice_id", invoiceId).eq("status", "pending");
  };

  const txs: Any[] = Array.isArray(data.InvoiceTransactions) ? data.InvoiceTransactions : [];
  const okTx = txs.find((t) => /^succ/i.test(String(t.TransactionStatus ?? "")));

  if (data.InvoiceStatus === "Paid" && okTx) {
    const expected = Number(phase === "up" ? order.up : order.fin);
    if (Math.abs(Number(data.InvoiceValue) - expected) > 0.0005) {
      console.error("amount mismatch", { orderId, phase, paid: data.InvoiceValue, expected });
      await mark("rejected");
      return { status: "rejected", orderId, phase };
    }
    const { error } = await admin.rpc("khiaty_apply_payment", {
      p_order: orderId, p_phase: phase, p_invoice: invoiceId,
      p_payment_id: String(okTx.PaymentId ?? fallbackPaymentId ?? ""),
    });
    if (error) { console.error("apply_payment", error.message); throw new HttpError(500, "تعذّر تسجيل الدفعة."); }
    return { status: "success", orderId, phase };
  }

  const states = txs.map((t) => String(t.TransactionStatus ?? ""));
  if (states.some((s) => /^fail/i.test(s)) && !states.some((s) => /^(inprogress|authorize)/i.test(s))) {
    await mark("rejected", txs[txs.length - 1]?.PaymentId ? String(txs[txs.length - 1].PaymentId) : undefined);
    return { status: "rejected", orderId, phase };
  }
  if (data.InvoiceStatus === "Canceled" || (states.length > 0 && states.every((s) => /^(canceled|cancelled)/i.test(s)))) {
    await mark("cancelled");
    return { status: "cancelled", orderId, phase };
  }
  return { status: "pending", orderId, phase };
}
