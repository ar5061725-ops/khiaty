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

## Supabase

البيانات والحسابات في Supabase (Auth + Postgres + Realtime). أنشئ ملف `.env.local` (انظر `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # المفتاح العام (publishable) فقط
```

- الجداول بالبادئة `khiaty_` (المشروع يحوي تطبيقاً آخر): `profiles, requests, bids, bid_versions, orders, messages`.
- **RLS** على كل الجداول: الخيّاط يرى عروضه فقط، الزبون يرى عروض طلباته فقط، الطلب والدردشة لطرفيهما فقط، والدردشة تُفتح بعد دفع المقدّم.
- كل تغيير حالة يمر عبر دوال RPC (`khiaty_submit_bid`, `khiaty_accept_bid`, `khiaty_set_order_stage`, …) تفرض القواعد في الخادم؛ والإحصاءات (المنافسة، التقييم) تُعاد مجمّعة دون أسماء أو أسعار المنافسين.
- **الدفع (ماي فاتورة):** جدول `khiaty_payments` يسجّل كل محاولة دفع: البند المدفوع (`item`) ورقم الفاتورة (`invoice_id`) والحالة (`pending` / `success` / `cancelled` / `rejected`). دالتان: `myfatoorah` (`create` تنشئ الفاتورة بمبلغ من قاعدة البيانات، و`verify` عند عودة الزبون) و**`check-payment`** وهي رابط الـwebhook الذي تستدعيه ماي فاتورة. لا تُسجَّل أي دفعة إلا بعد أن يؤكدها ماي فاتورة نفسه بمفتاحنا السرّي (`GetPaymentStatus`) وتطابق المبلغ. عند النجاح تتغيّر حالة الطلب ويُحوَّل الزبون إلى `/pay/success`، وعند الإلغاء أو الرفض إلى `/pay/error`. صفحة `/payments` تعرض مدفوعات المستخدم.
- **المفتاح السرّي** محفوظ في Supabase Vault (`myfatoorah_api_key`, `myfatoorah_base_url`) أو كسرّ دالة `MYFATOORAH_API_KEY` / `MYFATOORAH_BASE_URL`؛ **لا يوجد في الكود**. الحالي مفتاح تجريبي (`apitest.myfatoorah.com`).
- **للانتقال إلى الإنتاج:** مفتاح ماي فاتورة الحيّ + `myfatoorah_base_url = https://api.myfatoorah.com` + `NEXT_PUBLIC_PAYMENTS_SANDBOX=false` في Vercel. وسجّل رابط الـ webhook في بوابة ماي فاتورة: `https://<project-ref>.supabase.co/functions/v1/check-payment` (الحدث: Payment Status Changed).
- تأكيد الإيميل مفعّل في المشروع: المستخدم الجديد يؤكد بريده ثم يسجّل الدخول.

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
    types.ts constants.ts format.ts routes.ts
    domain.ts          دوال نقية (أسماء، تقييم، صلاحيات الرؤية)
    supabase.ts        عميل Supabase
    store.tsx          حالة التطبيق (Context) فوق Supabase + تحديث لحظي (Realtime)
```

## ملاحظات التصميم

- **حالات النظام:** هيكل تحميل أثناء تحميل الحالة المحفوظة، `loading.tsx`/`error.tsx`/`not-found.tsx`، رسائل أخطاء النماذج (`role="alert"`)، حالات فارغة، وحالة انتظار في بوابة الدفع.
- **الخصوصية:** الخيّاط يرى إحصاءات المنافسة فقط، ولا يرى أسماء أو أسعار المنافسين؛ سجل العرض يظهر لصاحبه وصاحب الطلب فقط.
- **قابلية التوسع:** كل الوصول للبيانات عبر `useStore()`، والمكوّنات لا تعرف شيئاً عن Supabase.
- الدفع عبر صفحة ماي فاتورة المستضافة؛ بيانات البطاقة لا تمرّ بالتطبيق ولا بقاعدة البيانات.
