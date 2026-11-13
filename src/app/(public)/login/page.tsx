import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { PublicGate } from "@/components/layout/guards";

export const metadata: Metadata = { title: "الدخول" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return (
    <PublicGate>
      <AuthForm initialMode={mode === "signup" ? "signup" : "login"} />
    </PublicGate>
  );
}
