"use client";

import { useStore } from "@/lib/store";
import { STAGE_LABEL } from "@/lib/constants";
import { canSeeOrder, userName } from "@/lib/domain";
import { kwd } from "@/lib/format";
import { routes } from "@/lib/routes";
import { Badge, CardLink, PageTitle } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";

export default function OrdersPage() {
  const { db, user } = useStore();
  if (!user) return null;
  const orders = db.orders.filter((o) => canSeeOrder(o, user.id)).reverse();
  return (
    <div className="stack">
      <PageTitle>الطلبات المؤكدة</PageTitle>
      {orders.length === 0 && <EmptyState>لا توجد طلبات مؤكدة بعد.</EmptyState>}
      {orders.map((o) => (
        <CardLink key={o.id} href={routes.order(o.id)}>
          <div className="grow">
            <p className="card-plain-title">{o.title}</p>
            <p className="small muted" style={{ marginTop: 2 }}>
              {userName(db, user.role === "customer" ? o.tailor : o.customer)} · <span dir="ltr">{kwd(o.up + o.fin)}</span>
            </p>
          </div>
          <Badge tone="gold">{STAGE_LABEL[o.stage]}{o.stage === "ready" && o.finPaid ? " · النهائي مدفوع" : ""}</Badge>
        </CardLink>
      ))}
    </div>
  );
}
