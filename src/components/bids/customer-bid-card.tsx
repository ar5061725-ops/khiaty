"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { BID_STATUS } from "@/lib/constants";
import { bidTotal, completedOf, lastVersion, ratingOf, userName } from "@/lib/domain";
import { kwd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { Bid } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, Stat } from "@/components/ui/display";

/** A single tailor offer as seen by the request owner (the only role allowed to see rivals). */
export function CustomerBidCard({ bid, canAct, requestId }: { bid: Bid; canAct: boolean; requestId: string }) {
  const { db, acceptBid, declineBid, showToast } = useStore();
  const router = useRouter();
  const v = lastVersion(bid);
  const st = BID_STATUS[bid.status];

  function onAccept() {
    const res = acceptBid(bid.id);
    if (!res.ok) return showToast(res.error);
    router.push(routes.pay(res.data, "up"));
  }

  return (
    <article className="card stack" style={{ gap: 8, borderColor: bid.status === "accepted" ? "var(--ok)" : undefined }}>
      <div className="between" style={{ alignItems: "flex-start" }}>
        <div>
          <p style={{ fontWeight: 700 }}>{userName(db, bid.tailor)}</p>
          <p className="small" style={{ color: "var(--gold-ink)", marginTop: 2 }}>
            ★ {ratingOf(db, bid.tailor)} · {completedOf(db, bid.tailor)} عملاً مكتملاً
          </p>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>

      <div className="grid-4">
        <Stat label="مقدّم" value={kwd(v.up)} ltr />
        <Stat label="نهائي" value={kwd(v.fin)} ltr />
        <Stat label="الإجمالي" value={kwd(bidTotal(v))} tone="hl" ltr />
        <Stat label="المدة" value={`${v.days} يوم`} />
      </div>

      {v.note && <p className="small" style={{ lineHeight: 1.7 }}>{v.note}</p>}

      <ButtonLink href={routes.bidHistory(bid.id)} variant="ghost" size="sm">
        شاهد كيف تغيّر هذا العرض ({bid.v.length} نسخ)
      </ButtonLink>

      {canAct && (
        <div className="row">
          <Button onClick={onAccept} size="sm" style={{ flex: 2 }}>اقبل وادفع {kwd(v.up)}</Button>
          <Button variant="outline" size="sm" style={{ flex: 1 }} onClick={() => declineBid(bid.id)}>ارفض</Button>
        </div>
      )}
    </article>
  );
}
