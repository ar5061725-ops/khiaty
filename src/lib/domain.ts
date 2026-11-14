import type { Bid, BidVersion, Database, Order, TailorRequest, User } from "./types";

export const lastVersion = (b: Bid): BidVersion => b.v[b.v.length - 1];
export const bidTotal = (v: BidVersion) => v.up + v.fin;

export const findUser = (db: Database, id: string): User | undefined =>
  db.users.find((u) => u.id === id);

export const userName = (db: Database, id: string) => findUser(db, id)?.name ?? "—";

/** Rating/completed-count come from the server (aggregated from reviews and completed orders). */
export const ratingOf = (db: Database, id: string) => db.stats[id]?.rating ?? "جديد";
export const completedOf = (db: Database, id: string) => db.stats[id]?.done ?? 0;

export const bidsFor = (db: Database, reqId: string) => db.bids.filter((b) => b.req === reqId);

export function budgetLabel(r: TailorRequest): string {
  if (r.min == null && r.max == null) return "غير محددة";
  return `${r.min ?? "—"} – ${r.max ?? "—"} د.ك`;
}

/** Orders are visible only to their two participants (also enforced by RLS). */
export const canSeeOrder = (o: Order, id: string) => o.customer === id || o.tailor === id;

/** Bid history is visible only to the bidding tailor and the request owner (also enforced by RLS). */
export function canSeeBid(db: Database, b: Bid, id: string): boolean {
  if (b.tailor === id) return true;
  return db.requests.find((r) => r.id === b.req)?.customer === id;
}
