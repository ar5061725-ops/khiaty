"use client";

import { ErrorState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      message={error.digest ? `رمز الخطأ: ${error.digest}` : "تعذّر تحميل هذه الصفحة. حاول مرة أخرى."}
      onRetry={reset}
      action={<ButtonLink href="/" variant="outline">الصفحة الرئيسية</ButtonLink>}
    />
  );
}
