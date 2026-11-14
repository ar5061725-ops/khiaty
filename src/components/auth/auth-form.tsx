"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { homeFor } from "@/lib/routes";
import type { Role } from "@/lib/types";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { ChoiceGroup, InputField } from "@/components/ui/form";
import { FormError, Toast } from "@/components/ui/feedback";
import { Notice } from "@/components/ui/display";

const ROLES = [
  { value: "customer" as Role, label: "زبون" },
  { value: "tailor" as Role, label: "خيّاط" },
];

export function AuthForm({ initialMode }: { initialMode: "login" | "signup" }) {
  const { signIn, signUp } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    const res = signup ? await signUp({ name, email, pass, role }) : await signIn(email, pass);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (!res.data) return setInfo("تم إنشاء الحساب. أرسلنا رابط تأكيد إلى بريدك؛ أكّده ثم سجّل الدخول.");
    router.replace(homeFor(res.data.role));
  }

  return (
    <main className="main">
      <form onSubmit={onSubmit} className="stack-lg" style={{ paddingTop: 16 }} noValidate>
        <Logo />
        <h1 className="naskh" style={{ fontSize: "1.75rem", marginTop: 8 }}>{signup ? "أنشئ حسابك" : "أهلاً بعودتك"}</h1>

        {signup && (
          <InputField label="الاسم" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        )}
        <InputField label="الإيميل" type="email" dir="ltr" value={email} autoComplete="email" inputMode="email"
          onChange={(e) => { setEmail(e.target.value); setError(""); }} />
        <InputField label="كلمة المرور" type="password" dir="ltr" value={pass}
          autoComplete={signup ? "new-password" : "current-password"}
          onChange={(e) => { setPass(e.target.value); setError(""); }} />

        {signup && (
          <div className="stack" style={{ gap: 6 }}>
            <ChoiceGroup legend="أنا…" options={ROLES} value={role} onChange={setRole} />
            <span className="tiny muted">الدور يحدد تجربتك بالكامل ولا يتغير من الواجهة.</span>
          </div>
        )}

        <FormError message={error} />
        {info && <Notice tone="ok">{info}</Notice>}
        <Button type="submit" block loading={busy}>{signup ? "إنشاء الحساب" : "دخول"}</Button>

        <p className="muted" style={{ textAlign: "center", fontSize: "0.875rem" }}>
          {signup ? "لديك حساب؟" : "جديد في خياطتي؟"}{" "}
          <button type="button" className="link-btn brand" style={{ display: "inline-flex", textDecoration: "underline", fontWeight: 700 }}
            onClick={() => { setMode(signup ? "login" : "signup"); setError(""); }}>
            {signup ? "دخول" : "أنشئ حساباً"}
          </button>
        </p>

      </form>
      <Toast />
    </main>
  );
}
