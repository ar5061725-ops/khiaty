"use client";

import { useStore } from "@/lib/store";
import { bidsFor } from "@/lib/domain";
import { routes } from "@/lib/routes";
import { RoleGate } from "@/components/layout/guards";
import { RequestCard, requestStatusLabel } from "@/components/requests/request-parts";
import { ButtonLink } from "@/components/ui/button";
import { Badge, PageTitle } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";

export default function MyRequestsPage() {
  const { db, user } = useStore();
  const mine = db.requests.filter((r) => r.customer === user?.id).reverse();
  return (
    <RoleGate role="customer">
      <div className="stack">
        <PageTitle action={<ButtonLink href={routes.newRequest} size="sm">+ انشر طلباً</ButtonLink>}>طلباتي</PageTitle>
        {mine.length === 0 && <EmptyState>لا توجد طلبات بعد. انشري أول طلب.</EmptyState>}
        {mine.map((r) => (
          <RequestCard key={r.id} request={r} href={routes.request(r.id)}
            meta={`${r.cat} · ${requestStatusLabel(r)}`}
            trailing={<Badge tone="brand">{bidsFor(db, r.id).length} عروض</Badge>} />
        ))}
      </div>
    </RoleGate>
  );
}
