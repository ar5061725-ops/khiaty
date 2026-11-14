// check-payment: the webhook URL that MyFatoorah calls to tell us whether a payment succeeded.
//   https://<project-ref>.supabase.co/functions/v1/check-payment
// It is public (no JWT) by necessity, so it NEVER trusts the request body: it only reads the invoice id from it,
// then asks MyFatoorah (with our secret key) for the real status and records it:
//   success   -> order is updated (upfront paid -> accepted, chat opens; final paid -> ready for hand-over)
//   cancelled / rejected / pending -> recorded on the payment row, order untouched
import { cors, HttpError, json, mf, settle, type Any } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  let body: Any;
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

  try {
    if (body?.Event?.Code !== 1) return json({ ok: true, ignored: true }); // 1 = payment status changed
    const invoiceId = body.Data?.Invoice?.Id;
    if (!invoiceId) return json({ ok: true, ignored: true });

    const data = await mf("GetPaymentStatus", { Key: String(invoiceId), KeyType: "InvoiceId" });
    const result = await settle(data, String(body.Data?.Transaction?.PaymentId ?? ""));
    return json({ ok: true, status: result.status });
  } catch (e) {
    // non-200 makes MyFatoorah retry the webhook later
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
