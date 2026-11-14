"use client";

import { useStore } from "@/lib/store";
import { kwd } from "@/lib/format";
import { routes } from "@/lib/routes";
import { ButtonLink } from "@/components/ui/button";
import { KeyValue } from "@/components/ui/display";
import { LoadingState } from "@/components/ui/feedback";

/** Shown after MyFatoorah confirmed the payment (status = success). */
export function PaymentSuccess({ orderId }: { orderId: string }) {
  const { db, ready } = useStore();
  if (!ready) return <LoadingState />;
  const pay = db.payments.find((p) => p.order === orderId && p.status === "success");
  const order = db.orders.find((o) => o.id === orderId);

  return (
    <main className="main">
      <section className="centered" role="status" style={{ gap: 16 }}>
        <p style={{ fontSize: "3rem" }} aria-hidden="true">✅</p>
        <h1 style={{ fontSize: "1.375rem" }}>تمّت عملية الدفع بنجاح</h1>
        <p className="muted small">
          {order?.stage === "accepted" && pay?.phase === "up"
            ? "تم قبول طلبك وفُتحت الدردشة مع الخيّاط."
            : "سُجّلت دفعتك وحُدّثت حالة الطلب."}
        </p>
        {pay && (
          <div className="card stack" style={{ gap: 4, fontSize: "0.875rem", width: "100%", textAlign: "start" }}>
            <KeyValue label="البند" value={pay.item} />
            <KeyValue label="المبلغ" value={kwd(pay.amount)} />
            {pay.invoiceId != null && <KeyValue label="رقم الفاتورة" value={pay.invoiceId} />}
          </div>
        )}
        <div className="stack" style={{ gap: 8, width: "100%" }}>
          {order && <ButtonLink href={routes.order(order.id)} block>عرض الطلب</ButtonLink>}
          <ButtonLink href={routes.payments} variant="outline" block>سجل المدفوعات</ButtonLink>
        </div>
      </section>
    </main>
  );
}

const ERROR_TEXT = {
  cancelled: { title: "أُلغيت عملية الدفع", body: "ألغيتَ الدفع قبل إتمامه. لم يُخصم أي مبلغ." },
  rejected: { title: "رُفضت عملية الدفع", body: "لم تُقبل العملية من البنك أو البوابة. لم يُخصم أي مبلغ، ويمكنك المحاولة مرة أخرى." },
} as const;

/** Shown when the payment was cancelled or rejected. */
export function PaymentError({ status, orderId }: { status: string; orderId?: string }) {
  const { db, ready } = useStore();
  if (!ready) return <LoadingState />;
  const text = ERROR_TEXT[status === "cancelled" ? "cancelled" : "rejected"];
  const order = orderId ? db.orders.find((o) => o.id === orderId) : undefined;
  // offer a retry only when something is still due on that order
  const dueUp = order && !order.upPaid;
  const dueFin = order && order.stage === "ready" && !order.finPaid;
  const retry = order && (dueUp ? routes.pay(order.id, "up") : dueFin ? routes.pay(order.id, "fin") : null);

  return (
    <main className="main">
      <section className="centered" role="alert" style={{ gap: 16 }}>
        <p style={{ fontSize: "3rem" }} aria-hidden="true">❌</p>
        <h1 style={{ fontSize: "1.375rem" }}>{text.title}</h1>
        <p className="muted small">{text.body}</p>
        <div className="stack" style={{ gap: 8, width: "100%" }}>
          {retry && <ButtonLink href={retry} block>حاول الدفع مرة أخرى</ButtonLink>}
          {order && <ButtonLink href={routes.order(order.id)} variant="outline" block>العودة للطلب</ButtonLink>}
          <ButtonLink href={routes.payments} variant="ghost" block>سجل المدفوعات</ButtonLink>
        </div>
      </section>
    </main>
  );
}
