"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/feedback";

type Phase = "checking" | "pending" | "failed" | "error";
const MAX_TRIES = 6;
const WAIT_MS = 3000;

/** Landing page after MyFatoorah's hosted payment page: asks the server to confirm the payment. */
export function PaymentReturn({ paymentId }: { paymentId: string }) {
  const { verifyPayment } = useStore();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  async function check() {
    setPhase("checking");
    for (let i = 0; i < MAX_TRIES; i++) {
      const res = await verifyPayment(paymentId);
      if (!res.ok) { setMessage(res.error); return setPhase("error"); }
      if (res.data === "paid") return router.replace(routes.orders);
      if (res.data === "failed" || res.data === "ignored") return setPhase("failed");
      await new Promise((r) => setTimeout(r, WAIT_MS)); // still processing: gateway may be slow
    }
    setPhase("pending");
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!paymentId) { setPhase("failed"); return; }
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "checking") return <LoadingState text="جارٍ تأكيد الدفع مع ماي فاتورة…" />;
  if (phase === "pending") {
    return (
      <ErrorState title="الدفع قيد المعالجة" message="لم يصلنا تأكيد الدفع بعد. إن خُصم المبلغ فسيظهر التأكيد تلقائياً خلال دقائق."
        onRetry={() => { started.current = true; void check(); }}
        action={<ButtonLink href={routes.orders} variant="outline">الطلبات</ButtonLink>} />
    );
  }
  if (phase === "error") {
    return (
      <ErrorState title="تعذّر التحقق من الدفع" message={message}
        onRetry={() => void check()} action={<ButtonLink href={routes.orders} variant="outline">الطلبات</ButtonLink>} />
    );
  }
  return (
    <ErrorState title="لم تكتمل عملية الدفع" message="لم يُخصم أي مبلغ. يمكنك المحاولة مرة أخرى من صفحة الطلب."
      action={<><ButtonLink href={routes.orders}>الطلبات</ButtonLink><Button variant="ghost" onClick={() => router.back()}>رجوع</Button></>} />
  );
}
