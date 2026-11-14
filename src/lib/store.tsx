"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { formatKuwait } from "./format";
import type {
  Bid, BidStatus, ChatMessage, Competition, Database, Order, OrderStage, PayPhase, Result, Role,
  TailorRequest, User,
} from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_DB: Database = { users: [], requests: [], bids: [], orders: [], msgs: {}, stats: {} };

export interface NewRequestInput {
  title: string; cat: string; desc: string; img: boolean;
  min: number | null; max: number | null; needBy: string;
}
export interface BidInput { up: number; fin: number; days: number; note: string }

export interface KhiatyStore {
  /** false until the session and first data load are done — render skeletons until then */
  ready: boolean;
  /** set when the initial data load failed; `reload` retries */
  loadError: string;
  reload: () => Promise<void>;
  db: Database;
  user: User | null;
  toast: string;
  showToast: (msg: string) => void;
  signIn: (email: string, pass: string) => Promise<Result<User>>;
  /** data === null means the account was created but needs e-mail confirmation first */
  signUp: (input: { name: string; email: string; pass: string; role: Role }) => Promise<Result<User | null>>;
  signOut: () => Promise<void>;
  publishRequest: (input: NewRequestInput) => Promise<Result<string>>;
  submitBid: (reqId: string, input: BidInput) => Promise<Result>;
  declineBid: (bidId: string) => Promise<void>;
  acceptBid: (bidId: string) => Promise<Result<string>>;
  setOrderStage: (orderId: string, stage: "in_progress" | "ready" | "completed", toast: string) => Promise<void>;
  confirmPayment: (orderId: string, phase: PayPhase) => Promise<Result>;
  sendMessage: (orderId: string, text: string) => Promise<void>;
  submitReview: (orderId: string, stars: number, text: string) => Promise<void>;
  getCompetition: (reqId: string) => Promise<Result<Competition>>;
}

const StoreContext = createContext<KhiatyStore | null>(null);

export function useStore(): KhiatyStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const ok = <T,>(data: T): { ok: true; data: T } => ({ ok: true, data });

/** Server-side rule violations arrive as Arabic messages; anything else gets a generic text. */
const friendly = (message: string | undefined) =>
  message && /[؀-ۿ]/.test(message) ? message : "تعذّر تنفيذ العملية. حاول مرة أخرى.";

/* ---------- row → app model mappers ---------- */
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function mapRequest(r: Row): TailorRequest {
  return {
    id: r.id, title: r.title, cat: r.cat, desc: r.descr, img: r.img,
    min: r.min_budget == null ? null : Number(r.min_budget),
    max: r.max_budget == null ? null : Number(r.max_budget),
    needBy: r.need_by, status: r.status, customer: r.customer_id,
  };
}

function mapOrder(o: Row): Order {
  return {
    id: o.id, req: o.request_id, title: o.title, bid: o.bid_id, customer: o.customer_id, tailor: o.tailor_id,
    up: Number(o.up), fin: Number(o.fin), stage: o.stage as OrderStage, upPaid: o.up_paid, finPaid: o.fin_paid,
    review: o.review_stars ? { stars: o.review_stars, text: o.review_text ?? "" } : null,
  };
}

