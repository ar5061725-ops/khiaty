import type { BidStatus, OrderStage, PaymentStatus } from "./types";

export const CATEGORIES = [
  "عباية", "ثوب", "دراعة", "جلابية", "فستان زفاف", "فستان سهرة",
  "بدلة", "بليزر", "قميص", "بنطال", "تعديلات", "أخرى",
] as const;

export const BID_STATUS: Record<BidStatus, { label: string; tone: Tone }> = {
  pending: { label: "معلّق", tone: "warn" },
  declined: { label: "مرفوض", tone: "danger" },
  accepted: { label: "مقبول", tone: "ok" },
  not_selected: { label: "لم يُختر", tone: "neutral" },
};

export type Tone = "warn" | "danger" | "ok" | "neutral" | "brand" | "gold";

export const STAGE_LABEL: Record<OrderStage, string> = {
  awaiting_upfront: "بانتظار المقدّم",
  accepted: "مقبول",
  in_progress: "قيد التنفيذ",
  ready: "جاهز",
  completed: "مكتمل",
};

/** Stages shown in the order progress tracker (awaiting_upfront precedes them). */
export const STAGE_TRACK: OrderStage[] = ["accepted", "in_progress", "ready", "completed"];


export const LANDING_STEPS = [
  "انشر طلبك بالوصف والصورة والميزانية",
  "الخيّاطون يقدّمون عروضاً سرية",
  "اقبل عرضاً وادفع المقدّم عبر البوابة",
  "تابع التنفيذ والدردشة، ثم ادفع النهائي وقيّم",
];


export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: "قيد الانتظار", tone: "warn" },
  success: { label: "ناجحة", tone: "ok" },
  cancelled: { label: "ملغاة", tone: "neutral" },
  rejected: { label: "مرفوضة", tone: "danger" },
};
