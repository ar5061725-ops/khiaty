"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { navFor } from "@/lib/routes";
import { Logo } from "./logo";
import { Toast } from "@/components/ui/feedback";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  if (!user) return null;
  const items = navFor(user.role);

  return (
    <>
      <header className="app-header">
        <div className="app-header-top">
          <Logo />
          <div className="row" style={{ gap: 6 }}>
            <span className="small muted">{user.name} · {user.role === "customer" ? "زبون" : "خيّاط"}</span>
            <button type="button" className="btn btn-sm btn-ghost-line" onClick={() => { signOut(); router.replace("/login"); }}>
              خروج
            </button>
          </div>
        </div>
        <nav className="nav" aria-label="القائمة">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link" aria-current={pathname === n.href ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="main">{children}</main>
      <Toast />
    </>
  );
}
