import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./feedback";

type Variant = "primary" | "outline" | "gold" | "gateway" | "ghost";
type Size = "md" | "sm";

const VARIANT: Record<Variant, string> = {
  primary: "btn-primary",
  outline: "btn-outline",
  gold: "btn-gold",
  gateway: "btn-gateway",
  ghost: "btn-ghost-line",
};

function classes(variant: Variant, size: Size, block?: boolean) {
  return ["btn", VARIANT[variant], size === "sm" && "btn-sm", block && "btn-block"].filter(Boolean).join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", block, loading, disabled, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={classes(variant, size, block)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({ href, variant = "primary", size = "md", block, children }: {
  href: string; variant?: Variant; size?: Size; block?: boolean; children: ReactNode;
}) {
  return <Link href={href} className={classes(variant, size, block)}>{children}</Link>;
}

/** Text-style button used for secondary actions ("view history", "back"). */
export function LinkButton({ brand, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { brand?: boolean }) {
  return <button type="button" className={`link-btn${brand ? " brand" : ""}`} {...rest} />;
}
