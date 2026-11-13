import { PublicGate } from "@/components/layout/guards";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { LANDING_STEPS } from "@/lib/constants";
import { routes } from "@/lib/routes";

export default function LandingPage() {
  return (
    <PublicGate>
      <main className="main stack-lg">
        <div className="between">
          <Logo />
          <div className="row" style={{ gap: 6 }}>
            <ButtonLink href={routes.login} variant="outline" size="sm">دخول</ButtonLink>
            <ButtonLink href={routes.signup} size="sm">تسجيل جديد</ButtonLink>
          </div>
        </div>

        <section className="hero">
          <p className="small" style={{ letterSpacing: 3, color: "var(--gold)" }}>KHIATY · الكويت</p>
          <h1>صِفي القطعة التي تريدينها، والخيّاطون يتنافسون على صنعها</h1>
          <p style={{ marginTop: 10, fontSize: "0.875rem", lineHeight: 1.8, color: "var(--gold-light)" }}>
            سوق يربط الزبائن بالخيّاطين في الكويت: انشري طلبك، قارني العروض، ادفعي المقدّم بأمان، وتابعي التنفيذ.
          </p>
        </section>

        <ol className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 8 }}>
          {LANDING_STEPS.map((text, i) => (
            <li key={text} className="card row" style={{ gap: 10, borderRadius: 14 }}>
              <span className="step-no">{i + 1}</span>
              <span style={{ fontSize: "0.875rem" }}>{text}</span>
            </li>
          ))}
        </ol>
      </main>
    </PublicGate>
  );
}
