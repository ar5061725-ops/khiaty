"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/constants";
import { parseNum } from "@/lib/format";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { ChoiceGroup, InputField, TextAreaField } from "@/components/ui/form";
import { FormError } from "@/components/ui/feedback";
import { Thumb } from "@/components/ui/display";

export function NewRequestForm() {
  const { publishRequest } = useStore();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<string>(CATEGORIES[0]);
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return setError("اكتب عنواناً للطلب (3 أحرف على الأقل).");
    if (desc.trim().length < 10) return setError("الوصف قصير جداً.");
    const mn = min.trim() ? parseNum(min) : null;
    const mx = max.trim() ? parseNum(max) : null;
    if ((mn !== null && !(mn >= 0)) || (mx !== null && !(mx >= 0))) return setError("الميزانية يجب أن تكون أرقاماً.");
    if (mn !== null && mx !== null && mn > mx) return setError("حد الميزانية الأعلى أقل من الأدنى.");
    if (!date) return setError("حدّد تاريخ التسليم المطلوب.");
    const res = publishRequest({ title: title.trim(), cat, desc: desc.trim(), img, min: mn, max: mx, needBy: date });
    if (!res.ok) return setError(res.error);
    router.push(routes.requests);
  }

  return (
    <form onSubmit={onSubmit} className="stack-lg" noValidate>
      <h2 style={{ fontSize: "1.25rem" }}>طلب جديد</h2>
      <InputField label="عنوان الطلب" value={title} placeholder="مثال: عباية سوداء للدوام"
        onChange={(e) => { setTitle(e.target.value); setError(""); }} />
      <ChoiceGroup legend="التصنيف" options={CATEGORIES} value={cat} onChange={setCat} variant="chip" />
      <TextAreaField label="الوصف التفصيلي" rows={4} value={desc} placeholder="القماش، القصة، الأكمام، التطريز، المقاسات…"
        onChange={(e) => { setDesc(e.target.value); setError(""); }} />

      <div className="row" style={{ gap: 10 }}>
        <Thumb cat={cat} hasImage={img} size={64} />
        <div className="grow">
          <button type="button" className="btn-dashed" onClick={() => setImg((v) => !v)}>
            {img ? "إزالة الصورة" : "إرفاق صورة"}
          </button>
          <p className="tiny muted" style={{ marginTop: 4 }}>صورة مرجعية اختيارية. بدونها نعرض الحرف الأول من التصنيف.</p>
        </div>
      </div>

      <div className="grid-2">
        <InputField label="الميزانية من (د.ك)" dir="ltr" inputMode="decimal" placeholder="اختياري" value={min}
          onChange={(e) => { setMin(e.target.value); setError(""); }} />
        <InputField label="إلى (د.ك)" dir="ltr" inputMode="decimal" placeholder="اختياري" value={max}
          onChange={(e) => { setMax(e.target.value); setError(""); }} />
      </div>
      <InputField label="التسليم المطلوب قبل" type="date" dir="ltr" value={date}
        onChange={(e) => { setDate(e.target.value); setError(""); }} />
      <p className="tiny muted">الميزانية إرشادية فقط؛ يمكن للخيّاط تقديم عرض أعلى منها.</p>

      <FormError message={error} />
      <Button type="submit" block>نشر الطلب</Button>
    </form>
  );
}
