import type { Database } from "./types";

export const SEED_PASSWORD = "khiaty2026";

export const seedDatabase = (): Database => ({
  users: [
    { email: "dana@khiaty.demo", name: "دانة", role: "customer", pass: SEED_PASSWORD },
    { email: "layla@khiaty.demo", name: "ليلى", role: "customer", pass: SEED_PASSWORD },
    { email: "mariam@khiaty.demo", name: "مريم الصباح", role: "tailor", pass: SEED_PASSWORD, baseRating: [5, 5, 5], baseDone: 120 },
    { email: "noura@khiaty.demo", name: "نورة الراشد", role: "tailor", pass: SEED_PASSWORD, baseRating: [5, 4, 5], baseDone: 64 },
    { email: "hessa@khiaty.demo", name: "حصة المطيري", role: "tailor", pass: SEED_PASSWORD, baseRating: [5, 5, 4], baseDone: 88 },
  ],
  requests: [
    { id: "r-7f3a", title: "عباية عاجية للعيد", cat: "عباية", desc: "عباية عاجية بقصة واسعة، تطريز ذهبي ناعم على الأكمام والصدر، طول كامل.", img: true, min: 200, max: 300, needBy: "2026-12-20", status: "open", customer: "dana@khiaty.demo" },
    { id: "r-91c2", title: "فستان سهرة زمردي", cat: "فستان سهرة", desc: "فستان طويل أخضر زمردي، أكمام شفافة وتطريز خفيف على الخصر.", img: false, min: null, max: 220, needBy: "2027-01-10", status: "open", customer: "layla@khiaty.demo" },
  ],
  bids: [
    { id: "b1", req: "r-7f3a", tailor: "mariam@khiaty.demo", status: "pending", v: [
      { up: 100, fin: 180, days: 14, note: "تطريز يدوي بخيط ذهبي.", at: "2026-11-10 09:12:41" },
      { up: 100, fin: 170, days: 14, note: "نفس الخامة بسعر أقل.", at: "2026-11-11 10:45:03" },
      { up: 90, fin: 170, days: 13, note: "تقليل التطريز على الظهر.", at: "2026-11-12 19:17:22" },
      { up: 90, fin: 161, days: 14, note: "عرض نهائي مع شيلة مطابقة.", at: "2026-11-13 11:08:55" },
    ] },
    { id: "b2", req: "r-7f3a", tailor: "noura@khiaty.demo", status: "pending", v: [
      { up: 85, fin: 160, days: 12, note: "قماش كريب ياباني.", at: "2026-11-12 14:30:10" },
    ] },
    { id: "b3", req: "r-7f3a", tailor: "hessa@khiaty.demo", status: "pending", v: [
      { up: 100, fin: 155, days: 10, note: "", at: "2026-11-11 08:02:37" },
      { up: 95, fin: 160, days: 10, note: "تسليم أسرع.", at: "2026-11-12 16:44:19" },
    ] },
  ],
  orders: [],
  msgs: {},
});
