"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { BID_STATUS } from "@/lib/constants";
import { lastVersion } from "@/lib/domain";
import { kwd, parseNum } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { Bid } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/display";
import { InputField, TextAreaField } from "@/components/ui/form";
import { FormError } from "@/components/ui/feedback";

/** Tailor's create/edit-offer panel. Every submit appends a new immutable version. */
export function BidForm({ requestId, requestOpen, myBid }: { requestId: string; requestOpen: boolean; myBid?: Bid }) {
  const { submitBid } = useStore();
  const initial = myBid ? lastVersion(myBid) : null;
  const [up, setUp] = useState(initial ? String(initial.up) : "");
  const [fin, setFin] = useState(initial ? String(initial.fin) : "");
  const [days, setDays] = useState(initial ? String(initial.days) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canBid = requestOpen && (!myBid || myBid.status === "pending" || myBid.status === "declined");
  const upN = parseNum(up);
  const finN = parseNum(fin);
  const total = upN >= 0 && finN >= 0 ? kwd(upN + finN) : "—";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const d = parseNum(days);
    if (!(upN >= 0) || !(finN >= 0) || upN + finN <= 0) return setError("أدخل مبالغ صحيحة (المجموع أكبر من صفر).");
    if (!(Number.isInteger(d) && d >= 1 && d <= 365)) return setError("المدة رقم صحيح بين 1 و365 يوماً.");
    if (note.length > 500) return setError("الملاحظة طويلة جداً.");
    setBusy(true);
    const res = await submitBid(requestId, { up: upN, fin: finN, days: d, note });
    setBusy(false);
    setError(res.ok ? "" : res.error);
  }

  return (
    <section className="card stack" style={{ gap: 8 }} aria-label="العرض">
      <div className="between">
        <p style={{ fontWeight: 700 }}>{myBid ? "عرضك — تعديل العرض" : "عرضك"}</p>
        {myBid && <Badge tone={BID_STATUS[myBid.status].tone}>{BID_STATUS[myBid.status].label}</Badge>}
      </div>

      {canBid ? (
        <form onSubmit={onSubmit} className="stack" style={{ gap: 8 }} noValidate>
          <div className="grid-3">
            <InputField label="المقدّم" dir="ltr" inputMode="decimal" value={up} onChange={(e) => { setUp(e.target.value); setError(""); }} />
            <InputField label="النهائي" dir="ltr" inputMode="decimal" value={fin} onChange={(e) => { setFin(e.target.value); setError(""); }} />
            <InputField label="المدة (يوم)" dir="ltr" inputMode="numeric" value={days} onChange={(e) => { setDays(e.target.value); setError(""); }} />
          </div>
          <p style={{ fontSize: "0.8125rem" }}>الإجمالي: <strong dir="ltr" style={{ color: "var(--brand)" }}>{total}</strong></p>
          <TextAreaField label="ملاحظة للزبون (اختياري)" rows={2} value={note} placeholder="فكرة القماش، ما ستقوم به…"
            onChange={(e) => setNote(e.target.value)} />
          <FormError message={error} />
          <Button type="submit" loading={busy}>{myBid ? "إرسال نسخة معدّلة" : "إرسال العرض"}</Button>
          {myBid && <p className="tiny" style={{ color: "var(--warn)" }}>تنبيه: الزبون يرى كل نسخ عرضك، لا آخر الأرقام فقط.</p>}
        </form>
      ) : (
        <p className="muted" style={{ fontSize: "0.8125rem" }}>
          {myBid?.status === "accepted" ? "تم قبول عرضك. تابع من صفحة الطلبات." : "هذا الطلب لم يعد يستقبل عروضاً."}
        </p>
      )}

      {myBid && (
        <ButtonLink href={routes.bidHistory(myBid.id)} variant="ghost" size="sm">
          سجل تعديلاتي ({myBid.v.length} نسخ)
        </ButtonLink>
      )}
    </section>
  );
}
