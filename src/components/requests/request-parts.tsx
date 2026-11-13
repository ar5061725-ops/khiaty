import type { ReactNode } from "react";
import type { TailorRequest } from "@/lib/types";
import { budgetLabel } from "@/lib/domain";
import { CardLink, Thumb } from "@/components/ui/display";

export const requestStatusLabel = (r: TailorRequest) => (r.status === "open" ? "مفتوح" : "تم الاختيار");

/** List row used by "my requests" (customer) and "browse requests" (tailor). */
export function RequestCard({ request, href, meta, trailing }: {
  request: TailorRequest; href: string; meta: ReactNode; trailing?: ReactNode;
}) {
  return (
    <CardLink href={href}>
      <Thumb cat={request.cat} hasImage={request.img} />
      <div className="grow">
        <p className="card-plain-title">{request.title}</p>
        <p className="small muted" style={{ marginTop: 2 }}>{meta}</p>
      </div>
      {trailing}
    </CardLink>
  );
}

/** Title, description and budget block shared by the customer and tailor request pages. */
export function RequestSummary({ request, extra }: { request: TailorRequest; extra?: string }) {
  return (
    <>
      <div className="row" style={{ gap: 12 }}>
        <Thumb cat={request.cat} hasImage={request.img} size={64} />
        <div>
          <h2 style={{ fontSize: "1.125rem" }}>{request.title}</h2>
          <p className="small muted" style={{ marginTop: 2 }}>
            {request.cat} · {requestStatusLabel(request)}{extra ? ` · ${extra}` : ""}
          </p>
        </div>
      </div>
      <p style={{ fontSize: "0.8125rem", lineHeight: 1.8 }}>{request.desc}</p>
      <p className="small muted">الميزانية: {budgetLabel(request)} · قبل: {request.needBy || "—"}</p>
    </>
  );
}
