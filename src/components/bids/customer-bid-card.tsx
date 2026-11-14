"use client";

import { useState } from "react";
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
  const [busy, setBusy] = useState(false);

  async function onAccept() {
    setBusy(true);
    const res = await acceptBid(bid.id);
    if (!res.ok) { setBusy(false); return showToast(res.error); }
    router.push(routes.pay(res.data, "up"));
  }

  async function onDecline() {
    setBusy(true);
    await declineBid(bid.id);
    setBusy(false);
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
          <Button onClick={onAccept} loading={busy} size="sm" style={{ flex: 2 }}>اقبل وادفع {kwd(v.up)}</Button>
          <Button variant="outline" size="sm" style={{ flex: 1 }} disabled={busy} onClick={onDecline}>ارفض</Button>
        </div>
      )}
    </article>
  );
}
