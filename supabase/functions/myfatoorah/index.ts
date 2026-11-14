// Customer-facing payment actions (user JWT required; verify_jwt is off so the function can answer CORS itself):
//  POST {action:"create", orderId, phase} -> creates a MyFatoorah invoice, returns {url}
//  POST {action:"verify", paymentId}       -> asks MyFatoorah whether it was paid, records the result
// The gateway-to-server webhook lives in the separate `check-payment` function.
import { admin, APP_URL, authUser, cors, HttpError, json, mf, settle, UUID_RE, type Any } from "./shared.ts";

const PHASE_LABEL = { up: "الدفعة المقدّمة", fin: "الدفعة النهائية" } as const;

async function create(req: Request, body: Any) {
  const { user, db } = await authUser(req);
  const orderId = String(body.orderId ?? "");
  const phase = body.phase;
  if (!UUID_RE.test(orderId) || (phase !== "up" && phase !== "fin")) throw new HttpError(400, "طلب غير صالح.");

  // RLS: only the two participants can read the order; only the customer may pay
  const { data: order } = await db.from("khiaty_orders")
    .select("id,title,customer_id,up,fin,stage,up_paid,fin_paid").eq("id", orderId).maybeSingle();
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
    item: `${PHASE_LABEL[phase as "up" | "fin"]} — ${order.title}`, // what the user is paying for
  });
  if (error) { console.error(error); throw new HttpError(500, "تعذّر إنشاء الدفعة."); }
  return json({ url: inv.InvoiceURL });
}

async function verify(req: Request, body: Any) {
  const { user } = await authUser(req);
  const paymentId = String(body.paymentId ?? "");
  if (!/^[A-Za-z0-9-]{4,64}$/.test(paymentId)) throw new HttpError(400, "رقم الدفعة غير صالح.");
  const data = await mf("GetPaymentStatus", { Key: paymentId, KeyType: "PaymentId" });
  return json(await settle(data, paymentId, user.id));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  let body: Any;
  try { body = await req.json(); } catch { return json({ error: "طلب غير صالح." }, 400); }
  try {
    if (body?.action === "create") return await create(req, body);
    if (body?.action === "verify") return await verify(req, body);
    return json({ error: "طلب غير صالح." }, 400);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "حدث خطأ غير متوقع." }, 500);
  }
});
