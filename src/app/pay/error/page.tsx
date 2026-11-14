import type { Metadata } from "next";
import { AuthGate } from "@/components/layout/guards";
import { PaymentError } from "@/components/orders/payment-result";

export const metadata: Metadata = { title: "تعذّر الدفع" };

export default async function PayErrorPage({ searchParams }: { searchParams: Promise<{ status?: string; order?: string }> }) {
  const { status, order } = await searchParams;
  return (
    <AuthGate>
      <PaymentError status={status ?? "rejected"} orderId={order} />
    </AuthGate>
  );
}
