// MyFatoorah payments for Khiaty.
//  POST {action:"create", orderId, phase}  (user JWT)  -> creates an invoice, returns {url}
//  POST {action:"verify", paymentId}        (user JWT)  -> asks MyFatoorah if it was paid, applies it
//  POST {Event, Data}                        (webhook)   -> same check, triggered by MyFatoorah
// verify_jwt is off because the webhook is unauthenticated; user routes authenticate the JWT themselves,
// and a payment is only ever applied after MyFatoorah itself confirms it with our secret key.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = (Deno.env.get("APP_URL") ?? "https://khiaty-nine.vercel.app").replace(/\/$/, "");
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// deno-lint-ignore no-explicit-any
type Any = any;

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

async function mf(path: string, body: Record<string, unknown>): Promise<Any> {
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
async function authUser(req: Request) {
  const header = req.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) throw new HttpError(401, "سجّل الدخول أولاً.");
  const db = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: header } }, auth: { persistSession: false } });
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "انتهت الجلسة. سجّل الدخول من جديد.");
  return { user: data.user, db };
}

/* ---------- create invoice ---------- */
async function create(req: Request, body: Any) {
  const { user, db } = await authUser(req);
  const orderId = String(body.orderId ?? "");
  const phase = body.phase;
  if (!UUID_RE.test(orderId) || (phase !== "up" && phase !== "fin")) throw new HttpError(400, "طلب غير صالح.");

  // RLS: only the two participants can read the order; only the customer may pay
  const { data: order } = await db.from("khiaty_orders")
    .select("id,customer_id,up,fin,stage,up_paid,fin_paid").eq("id", orderId).maybeSingle();
  if (!order || order.customer_id !== user.id) throw new HttpError(404, "الطلب غير موجود.");
  const due = phase === "up" ? !order.up_paid : order.stage === "ready" && !order.fin_paid;
  if (!due) throw new HttpError(409, "لا توجد دفعة مستحقة لهذا الطلب.");

  const amount = Number(phase === "up" ? order.up : order.fin); // always from the database, never from the client
  const { data: profile } = await db.from("khiaty_profiles").select("name").eq("id", user.id).maybeSingle();
  const back = `${APP_URL}/pay/return`;
  const inv = await mf("SendPayment", {
    CustomerName: profile?.name ?? "عميل",
    NotificationOption: "LNK",
    InvoiceValue: amount,
    DisplayCurrencyIso: "KWD",
    CallBackUrl: back,
    ErrorUrl: back,
    CustomerReference: `${orderId}:${phase}`,
    Language: "ar",
  });
  const { error } = await admin.from("khiaty_payments").insert({
    order_id: orderId, phase, amount, invoice_id: inv.InvoiceId, payment_url: inv.InvoiceURL,
  });
  if (error) { console.error(error); throw new HttpError(500, "تعذّر إنشاء الدفعة."); }
  return json({ url: inv.InvoiceURL });
}

/* ---------- settle: turn a gateway status into an applied payment ---------- */
type Settled = { status: "paid" | "pending" | "failed" | "ignored"; orderId?: string; phase?: string };

async function settle(data: Any, fallbackPaymentId: string, callerId?: string): Promise<Settled> {
  const [orderId, phase] = String(data.CustomerReference ?? "").split(":");
  if (!UUID_RE.test(orderId ?? "") || (phase !== "up" && phase !== "fin")) return { status: "ignored" };

  const { data: order } = await admin.from("khiaty_orders").select("customer_id,up,fin").eq("id", orderId).maybeSingle();
  if (!order) return { status: "ignored" };
  if (callerId && order.customer_id !== callerId) throw new HttpError(403, "هذه الدفعة لا تخصّ حسابك.");

  const txs: Any[] = Array.isArray(data.InvoiceTransactions) ? data.InvoiceTransactions : [];
  const okTx = txs.find((t) => /^succ/i.test(String(t.TransactionStatus ?? "")));
  if (!(data.InvoiceStatus === "Paid" && okTx)) {
    const dead = data.InvoiceStatus === "Canceled" ||
      (txs.length > 0 && txs.every((t) => /^(failed|canceled)/i.test(String(t.TransactionStatus ?? ""))));
    return { status: dead ? "failed" : "pending", orderId, phase };
  }

  const expected = Number(phase === "up" ? order.up : order.fin);
  if (Math.abs(Number(data.InvoiceValue) - expected) > 0.0005) {
    console.error("amount mismatch", { orderId, phase, paid: data.InvoiceValue, expected });
    return { status: "failed", orderId, phase };
  }

  const { error } = await admin.rpc("khiaty_apply_payment", {
    p_order: orderId, p_phase: phase, p_invoice: Number(data.InvoiceId),
    p_payment_id: String(okTx.PaymentId ?? fallbackPaymentId ?? ""),
  });
  if (error) { console.error("apply_payment", error.message); throw new HttpError(500, "تعذّر تسجيل الدفعة."); }
  return { status: "paid", orderId, phase };
}

/* ---------- verify on return from the payment page ---------- */
async function verify(req: Request, body: Any) {
  const { user } = await authUser(req);
  const paymentId = String(body.paymentId ?? "");
  if (!/^[A-Za-z0-9-]{4,64}$/.test(paymentId)) throw new HttpError(400, "رقم الدفعة غير صالح.");
  const data = await mf("GetPaymentStatus", { Key: paymentId, KeyType: "PaymentId" });
  return json(await settle(data, paymentId, user.id));
}

/* ---------- webhook (MyFatoorah v2) ---------- */
async function webhook(body: Any) {
  if (body.Event?.Code !== 1) return json({ ok: true }); // only "payment status changed"
  const invoiceId = body.Data?.Invoice?.Id;
  if (!invoiceId) return json({ ok: true });
  // never trust the payload: ask the gateway for the real status of this invoice
  const data = await mf("GetPaymentStatus", { Key: String(invoiceId), KeyType: "InvoiceId" });
  await settle(data, String(body.Data?.Transaction?.PaymentId ?? ""));
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  let body: Any;
  try { body = await req.json(); } catch { return json({ error: "طلب غير صالح." }, 400); }
  try {
    if (body?.Event) return await webhook(body);
    if (body?.action === "create") return await create(req, body);
    if (body?.action === "verify") return await verify(req, body);
    return json({ error: "طلب غير صالح." }, 400);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "حدث خطأ غير متوقع." }, 500);
  }
});
