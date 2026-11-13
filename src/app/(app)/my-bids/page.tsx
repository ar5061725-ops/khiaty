"use client";

import { useStore } from "@/lib/store";
import { BID_STATUS } from "@/lib/constants";
import { bidTotal, lastVersion } from "@/lib/domain";
import { kwd } from "@/lib/format";
import { routes } from "@/lib/routes";
import { RoleGate } from "@/components/layout/guards";
import { Badge, CardLink, PageTitle } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";

export default function MyBidsPage() {
  const { db, user } = useStore();
  const mine = db.bids.filter((b) => b.tailor === user?.email);
  return (
    <RoleGate role="tailor">
      <div className="stack">
        <PageTitle>عروضي</PageTitle>
        {mine.length === 0 && <EmptyState>لم تقدّم عروضاً بعد.</EmptyState>}
        {mine.map((b) => {
          const req = db.requests.find((r) => r.id === b.req);
          const st = BID_STATUS[b.status];
          return (
            <CardLink key={b.id} href={routes.tailorRequest(b.req)}>
              <div className="grow">
                <p className="card-plain-title">{req?.title ?? "طلب محذوف"}</p>
                <p className="small muted" style={{ marginTop: 2 }}>
                  النسخة #{b.v.length} · <span dir="ltr">{kwd(bidTotal(lastVersion(b)))}</span>
                </p>
              </div>
              <Badge tone={st.tone}>{st.label}</Badge>
            </CardLink>
          );
        })}
      </div>
    </RoleGate>
  );
}
