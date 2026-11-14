"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { canSeeOrder, userName } from "@/lib/domain";
import { routes } from "@/lib/routes";
import { Button, ButtonLink, LinkButton } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";

export function ChatWindow({ orderId }: { orderId: string }) {
  const { db, user, sendMessage } = useStore();
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const order = db.orders.find((o) => o.id === orderId);
  const msgs = db.msgs[orderId] ?? [];

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  if (!user || !order || !canSeeOrder(order, user.id)) {
    return <ErrorState title="المحادثة غير متاحة" action={<ButtonLink href={routes.orders} variant="outline">الطلبات</ButtonLink>} />;
  }
  if (!order.upPaid) {
    return (
      <ErrorState title="الدردشة مقفلة" message="تُفتح الدردشة بعد قبول العرض ودفع المقدّم."
        action={<ButtonLink href={routes.order(order.id)} variant="outline">رجوع للطلب</ButtonLink>} />
    );
  }

  const other = user.id === order.customer ? order.tailor : order.customer;

  function onSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(orderId, draft);
    setDraft("");
  }

  return (
    <div className="stack" style={{ flex: 1 }}>
      <LinkButton brand onClick={() => router.push(routes.order(order.id))}>→ رجوع للطلب</LinkButton>
      <p style={{ fontWeight: 700 }}>{userName(db, other)}</p>
      <div className="stack" style={{ gap: 8, flex: 1 }} role="log" aria-live="polite" aria-label="الرسائل">
        {msgs.map((m, i) => {
          const mine = m.from === user.id;
          return (
            <div key={i} className={`chat-row ${mine ? "mine" : "theirs"}`}>
              <p className={`bubble ${mine ? "mine" : "theirs"}`}>{m.text}</p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSend} className="row" style={{ position: "sticky", bottom: 0, background: "var(--bg)", paddingBlock: 8 }}>
        <input className="input grow" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="اكتب رسالة…" aria-label="رسالة" maxLength={1000} />
        <Button type="submit" style={{ minWidth: 72 }} disabled={!draft.trim()}>إرسال</Button>
      </form>
    </div>
  );
}
