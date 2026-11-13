"use client";

import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Button } from "./button";

export function Spinner({ large, label }: { large?: boolean; label?: string }) {
  return <span className={`spinner${large ? " lg" : ""}`} role="status" aria-label={label ?? "جارٍ التحميل"} />;
}

/** Full-area loading state (route transitions, store hydration). */
export function LoadingState({ text = "جارٍ التحميل…" }: { text?: string }) {
  return (
    <div className="centered" aria-live="polite">
      <Spinner large />
      <p className="muted small">{text}</p>
    </div>
  );
}

export function Skeleton({ height = 72 }: { height?: number }) {
  return <div className="skeleton" style={{ height }} aria-hidden="true" />;
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="stack" aria-busy="true" aria-label="جارٍ التحميل">
      <Skeleton height={28} />
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} />)}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

/** Inline form/validation error, announced to screen readers. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="field-error">{message}</p>;
}

/** Recoverable error with an optional retry (used by error boundaries and missing records). */
export function ErrorState({ title = "حدث خطأ غير متوقع", message, onRetry, action }: {
  title?: string; message?: string; onRetry?: () => void; action?: ReactNode;
}) {
  return (
    <div className="centered" role="alert">
      <p style={{ fontSize: "2rem" }} aria-hidden="true">⚠️</p>
      <h2 style={{ fontSize: "1.125rem" }}>{title}</h2>
      {message && <p className="muted small">{message}</p>}
      <div className="row">
        {onRetry && <Button onClick={onRetry}>إعادة المحاولة</Button>}
        {action}
      </div>
    </div>
  );
}

export function Toast() {
  const { toast, showToast } = useStore();
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{toast}</span>
      <button type="button" aria-label="إغلاق" onClick={() => showToast("")}>×</button>
    </div>
  );
}
