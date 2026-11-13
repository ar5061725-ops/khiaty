"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { homeFor } from "@/lib/routes";
import type { Role } from "@/lib/types";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";

/** Waits for the store to hydrate, then requires a signed-in user. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, user } = useStore();
  const router = useRouter();
  useEffect(() => { if (ready && !user) router.replace("/login"); }, [ready, user, router]);
  if (!ready || !user) return <LoadingState />;
  return <>{children}</>;
}

/** Sends already-signed-in visitors of public pages (landing, login) to their home screen. */
export function PublicGate({ children }: { children: ReactNode }) {
  const { ready, user } = useStore();
  const router = useRouter();
  useEffect(() => { if (ready && user) router.replace(homeFor(user.role)); }, [ready, user, router]);
  if (!ready || user) return <LoadingState />;
  return <>{children}</>;
}

/** Restricts a screen to one role; other roles see a clear message instead of a broken page. */
export function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useStore();
  if (!user) return null;
  if (user.role !== role) {
    return (
      <ErrorState
        title="هذه الصفحة غير متاحة لحسابك"
        message={role === "customer" ? "هذه الصفحة مخصّصة للزبائن." : "هذه الصفحة مخصّصة للخيّاطين."}
        action={<ButtonLink href={homeFor(user.role)} variant="outline">العودة للرئيسية</ButtonLink>}
      />
    );
  }
  return <>{children}</>;
}
