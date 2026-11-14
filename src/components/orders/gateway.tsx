"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PAY_METHODS } from "@/lib/constants";
import { userName } from "@/lib/domain";
import { kwd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { PayPhase } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { KeyValue } from "@/components/ui/display";
import { ChoiceGroup } from "@/components/ui/form";
import { ErrorState, FormError, Spinner, Toast } from "@/components/ui/feedback";

/** Simulated external payment page. In production this is a redirect to the real gateway + webhook. */
export function Gateway({ orderId, phase }: { orderId: string; phase: PayPhase }) {
  const { db, user, confirmPayment, showToast } = useStore();
  const router = useRouter();
  const [method, setMethod] = useState<(typeof PAY_METHODS)[number]>("KNET");
  const [waiting, setWaiting] = useState(false);
  const [payError, setPayError] = useState("");

  const order = db.orders.find((o) => o.id === orderId);
  const payable = !!order && !!user && order.customer === user.id && (phase === "up" ? !order.upPaid : order.stage === "ready" && !order.finPaid);

  // once the webhook fires the payment flips to "paid", so keep the waiting UI until we navigate away
  if (!order || (!payable && !waiting)) {
    return (
      <main className="main">
        <ErrorState title="لا توجد دفعة مستحقة" message="الطلب غير موجود أو تم دفع هذه الدفعة مسبقاً."
          action={<ButtonLink href={routes.orders} variant="outline">الطلبات</ButtonLink>} />
      </main>
    );
  }

  const amount = kwd(phase === "up" ? order.up : order.fin);

  async function pay() {
    setPayError("");
    setWaiting(true);
    // simulated gateway round-trip, then the "webhook" confirms the payment on the server
    await new Promise((r) => setTimeout(r, 1400));
    const res = await confirmPayment(orderId, phase);
    if (!res.ok) { setWaiting(false); return setPayError(res.error); }
    router.replace(routes.order(orderId));
  }

  function cancel() {
    showToast("تم إلغاء الدفع. لم يُخصم أي مبلغ.");
    router.replace(routes.order(orderId));
  }

  return (
    <main className="main">
      <section className="gateway" aria-label="بوابة الدفع">
        <span className="badge tone-warn ltr" style={{ alignSelf: "flex-start" }}>SANDBOX</span>
        <p className="small" style={{ color: "#4a5568" }}>
          صفحة بوابة الدفع الخارجية (ماي فاتورة) — محاكاة. بيانات البطاقة تُدخل هنا لدى البوابة، ولا يستلمها تطبيق خياطتي.
        </p>
        <div className="card stack" style={{ gap: 4, fontSize: "0.875rem", borderRadius: 12 }}>
          <KeyValue label="العميل" value={userName(db, order.customer)} />
          <KeyValue label="الدفعة" value={phase === "up" ? "الدفعة المقدّمة" : "الدفعة النهائية"} />
          <KeyValue label="المبلغ" value={amount} />
        </div>
        <ChoiceGroup legend="طريقة الدفع" options={PAY_METHODS} value={method} onChange={setMethod} variant="gw" />

        <FormError message={payError} />
        {waiting ? (
          <p className="card row" role="status" style={{ justifyContent: "center", gap: 8, fontSize: "0.8125rem", borderRadius: 12 }}>
            <Spinner />
            تمت العملية لدى البوابة. بانتظار إشعار البوابة للخادم (Webhook)…
          </p>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            <Button variant="gateway" block onClick={pay}>ادفع {amount}</Button>
            <Button variant="ghost" block onClick={cancel} style={{ border: 0, background: "transparent", color: "#4a5568", textDecoration: "underline" }}>
              إلغاء والعودة لخياطتي
            </Button>
          </div>
        )}
      </section>
      <Toast />
    </main>
  );
}