async function fetchDatabase(sb: SupabaseClient): Promise<Database> {
  const [profiles, requests, bids, versions, orders, messages, stats] = await Promise.all([
    sb.from("khiaty_profiles").select("id,name,role"),
    sb.from("khiaty_requests").select("*").order("created_at"),
    sb.from("khiaty_bids").select("id,request_id,tailor_id,status").order("created_at"),
    sb.from("khiaty_bid_versions").select("bid_id,up,fin,days,note,created_at").order("created_at"),
    sb.from("khiaty_orders").select("*").order("created_at"),
    sb.from("khiaty_messages").select("order_id,sender_id,body,created_at").order("created_at"),
    sb.rpc("khiaty_tailor_stats"),
  ]);
  const failed = [profiles, requests, bids, versions, orders, messages, stats].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  const versionsByBid = new Map<string, Bid["v"]>();
  for (const v of versions.data ?? []) {
    const list = versionsByBid.get(v.bid_id) ?? [];
    list.push({ up: Number(v.up), fin: Number(v.fin), days: v.days, note: v.note, at: formatKuwait(v.created_at) });
    versionsByBid.set(v.bid_id, list);
  }
  const msgs: Record<string, ChatMessage[]> = {};
  for (const m of messages.data ?? []) (msgs[m.order_id] ??= []).push({ from: m.sender_id, text: m.body });

  return {
    users: (profiles.data ?? []) as User[],
    requests: (requests.data ?? []).map(mapRequest),
    bids: (bids.data ?? []).map((b): Bid => ({
      id: b.id, req: b.request_id, tailor: b.tailor_id, status: b.status as BidStatus, v: versionsByBid.get(b.id) ?? [],
    })),
    orders: (orders.data ?? []).map(mapOrder),
    msgs,
    stats: Object.fromEntries((stats.data ?? []).map((s: Row) => [
      s.tailor_id, { rating: s.rating == null ? "جديد" : Number(s.rating).toFixed(1), done: s.done },
    ])),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(EMPTY_DB);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = userId;

  const user = useMemo(() => (userId ? db.users.find((u) => u.id === userId) ?? null : null), [db.users, userId]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    if (msg) toastTimer.current = window.setTimeout(() => setToast(""), 5000);
  }, []);

  /** Re-reads everything RLS lets this user see. */
  const refresh = useCallback(async () => {
    setDb(await fetchDatabase(getSupabase()));
  }, []);

  const reload = useCallback(async () => {
    setLoadError("");
    try { await refresh(); } catch (e) { setLoadError(e instanceof Error ? e.message : "تعذّر تحميل البيانات."); }
  }, [refresh]);

  // restore the session on first load
  useEffect(() => {
    const sb = getSupabase();
    let cancelled = false;
    (async () => {
      try {
        const { data } = await sb.auth.getSession();
        if (data.session) {
          setUserId(data.session.user.id);
          await refresh();
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "تعذّر تحميل البيانات.");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    // session expiry / sign-out from another tab
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { setUserId(null); setDb(EMPTY_DB); }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [refresh]);

  // live updates: any change visible to this user triggers a (debounced) refetch
  useEffect(() => {
    if (!userId) return;
    const sb = getSupabase();
    let timer: number | undefined;
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { refresh().catch(() => {}); }, 250);
    };
    let channel = sb.channel(`khiaty-${userId}`);
    for (const table of ["khiaty_requests", "khiaty_bids", "khiaty_bid_versions", "khiaty_orders", "khiaty_messages"]) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, bump);
    }
    channel.subscribe();
    return () => { window.clearTimeout(timer); sb.removeChannel(channel); };
  }, [userId, refresh]);

  /** Runs a server call, reloads data on success and shows an error toast on failure. */
  const act = useCallback(async (call: () => PromiseLike<{ error: { message: string } | null }>, okToast?: string): Promise<Result> => {
    const { error } = await call();
    if (error) { showToast(friendly(error.message)); return fail(friendly(error.message)); }
    await refresh().catch(() => {});
    if (okToast) showToast(okToast);
    return ok(undefined);
  }, [refresh, showToast]);

  const signIn = useCallback<KhiatyStore["signIn"]>(async (rawEmail, pass) => {
    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return fail("إيميل غير صالح.");
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error || !data.user) return fail("الإيميل أو كلمة المرور غير صحيحة.");
    try {
      const next = await fetchDatabase(sb);
      const me = next.users.find((u) => u.id === data.user!.id);
      if (!me) { await sb.auth.signOut(); return fail("هذا الحساب غير مسجّل في خياطتي."); }
      setDb(next); setUserId(me.id);
      return ok(me);
    } catch {
      await sb.auth.signOut();
      return fail("تعذّر تحميل بياناتك. حاول مرة أخرى.");
    }
  }, []);

  const signUp = useCallback<KhiatyStore["signUp"]>(async ({ name, email: rawEmail, pass, role }) => {
    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return fail("إيميل غير صالح.");
    if (name.trim().length < 2) return fail("اكتب الاسم.");
    if (pass.length < 8) return fail("كلمة المرور 8 أحرف على الأقل.");
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email, password: pass, options: { data: { app: "khiaty", name: name.trim(), role } },
    });
    if (error) return fail(/registered|exists/i.test(error.message) ? "هذا الإيميل مسجّل مسبقاً." : "تعذّر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.");
    if (data.user && data.user.identities?.length === 0) return fail("هذا الإيميل مسجّل مسبقاً.");
    if (!data.session) return ok(null); // e-mail confirmation required
    try {
      const next = await fetchDatabase(sb);
      const me = next.users.find((u) => u.id === data.user!.id);
      if (!me) return fail("تعذّر إنشاء ملفك الشخصي. حاول مرة أخرى.");
      setDb(next); setUserId(me.id);
      showToast("تم إنشاء الحساب وتسجيل دخولك.");
      return ok(me);
    } catch {
      return fail("تم إنشاء الحساب لكن تعذّر تحميل بياناتك. سجّل الدخول من جديد.");
    }
  }, [showToast]);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
    setUserId(null); setDb(EMPTY_DB); setToast("");
  }, []);

  const publishRequest = useCallback<KhiatyStore["publishRequest"]>(async (input) => {
    if (!userIdRef.current) return fail("سجّل الدخول أولاً.");
    const { data, error } = await getSupabase().from("khiaty_requests").insert({
      customer_id: userIdRef.current, title: input.title, cat: input.cat, descr: input.desc, img: input.img,
      min_budget: input.min, max_budget: input.max, need_by: input.needBy,
    }).select("id").single();
    if (error || !data) return fail(friendly(error?.message));
    await refresh().catch(() => {});
    showToast("تم نشر الطلب (مفتوح) وأصبح ظاهراً لكل الخيّاطين.");
    return ok(data.id as string);
  }, [refresh, showToast]);

  const submitBid = useCallback<KhiatyStore["submitBid"]>(async (reqId, input) => {
    const had = db.bids.find((b) => b.req === reqId && b.tailor === userIdRef.current);
    const res = await getSupabase().rpc("khiaty_submit_bid", {
      p_request: reqId, p_up: input.up, p_fin: input.fin, p_days: input.days, p_note: input.note,
    });
    if (res.error) return fail(friendly(res.error.message));
    await refresh().catch(() => {});
    showToast(had ? `تم حفظ نسخة جديدة #${had.v.length + 1} وعاد العرض معلّقاً.` : "تم إرسال العرض (معلّق).");
    return ok(undefined);
  }, [db.bids, refresh, showToast]);

  const declineBid = useCallback<KhiatyStore["declineBid"]>(async (bidId) => {
    await act(() => getSupabase().rpc("khiaty_decline_bid", { p_bid: bidId }), "تم رفض العرض. يمكن للخيّاط تعديله فيعود معلّقاً.");
  }, [act]);

  const acceptBid = useCallback<KhiatyStore["acceptBid"]>(async (bidId) => {
    const { data, error } = await getSupabase().rpc("khiaty_accept_bid", { p_bid: bidId });
    if (error || !data) return fail(friendly(error?.message));
    await refresh().catch(() => {});
    return ok(data as string);
  }, [refresh]);

  const setOrderStage = useCallback<KhiatyStore["setOrderStage"]>(async (orderId, stage, msg) => {
    await act(() => getSupabase().rpc("khiaty_set_order_stage", { p_order: orderId, p_stage: stage }), msg);
  }, [act]);

  /** Sandbox stand-in for the payment-gateway webhook (see khiaty_confirm_payment in the DB). */
  const confirmPayment = useCallback<KhiatyStore["confirmPayment"]>((orderId, phase) =>
    act(() => getSupabase().rpc("khiaty_confirm_payment", { p_order: orderId, p_phase: phase }),
      phase === "up"
        ? "وصل إشعار البوابة: تم دفع المقدّم، والطلب مقبول، وفُتحت الدردشة."
        : "وصل إشعار البوابة: تم دفع الدفعة النهائية."), [act]);

  const sendMessage = useCallback<KhiatyStore["sendMessage"]>(async (orderId, text) => {
    const body = text.trim();
    if (!body || !userIdRef.current) return;
    await act(() => getSupabase().from("khiaty_messages").insert({ order_id: orderId, sender_id: userIdRef.current, body }));
  }, [act]);

  const submitReview = useCallback<KhiatyStore["submitReview"]>(async (orderId, stars, text) => {
    await act(() => getSupabase().rpc("khiaty_submit_review", { p_order: orderId, p_stars: stars, p_text: text }),
      "شكراً! أُضيف تقييمك إلى سجل الخيّاط.");
  }, [act]);

  const getCompetition = useCallback<KhiatyStore["getCompetition"]>(async (reqId) => {
    const { data, error } = await getSupabase().rpc("khiaty_competition", { p_request: reqId });
    if (error) return fail(friendly(error.message));
    const row = (data as Row[] | null)?.[0];
    return ok({
      count: row?.bid_count ?? 0,
      lowest: row?.lowest == null ? null : Number(row.lowest),
      fastest: row?.fastest ?? null,
    });
  }, []);

  const value = useMemo<KhiatyStore>(() => ({
    ready, loadError, reload, db, user, toast, showToast, signIn, signUp, signOut, publishRequest, submitBid,
    declineBid, acceptBid, setOrderStage, confirmPayment, sendMessage, submitReview, getCompetition,
  }), [ready, loadError, reload, db, user, toast, showToast, signIn, signUp, signOut, publishRequest, submitBid,
    declineBid, acceptBid, setOrderStage, confirmPayment, sendMessage, submitReview, getCompetition]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
