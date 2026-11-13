"use client";

import { useStore } from "@/lib/store";
import { STAGE_LABEL, STAGE_TRACK } from "@/lib/constants";
import { canSeeOrder, userName } from "@/lib/domain";
import { kwd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { Order } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { KeyValue, Notice } from "@/components/ui/display";
import { ErrorState } from "@/components/ui/feedback";
import { ReviewForm } from "./review-form";

type Action = { label: string; href: string } | { label: string; run: () => void };

/** What the signed-in participant can do next, derived from role + stage + payment flags. */
function nextStep(order: Order, isCustomer: boolean, run: (stage: "in_progress" | "ready" | "completed", toast: string) => void) {
  let notice = "";
  let action: Action | null = null;
  const { stage, finPaid } = order;
  if (isCustomer) {
    if (stage === "awaiting_upfront") action = { label: `ادفع المقدّم ${kwd(order.up)}`, href: routes.pay(order.id, "up") };
    else if (stage === "accepted") notice = "تم تأكيد المقدّم. الخيّاط سيبدأ العمل قريباً.";
    else if (stage === "in_progress") notice = "الخيّاط يعمل على قطعتك.";
    else if (stage === "ready" && !finPaid) action = { label: `ادفع الدفعة النهائية ${kwd(order.fin)}`, href: routes.pay(order.id, "fin") };
    else if (stage === "ready") action = { label: "أكّد الاستلام", run: () => run("completed", "اكتمل الطلب. يمكنك التقييم الآن.") };
  } else {
    if (stage === "awaiting_upfront") notice = "بانتظار دفع الزبون للمقدّم وتأكيد البوابة.";
    else if (stage === "accepted") action = { label: "بدأت العمل", run: () => run("in_progress", "الطلب الآن قيد التنفيذ.") };
    else if (stage === "in_progress") action = { label: "القطعة جاهزة", run: () => run("ready", "تم إبلاغ الزبون بأن القطعة جاهزة.") };
    else if (stage === "ready" && !finPaid) notice = "بانتظار الدفعة النهائية من الزبون عبر البوابة.";
    else if (stage === "ready") notice = "الدفعة النهائية مؤكدة. بانتظار تأكيد الزبون للاستلام.";
  }
  return { notice, action };
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const { db, user, setOrderStage } = useStore();
  const order = db.orders.find((o) => o.id === orderId);
  if (!user || !order || !canSeeOrder(order, user.email)) {
    return (
      <ErrorState title="الطلب غير موجود" message="قد لا يكون هذا الطلب يخصّ حسابك."
        action={<ButtonLink href={routes.orders} variant="outline">الطلبات</ButtonLink>} />
    );
  }

  const isCustomer = user.email === order.customer;
  const { notice, action } = nextStep(order, isCustomer, (stage, msg) => setOrderStage(order.id, stage, msg));
  const idx = order.stage === "awaiting_upfront" ? -1 : STAGE_TRACK.indexOf(order.stage);
  const chatOpen = order.upPaid;

  return (
    <div className="stack">
      <h2 style={{ fontSize: "1.125rem" }}>{order.title}</h2>
      <p className="small muted">
        {isCustomer ? `الخيّاط: ${userName(db, order.tailor)}` : `الزبون: ${userName(db, order.customer)}`}
      </p>

      <ol className="grid-4" style={{ listStyle: "none", margin: 0, padding: 0 }} aria-label="مراحل الطلب">
        {STAGE_TRACK.map((s, i) => (
          <li key={s} className={`step${i < idx ? " done" : i === idx ? " current" : ""}`} aria-current={i === idx ? "step" : undefined}>
            {STAGE_LABEL[s]}
          </li>
        ))}
      </ol>

      <div className="card stack" style={{ gap: 4, fontSize: "0.8125rem", borderRadius: 14 }}>
        <KeyValue label="المقدّم" value={`${kwd(order.up)} · ${order.upPaid ? "مدفوع" : "غير مدفوع"}`} />
        <KeyValue label="النهائي" value={`${kwd(order.fin)} · ${order.finPaid ? "مدفوع" : "غير مدفوع"}`} />
        <KeyValue strong label="الإجمالي" value={kwd(order.up + order.fin)} />
      </div>

      {notice && <Notice>{notice}</Notice>}
      {action && ("href" in action
        ? <ButtonLink href={action.href} block>{action.label}</ButtonLink>
        : <Button block onClick={action.run}>{action.label}</Button>)}

      {chatOpen
        ? <ButtonLink href={routes.chat(order.id)} variant="outline" block>فتح الدردشة</ButtonLink>
        : <Button variant="ghost" block disabled>الدردشة مقفلة حتى قبول العرض ودفع المقدّم</Button>}

      {isCustomer && order.stage === "completed" && !order.review && <ReviewForm orderId={order.id} />}
      {order.review && (
        <Notice tone="ok">التقييم: {"★".repeat(order.review.stars)} {order.review.text}</Notice>
      )}
    </div>
  );
}
