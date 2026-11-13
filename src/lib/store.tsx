"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { seedDatabase } from "./seed";
import { nowKuwait, shortId } from "./format";
import { lastVersion } from "./domain";
import type {
  Bid, BidVersion, Database, Order, PayPhase, Result, Role, TailorRequest, User,
} from "./types";

const STORAGE_KEY = "khiaty:v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Session { email: string | null }
interface Persisted { db: Database; session: Session }

export interface NewRequestInput {
  title: string; cat: string; desc: string; img: boolean;
  min: number | null; max: number | null; needBy: string;
}
export interface BidInput { up: number; fin: number; days: number; note: string }

export interface KhiatyStore {
  /** false until localStorage has been read — render skeletons until then */
  ready: boolean;
  db: Database;
  user: User | null;
  toast: string;
  showToast: (msg: string) => void;
  signIn: (email: string, pass: string) => Result<User>;
  signUp: (input: { name: string; email: string; pass: string; role: Role }) => Result<User>;
  signOut: () => void;
  publishRequest: (input: NewRequestInput) => Result<string>;
  submitBid: (reqId: string, input: BidInput) => Result;
  declineBid: (bidId: string) => void;
  acceptBid: (bidId: string) => Result<string>;
  setOrderStage: (orderId: string, stage: "in_progress" | "ready" | "completed", toast: string) => void;
  confirmPayment: (orderId: string, phase: PayPhase) => void;
  sendMessage: (orderId: string, text: string) => void;
  submitReview: (orderId: string, stars: number, text: string) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<KhiatyStore | null>(null);

export function useStore(): KhiatyStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const ok = <T,>(data: T): { ok: true; data: T } => ({ ok: true, data });

function load(): Persisted | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch {
    return null; // blocked storage / corrupt JSON → fall back to seed data
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(seedDatabase);
  const [session, setSession] = useState<Session>({ email: null });
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const timers = useRef<number[]>([]);
  const toastTimer = useRef<number | undefined>(undefined);
  const dbRef = useRef(db);
  dbRef.current = db;

  // hydrate once on the client
  useEffect(() => {
    const saved = load();
    if (saved?.db) { setDb(saved.db); setSession(saved.session ?? { email: null }); }
    setReady(true);
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  // persist after hydration
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ db, session } satisfies Persisted));
    } catch { /* storage full or unavailable — the app keeps working in memory */ }
  }, [db, session, ready]);

  const user = useMemo(
    () => (session.email ? db.users.find((u) => u.email === session.email) ?? null : null),
    [db.users, session.email],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    if (msg) toastTimer.current = window.setTimeout(() => setToast(""), 5000);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const signIn = useCallback<KhiatyStore["signIn"]>((rawEmail, pass) => {
    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return fail("إيميل غير صالح.");
    const u = dbRef.current.users.find((x) => x.email === email && x.pass === pass);
    if (!u) return fail("الإيميل أو كلمة المرور غير صحيحة.");
    setSession({ email: u.email });
    return ok(u);
  }, []);

  const signUp = useCallback<KhiatyStore["signUp"]>(({ name, email: rawEmail, pass, role }) => {
    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return fail("إيميل غير صالح.");
    if (name.trim().length < 2) return fail("اكتب الاسم.");
    if (pass.length < 8) return fail("كلمة المرور 8 أحرف على الأقل.");
    if (dbRef.current.users.some((u) => u.email === email)) return fail("هذا الإيميل مسجّل مسبقاً.");
    const u: User = { email, name: name.trim(), role, pass, baseRating: [], baseDone: 0 };
    setDb((d) => ({ ...d, users: [...d.users, u] }));
    setSession({ email });
    showToast("تم إنشاء الحساب وتسجيل دخولك.");
    return ok(u);
  }, [showToast]);

  const signOut = useCallback(() => { setSession({ email: null }); setToast(""); }, []);

  const publishRequest = useCallback<KhiatyStore["publishRequest"]>((input) => {
    if (!user) return fail("سجّل الدخول أولاً.");
    const id = shortId("r");
    const r: TailorRequest = { id, ...input, status: "open", customer: user.email };
    setDb((d) => ({ ...d, requests: [...d.requests, r] }));
    showToast("تم نشر الطلب (مفتوح) وأصبح ظاهراً لكل الخيّاطين.");
    return ok(id);
  }, [user, showToast]);

  const submitBid = useCallback<KhiatyStore["submitBid"]>((reqId, input) => {
    if (!user || user.role !== "tailor") return fail("هذه الصفحة للخيّاطين فقط.");
    const req = dbRef.current.requests.find((r) => r.id === reqId);
    if (!req || req.status !== "open") return fail("هذا الطلب لم يعد يستقبل عروضاً.");
    const ver: BidVersion = { ...input, note: input.note.trim(), at: nowKuwait() };
    const mine = dbRef.current.bids.find((b) => b.req === reqId && b.tailor === user.email);
    if (mine) {
      if (mine.status === "accepted" || mine.status === "not_selected") return fail("لا يمكن تعديل هذا العرض.");
      setDb((d) => ({ ...d, bids: d.bids.map((b) => b.id === mine.id ? { ...b, status: "pending", v: [...b.v, ver] } : b) }));
      showToast(`تم حفظ نسخة جديدة #${mine.v.length + 1} وعاد العرض معلّقاً.`);
    } else {
      const bid: Bid = { id: shortId("b"), req: reqId, tailor: user.email, status: "pending", v: [ver] };
      setDb((d) => ({ ...d, bids: [...d.bids, bid] }));
      showToast("تم إرسال العرض (معلّق).");
    }
    return ok(undefined);
  }, [user, showToast]);

  const declineBid = useCallback((bidId: string) => {
    setDb((d) => ({ ...d, bids: d.bids.map((b) => b.id === bidId ? { ...b, status: "declined" } : b) }));
    showToast("تم رفض العرض. يمكن للخيّاط تعديله فيعود معلّقاً.");
  }, [showToast]);

  const acceptBid = useCallback<KhiatyStore["acceptBid"]>((bidId) => {
    const cur = dbRef.current;
    const bid = cur.bids.find((b) => b.id === bidId);
    const req = bid && cur.requests.find((r) => r.id === bid.req);
    if (!user || !bid || !req || req.customer !== user.email) return fail("تعذّر قبول العرض.");
    if (req.status !== "open" || bid.status !== "pending") return fail("هذا العرض لم يعد متاحاً للقبول.");
    const v = lastVersion(bid);
    const order: Order = {
      id: shortId("o"), req: req.id, title: req.title, bid: bid.id, customer: user.email, tailor: bid.tailor,
      up: v.up, fin: v.fin, stage: "awaiting_upfront", upPaid: false, finPaid: false, review: null,
    };
    setDb((d) => ({
      ...d,
      orders: [...d.orders, order],
      requests: d.requests.map((r) => r.id === req.id ? { ...r, status: "awarded" } : r),
      bids: d.bids.map((b) => b.req !== req.id ? b : { ...b, status: b.id === bid.id ? "accepted" : "not_selected" }),
    }));
    showToast("");
    return ok(order.id);
  }, [user, showToast]);

  const setOrderStage = useCallback<KhiatyStore["setOrderStage"]>((orderId, stage, msg) => {
    setDb((d) => ({ ...d, orders: d.orders.map((o) => o.id === orderId ? { ...o, stage } : o) }));
    showToast(msg);
  }, [showToast]);

  /** Called once the (simulated) gateway webhook confirms the payment. */
  const confirmPayment = useCallback<KhiatyStore["confirmPayment"]>((orderId, phase) => {
    setDb((d) => {
      const order = d.orders.find((o) => o.id === orderId);
      if (!order) return d;
      const orders = d.orders.map((o) => o.id !== orderId ? o
        : phase === "up" ? { ...o, upPaid: true, stage: "accepted" as const } : { ...o, finPaid: true });
      const msgs = phase === "up" && !d.msgs[orderId]
        ? { ...d.msgs, [orderId]: [{ from: order.tailor, text: "شكراً لاختيارك! متى يناسبك موعد القياس؟" }] }
        : d.msgs;
      return { ...d, orders, msgs };
    });
    showToast(phase === "up"
      ? "وصل إشعار البوابة: تم دفع المقدّم، والطلب مقبول، وفُتحت الدردشة."
      : "وصل إشعار البوابة: تم دفع الدفعة النهائية.");
  }, [showToast]);

  const sendMessage = useCallback<KhiatyStore["sendMessage"]>((orderId, text) => {
    const t = text.trim();
    const order = dbRef.current.orders.find((o) => o.id === orderId);
    if (!t || !user || !order) return;
    const other = user.email === order.customer ? order.tailor : order.customer;
    setDb((d) => ({ ...d, msgs: { ...d.msgs, [orderId]: [...(d.msgs[orderId] ?? []), { from: user.email, text: t }] } }));
    later(() => {
      setDb((d) => ({
        ...d,
        msgs: { ...d.msgs, [orderId]: [...(d.msgs[orderId] ?? []), { from: other, text: "وصلت رسالتك، سأرد بالتفاصيل قريباً." }] },
      }));
    }, 1500);
  }, [user, later]);

  const submitReview = useCallback<KhiatyStore["submitReview"]>((orderId, stars, text) => {
    setDb((d) => ({
      ...d,
      orders: d.orders.map((o) => o.id === orderId && !o.review ? { ...o, review: { stars, text: text.trim() || "بدون تعليق" } } : o),
    }));
    showToast("شكراً! أُضيف تقييمك إلى سجل الخيّاط.");
  }, [showToast]);

  const resetDemo = useCallback(() => {
    setDb(seedDatabase()); setSession({ email: null }); setToast("");
  }, []);

  const value = useMemo<KhiatyStore>(() => ({
    ready, db, user, toast, showToast, signIn, signUp, signOut, publishRequest, submitBid,
    declineBid, acceptBid, setOrderStage, confirmPayment, sendMessage, submitReview, resetDemo,
  }), [ready, db, user, toast, showToast, signIn, signUp, signOut, publishRequest, submitBid,
    declineBid, acceptBid, setOrderStage, confirmPayment, sendMessage, submitReview, resetDemo]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
