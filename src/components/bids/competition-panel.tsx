"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { kwd } from "@/lib/format";
import type { Competition } from "@/lib/types";
import { Stat } from "@/components/ui/display";
import { Skeleton } from "@/components/ui/feedback";

/** Aggregate-only competition snapshot shown to tailors (the server never returns rival names or prices). */
export function CompetitionPanel({ requestId }: { requestId: string }) {
  const { getCompetition, db } = useStore();
  const [comp, setComp] = useState<Competition | null>(null);
  const [failed, setFailed] = useState(false);
  // refetch when the visible data changes (our own bid, realtime updates)
  const stamp = `${db.bids.length}:${db.requests.length}:${db.bids.reduce((n, b) => n + b.v.length, 0)}`;

  useEffect(() => {
    let live = true;
    getCompetition(requestId).then((res) => {
      if (!live) return;
      if (res.ok) { setComp(res.data); setFailed(false); } else setFailed(true);
    });
    return () => { live = false; };
  }, [requestId, stamp, getCompetition]);

  if (!comp && !failed) return <Skeleton height={120} />;
  return (
    <section className="card-dark" aria-label="المنافسة">
      <p style={{ fontWeight: 700 }}>المنافسة</p>
      {comp ? (
        <div className="grid-3" style={{ marginTop: 8 }}>
          <Stat label="عدد العروض" value={comp.count} tone="dark" />
          <Stat label="أقل إجمالي" value={comp.lowest == null ? "—" : kwd(comp.lowest)} tone="dark" ltr />
          <Stat label="أسرع مدة" value={comp.fastest == null ? "—" : `${comp.fastest} يوم`} tone="dark" />
        </div>
      ) : (
        <p className="small" style={{ marginTop: 8, color: "var(--gold-light)" }}>تعذّر تحميل إحصاءات المنافسة.</p>
      )}
      <p className="tiny" style={{ marginTop: 8, color: "var(--gold-light)" }}>
        ترى موقعك في المزايدة فقط، لا أسماء المنافسين ولا أسعارهم الفردية.
      </p>
    </section>
  );
}
