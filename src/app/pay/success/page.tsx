import type { Metadata } from "next";
import { AuthGate } from "@/components/layout/guards";
import { PaymentSuccess } from "@/components/orders/payment-result";

export const metadata: Metadata = { title: "تمّت عملية الدفع" };

export default async function PaySuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <AuthGate>
      <PaymentSuccess orderId={order ?? ""} />
    </AuthGate>
  );
}
