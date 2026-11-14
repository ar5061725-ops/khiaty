"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { bidTotal, canSeeBid, userName } from "@/lib/domain";
import { kwd } from "@/lib/format";
import { LinkButton } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";

export default function BidHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, user } = useStore();
  const router = useRouter();
  const bid = db.bids.find((b) => b.id === id);
  // history is visible only to the bidding tailor and the request owner
  const allowed = bid && user && canSeeBid(db, bid, user.id) ? bid : null;

  if (!allowed) return <ErrorState title="سجل العرض غير متاح" message="العرض غير موجود أو لا تملك صلاحية عرضه." onRetry={() => router.back()} />;

  const rows = allowed.v.map((v, i) => ({ v, i })).reverse();
  return (
    <div className="stack">
      <LinkButton brand onClick={() => router.back()}>→ رجوع</LinkButton>
      <h2 style={{ fontSize: "1.125rem" }}>سجل تعديلات عرض {userName(db, allowed.tailor)}</h2>
      <p className="small muted">كل إرسال يُحفظ كنسخة جديدة ولا يُمحى. المعروض للزبون هو آخر نسخة.</p>
      {rows.map(({ v, i }) => {
        const current = i === allowed.v.length - 1;
        return (
          <div key={v.at + i} className="card" style={{ borderRadius: 14, background: current ? "var(--brand-faint)" : undefined }}>
            <div className="between">
              <strong style={{ fontSize: "0.8125rem" }}>#{i + 1}{current ? " (الحالية)" : ""}</strong>
              <strong dir="ltr" style={{ color: "var(--brand)" }}>{kwd(bidTotal(v))}</strong>
            </div>
            <p className="small muted" style={{ marginTop: 4 }}>
              مقدّم <span dir="ltr">{kwd(v.up)}</span> · نهائي <span dir="ltr">{kwd(v.fin)}</span> · {v.days} يوم
            </p>
            <p className="tiny muted ltr" style={{ marginTop: 4, textAlign: "right" }}>{v.at}</p>
          </div>
        );
      })}
    </div>
  );
}
