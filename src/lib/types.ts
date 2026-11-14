export type Role = "customer" | "tailor";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type RequestStatus = "open" | "awarded";

export interface TailorRequest {
  id: string;
  title: string;
  cat: string;
  desc: string;
  img: boolean;
  min: number | null;
  max: number | null;
  needBy: string;
  status: RequestStatus;
  customer: string;
}

export type BidStatus = "pending" | "declined" | "accepted" | "not_selected";

export interface BidVersion {
  up: number;
  fin: number;
  days: number;
  note: string;
  at: string;
}

export interface Bid {
  id: string;
  req: string;
  tailor: string;
  status: BidStatus;
  v: BidVersion[];
}

export type OrderStage =
  | "awaiting_upfront"
  | "accepted"
  | "in_progress"
  | "ready"
  | "completed";

export interface Review {
  stars: number;
  text: string;
}

export interface Order {
  id: string;
  req: string;
  title: string;
  bid: string;
  customer: string;
  tailor: string;
  up: number;
  fin: number;
  stage: OrderStage;
  upPaid: boolean;
  finPaid: boolean;
  review: Review | null;
}

export interface ChatMessage {
  from: string;
  text: string;
}

export type PayPhase = "up" | "fin";

export interface TailorStats {
  rating: string; // "جديد" until the first review
  done: number;
}

export interface Database {
  users: User[];
  requests: TailorRequest[];
  bids: Bid[];
  orders: Order[];
  msgs: Record<string, ChatMessage[]>;
  stats: Record<string, TailorStats>;
}

export interface Competition {
  count: number;
  lowest: number | null;
  fastest: number | null;
}

export type Result<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
