"use client";

import { useStore } from "@/lib/store";
import { PAYMENT_STATUS } from "@/lib/constants";
import { formatKuwait, kwd } from "@/lib/format";
import { routes } from "@/lib/routes";
import { Badge, CardLink, PageTitle } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";

/** The signed-in user's payments: what was paid for, invoice number, amount, and its status. */
export function PaymentsList() {
  const { db, user } = useStore();
  if (!user) return null;
  const isCustomer = user.role === "customer";

  return (
    <div className="stack">
      <PageTitle>{isCustomer ? "مدفوعاتي" : "المدفوعات المستلمة"}</PageTitle>
      {db.payments.length === 0 && (
        <EmptyState>{isCustomer ? "لا توجد مدفوعات بعد. ستظهر هنا بعد أول عملية دفع." : "لا توجد مدفوعات مستلمة بعد."}</EmptyState>
      )}
      {db.payments.map((p) => {
        const st = PAYMENT_STATUS[p.status];
        return (
          <CardLink key={p.id} href={routes.order(p.order)}>
            <div className="grow stack" style={{ gap: 4 }}>
              <p className="card-plain-title">{p.item}</p>
              <p className="small muted">
                <span dir="ltr">{kwd(p.amount)}</span>
                {p.invoiceId != null && <> · فاتورة <span dir="ltr">#{p.invoiceId}</span></>}
              </p>
              <p className="tiny muted ltr" style={{ textAlign: "right" }}>{formatKuwait(p.createdAt)}</p>
            </div>
            <Badge tone={st.tone}>{st.label}</Badge>
          </CardLink>
        );
      })}
    </div>
  );
}
