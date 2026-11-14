import type { Metadata } from "next";
import { AuthGate } from "@/components/layout/guards";
import { PaymentReturn } from "@/components/orders/payment-return";

export const metadata: Metadata = { title: "تأكيد الدفع" };

// MyFatoorah appends ?paymentId=...&Id=... to the callback URL
export default async function PayReturnPage({ searchParams }: { searchParams: Promise<{ paymentId?: string; Id?: string }> }) {
  const { paymentId, Id } = await searchParams;
  return (
    <AuthGate>
      <PaymentReturn paymentId={paymentId ?? Id ?? ""} />
    </AuthGate>
  );
}
