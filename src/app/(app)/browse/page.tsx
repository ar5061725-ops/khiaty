"use client";

import { useStore } from "@/lib/store";
import { BID_STATUS } from "@/lib/constants";
import { routes } from "@/lib/routes";
import { RoleGate } from "@/components/layout/guards";
import { RequestCard } from "@/components/requests/request-parts";
import { PageTitle } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";

export default function BrowsePage() {
  const { db, user } = useStore();
  const open = db.requests.filter((r) => r.status === "open");
  return (
    <RoleGate role="tailor">
      <div className="stack">
        <PageTitle>تصفّح الطلبات المفتوحة</PageTitle>
        {open.length === 0 && <EmptyState>لا توجد طلبات مفتوحة حالياً.</EmptyState>}
        {open.map((r) => {
          const mine = db.bids.find((b) => b.req === r.id && b.tailor === user?.id);
          return (
            <RequestCard key={r.id} request={r} href={routes.tailorRequest(r.id)}
              meta={<>{r.cat} · قبل {r.needBy}<br /><span style={{ color: "var(--gold-ink)" }}>
                {mine ? `عرضك: ${BID_STATUS[mine.status].label}` : "لم تقدّم عرضاً بعد"}</span></>} />
          );
        })}
      </div>
    </RoleGate>
  );
}
