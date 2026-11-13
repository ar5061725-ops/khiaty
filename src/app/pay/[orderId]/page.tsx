import type { Metadata } from "next";
import { AuthGate } from "@/components/layout/guards";
import { Gateway } from "@/components/orders/gateway";

export const metadata: Metadata = { title: "بوابة الدفع" };

export default async function PayPage({
  params, searchParams,
}: { params: Promise<{ orderId: string }>; searchParams: Promise<{ phase?: string }> }) {
  const [{ orderId }, { phase }] = await Promise.all([params, searchParams]);
  return (
    <AuthGate>
      <Gateway orderId={orderId} phase={phase === "fin" ? "fin" : "up"} />
    </AuthGate>
  );
}
