"use client";

import { use } from "react";
import { useStore } from "@/lib/store";
import { competition } from "@/lib/domain";
import { routes } from "@/lib/routes";
import { RoleGate } from "@/components/layout/guards";
import { BidForm } from "@/components/bids/bid-form";
import { CompetitionPanel } from "@/components/bids/competition-panel";
import { RequestSummary } from "@/components/requests/request-parts";
import { ButtonLink } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";

export default function TailorRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, user } = useStore();
  const request = db.requests.find((r) => r.id === id);
  const myBid = db.bids.find((b) => b.req === id && b.tailor === user?.email);
  const comp = competition(db, id);

  return (
    <RoleGate role="tailor">
      {!request ? (
        <ErrorState title="الطلب غير موجود" action={<ButtonLink href={routes.browse} variant="outline">تصفّح الطلبات</ButtonLink>} />
      ) : (
        <div className="stack">
          <RequestSummary request={request} />
          <CompetitionPanel {...comp} />
          <BidForm key={myBid?.id ?? "new"} requestId={id} requestOpen={request.status === "open"} myBid={myBid} />
        </div>
      )}
    </RoleGate>
  );
}
