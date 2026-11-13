import { ErrorState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <ErrorState
      title="الصفحة غير موجودة"
      message="الرابط الذي فتحته غير صحيح أو لم يعد متاحاً."
      action={<ButtonLink href="/">العودة للرئيسية</ButtonLink>}
    />
  );
}
