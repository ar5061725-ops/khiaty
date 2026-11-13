# خياطتي · Khiaty

سوق يربط الزبائن بالخيّاطين في الكويت: نشر الطلب ← عروض متنافسة ← دفع المقدّم عبر البوابة ← تنفيذ ودردشة ← دفع نهائي وتقييم.

نموذج تفاعلي محوَّل من HTML إلى **Next.js 16 (App Router) + TypeScript**. الواجهة عربية RTL ومصمَّمة للهاتف أولاً.

## التشغيل

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run typecheck
```

حسابات تجريبية (كلمة المرور `khiaty2026`): `dana@khiaty.demo` (زبونة) · `mariam@khiaty.demo` / `noura@khiaty.demo` (خيّاطات).

## البنية

```
src/
  app/                 المسارات (App Router)
    (public)/          الرئيسية + الدخول
    (app)/             الشاشات المحمية (header + nav): requests, browse, my-bids, orders, bids/[id]/history
    pay/[orderId]/     بوابة الدفع (محاكاة)
    loading.tsx · error.tsx · not-found.tsx   حالات النظام
  components/
    ui/                مكوّنات عامة قابلة لإعادة الاستخدام (Button, InputField, ChoiceGroup, Badge, Stat, Spinner, ErrorState…)
    layout/            AppShell, Logo, AuthGate / RoleGate / PublicGate
    requests/ bids/ orders/ chat/ auth/    مكوّنات الميزات
  lib/
    types.ts constants.ts format.ts seed.ts routes.ts
    domain.ts          دوال نقية (التقييم، المنافسة، صلاحيات الرؤية)
    store.tsx          حالة التطبيق (Context) + حفظ في localStorage
```

## ملاحظات التصميم

- **حالات النظام:** هيكل تحميل أثناء تحميل الحالة المحفوظة، `loading.tsx`/`error.tsx`/`not-found.tsx`، رسائل أخطاء النماذج (`role="alert"`)، حالات فارغة، وحالة انتظار في بوابة الدفع.
- **الخصوصية:** الخيّاط يرى إحصاءات المنافسة فقط، ولا يرى أسماء أو أسعار المنافسين؛ سجل العرض يظهر لصاحبه وصاحب الطلب فقط.
- **قابلية التوسع:** كل الوصول للبيانات عبر `useStore()`؛ استبدال `store.tsx` بطبقة API/Supabase لا يمس المكوّنات. بوابة الدفع والدردشة محاكاة (يُستبدلان بماي فاتورة وWebSocket).
- هذه نسخة عرض: البيانات في المتصفح فقط وكلمات المرور نصّية — **لا تُستخدم في الإنتاج** دون خلفية حقيقية.
