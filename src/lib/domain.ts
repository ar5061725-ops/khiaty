import type { Bid, BidVersion, Database, Order, TailorRequest, User } from "./types";

export const lastVersion = (b: Bid): BidVersion => b.v[b.v.length - 1];
export const bidTotal = (v: BidVersion) => v.up + v.fin;

export const findUser = (db: Database, email: string): User | undefined =>
  db.users.find((u) => u.email === email);

export const userName = (db: Database, email: string) => findUser(db, email)?.name ?? "—";

export function ratingOf(db: Database, email: string): string {
  const base = findUser(db, email)?.baseRating ?? [];
  const extra = db.orders.filter((o) => o.tailor === email && o.review).map((o) => o.review!.stars);
  const all = base.concat(extra);
  return all.length ? (all.reduce((a, b) => a + b, 0) / all.length).toFixed(1) : "جديد";
}

export const completedOf = (db: Database, email: string) =>
  (findUser(db, email)?.baseDone ?? 0) +
  db.orders.filter((o) => o.tailor === email && o.stage === "completed").length;

export const bidsFor = (db: Database, reqId: string) => db.bids.filter((b) => b.req === reqId);

export function budgetLabel(r: TailorRequest): string {
  if (r.min == null && r.max == null) return "غير محددة";
  return `${r.min ?? "—"} – ${r.max ?? "—"} د.ك`;
}

/** Aggregate-only view of the competition: tailors never see rival names or prices. */
export function competition(db: Database, reqId: string) {
  const bids = bidsFor(db, reqId);
  if (!bids.length) return { count: 0, lowest: null as number | null, fastest: null as number | null };
  return {
    count: bids.length,
    lowest: Math.min(...bids.map((b) => bidTotal(lastVersion(b)))),
    fastest: Math.min(...bids.map((b) => lastVersion(b).days)),
  };
}

/** An order is visible only to its two participants. */
export const canSeeOrder = (o: Order, email: string) => o.customer === email || o.tailor === email;

/** Bid history is visible only to the bidding tailor and the request owner. */
export function canSeeBid(db: Database, b: Bid, email: string): boolean {
  if (b.tailor === email) return true;
  return db.requests.find((r) => r.id === b.req)?.customer === email;
}
