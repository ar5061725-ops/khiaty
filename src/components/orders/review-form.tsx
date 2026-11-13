"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form";

export function ReviewForm({ orderId }: { orderId: string }) {
  const { submitReview } = useStore();
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");

  return (
    <section className="card stack" style={{ gap: 8, borderColor: "var(--gold)" }} aria-label="التقييم">
      <p style={{ fontWeight: 700 }}>قيّمي التجربة</p>
      <div className="row" style={{ gap: 4 }} role="group" aria-label="عدد النجوم">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} نجوم`} aria-pressed={n === stars} onClick={() => setStars(n)}
            style={{ width: 44, height: 44, border: 0, background: "transparent", fontSize: 26, color: n <= stars ? "var(--gold)" : "var(--line)" }}>
            ★
          </button>
        ))}
      </div>
      <TextAreaField label="رأيك" rows={2} value={text} placeholder="اكتبي رأيك…" onChange={(e) => setText(e.target.value)} />
      <Button variant="gold" onClick={() => submitReview(orderId, stars, text)}>إرسال التقييم</Button>
    </section>
  );
}
