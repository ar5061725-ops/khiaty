import Link from "next/link";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/constants";

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function Notice({ tone = "warn", children }: { tone?: Tone; children: ReactNode }) {
  return <p className={`notice tone-${tone}`}>{children}</p>;
}

export function Thumb({ cat, hasImage, size = 56 }: { cat: string; hasImage: boolean; size?: number }) {
  return (
    <div className={`thumb ${hasImage ? "thumb-img" : "thumb-letter"}`} style={{ width: size, height: size, fontSize: size * 0.43 }} aria-hidden="true">
      {hasImage ? "" : cat.charAt(0)}
    </div>
  );
}

/** Label-over-value tile used for amounts, durations and competition stats. */
export function Stat({ label, value, tone, ltr }: { label: string; value: ReactNode; tone?: "hl" | "dark"; ltr?: boolean }) {
  return (
    <div className={`stat${tone ? ` ${tone}` : ""}`}>
      <span>{label}</span>
      <strong dir={ltr ? "ltr" : undefined}>{value}</strong>
    </div>
  );
}

/** A tappable list row that navigates (cards in "my requests", "orders", etc.). */
export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="card card-link">{children}</Link>;
}

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="between">
      <h2 style={{ fontSize: "1.25rem" }}>{children}</h2>
      {action}
    </div>
  );
}

export function BackLink({ href, children = "→ رجوع" }: { href: string; children?: ReactNode }) {
  return <Link href={href} className="link-btn brand">{children}</Link>;
}

export function KeyValue({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="between" style={strong ? { borderTop: "1px solid var(--line)", paddingTop: 6, fontWeight: 700 } : undefined}>
      <span>{label}</span>
      <span dir="ltr">{value}</span>
    </div>
  );
}
