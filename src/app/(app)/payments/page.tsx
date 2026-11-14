import type { Metadata } from "next";
import { PaymentsList } from "@/components/orders/payments-list";

export const metadata: Metadata = { title: "المدفوعات" };

export default function PaymentsPage() {
  return <PaymentsList />;
}
