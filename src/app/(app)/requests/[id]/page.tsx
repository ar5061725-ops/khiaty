"use client";

import { use } from "react";
import { useStore } from "@/lib/store";
import { bidsFor, bidTotal, lastVersion } from "@/lib/domain";
import { routes } from "@/lib/routes";
import { RoleGate } from "@/components/layout/guards";
import { CustomerBidCard } from "@/components/bids/customer-bid-card";
import { RequestSummary } from "@/components/requests/request-parts";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/feedback";

export default function CustomerRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, user } = useStore();
  const request = db.requests.find((r) => r.id === id && r.customer === user?.email);

  return (
    <RoleGate role="customer">
      {!request ? (
        <ErrorState title="الطلب غير موجود" message="قد يكون محذوفاً أو لا يخصّ حسابك."
          action={<ButtonLink href={routes.requests} variant="outline">طلباتي</ButtonLink>} />
      ) : (
        <div className="stack">
          <RequestSummary request={request} extra={`${bidsFor(db, id).length} عروض`} />
          {bidsFor(db, id).length === 0 && <EmptyState>لا توجد عروض بعد. سنُعلمك فور وصول أول عرض.</EmptyState>}
          {bidsFor(db, id)
            .slice()
            .sort((a, b) => bidTotal(lastVersion(a)) - bidTotal(lastVersion(b)))
            .map((b) => (
              <CustomerBidCard key={b.id} bid={b} requestId={id} canAct={request.status === "open" && b.status === "pending"} />
            ))}
        </div>
      )}
    </RoleGate>
  );
}
