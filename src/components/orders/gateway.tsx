"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { userName } from "@/lib/domain";
import { kwd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { PayPhase } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { KeyValue } from "@/components/ui/display";
import { ErrorState, FormError } from "@/components/ui/feedback";

const SANDBOX = process.env.NEXT_PUBLIC_PAYMENTS_SANDBOX !== "false";

/** Pre-payment summary. The card is entered on MyFatoorah's hosted page, never in this app. */
export function Gateway({ orderId, phase }: { orderId: string; phase: PayPhase }) {
  const { db, user, startPayment } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const order = db.orders.find((o) => o.id === orderId);
  const payable = !!order && !!user && order.customer === user.id
    && (phase === "up" ? !order.upPaid : order.stage === "ready" && !order.finPaid);

  if (!order || !payable) {
    return (
      <main className="main">
        <ErrorState title="لا توجد دفعة مستحقة" message="الطلب غير موجود أو تم دفع هذه الدفعة مسبقاً."
          action={<ButtonLink href={routes.orders} variant="outline">الطلبات</ButtonLink>} />
      </main>
    );
  }

  const amount = kwd(phase === "up" ? order.up : order.fin);

  async function pay() {
    setError("");
    setBusy(true);
    const res = await startPayment(orderId, phase);
    if (!res.ok) { setBusy(false); return setError(res.error); }
    window.location.assign(res.data); // hand over to MyFatoorah's payment page
  }

  return (
    <main className="main">
      <section className="gateway" aria-label="الدفع">
        {SANDBOX && <span className="badge tone-warn ltr" style={{ alignSelf: "flex-start" }}>SANDBOX</span>}
        <p className="small" style={{ color: "#4a5568" }}>
          سيتم تحويلك إلى صفحة الدفع الآمنة في ماي فاتورة. تُدخل بيانات البطاقة هناك فقط، ولا يستلمها تطبيق خياطتي.
          {SANDBOX && " (بيئة تجريبية: لن يُخصم أي مبلغ حقيقي.)"}
        </p>
        <div className="card stack" style={{ gap: 4, fontSize: "0.875rem", borderRadius: 12 }}>
          <KeyValue label="العميل" value={userName(db, order.customer)} />
          <KeyValue label="الطلب" value={order.title} />
          <KeyValue label="الدفعة" value={phase === "up" ? "الدفعة المقدّمة" : "الدفعة النهائية"} />
          <KeyValue label="المبلغ" value={amount} />
        </div>
        <FormError message={error} />
        <div className="stack" style={{ gap: 8 }}>
          <Button variant="gateway" block loading={busy} onClick={pay}>ادفع {amount} عبر ماي فاتورة</Button>
          <ButtonLink href={routes.order(orderId)} variant="ghost" block>رجوع للطلب</ButtonLink>
        </div>
      </section>
    </main>
  );
}
