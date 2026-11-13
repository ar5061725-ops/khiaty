import type { Metadata } from "next";
import { RoleGate } from "@/components/layout/guards";
import { NewRequestForm } from "@/components/requests/new-request-form";

export const metadata: Metadata = { title: "طلب جديد" };

export default function NewRequestPage() {
  return (
    <RoleGate role="customer">
      <NewRequestForm />
    </RoleGate>
  );
}
