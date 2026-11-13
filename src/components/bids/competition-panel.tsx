import { kwd } from "@/lib/format";
import { Stat } from "@/components/ui/display";

/** Aggregate-only competition snapshot shown to tailors (no rival names or prices). */
export function CompetitionPanel({ count, lowest, fastest }: { count: number; lowest: number | null; fastest: number | null }) {
  return (
    <section className="card-dark" aria-label="المنافسة">
      <p style={{ fontWeight: 700 }}>المنافسة</p>
      <div className="grid-3" style={{ marginTop: 8 }}>
        <Stat label="عدد العروض" value={count} tone="dark" />
        <Stat label="أقل إجمالي" value={lowest == null ? "—" : kwd(lowest)} tone="dark" ltr />
        <Stat label="أسرع مدة" value={fastest == null ? "—" : `${fastest} يوم`} tone="dark" />
      </div>
      <p className="tiny" style={{ marginTop: 8, color: "var(--gold-light)" }}>
        ترى موقعك في المزايدة فقط، لا أسماء المنافسين ولا أسعارهم الفردية.
      </p>
    </section>
  );
}
