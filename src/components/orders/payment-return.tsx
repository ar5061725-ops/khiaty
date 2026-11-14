"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { ButtonLink } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/feedback";

type Phase = "checking" | "pending" | "error";
const MAX_TRIES = 6;
const WAIT_MS = 3000;

/**
 * Landing page after MyFatoorah's hosted payment page. Asks the server to confirm the payment, then routes:
 *   success            -> /pay/success
 *   cancelled/rejected -> /pay/error
 *   still processing   -> stays here and keeps polling (the check-payment webhook may confirm it meanwhile)
 */
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
      const { status, orderId } = res.data;
      if (status === "success") return router.replace(routes.paySuccess(orderId ?? ""));
      if (status === "cancelled" || status === "rejected") return router.replace(routes.payError(status, orderId));
      if (status === "ignored") return router.replace(routes.payError("rejected", orderId));
      await new Promise((r) => setTimeout(r, WAIT_MS)); // still processing: the gateway may be slow
    }
    setPhase("pending");
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!paymentId) { router.replace(routes.payError("rejected")); return; }
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "checking") return <LoadingState text="جارٍ تأكيد الدفع مع ماي فاتورة…" />;
  if (phase === "pending") {
    return (
      <ErrorState title="الدفع قيد المعالجة" message="لم يصلنا تأكيد الدفع بعد. إن خُصم المبلغ فسيظهر التأكيد تلقائياً خلال دقائق."
        onRetry={() => { void check(); }}
        action={<ButtonLink href={routes.payments} variant="outline">المدفوعات</ButtonLink>} />
    );
  }
  return (
    <ErrorState title="تعذّر التحقق من الدفع" message={message}
      onRetry={() => void check()} action={<ButtonLink href={routes.payments} variant="outline">المدفوعات</ButtonLink>} />
  );
}
