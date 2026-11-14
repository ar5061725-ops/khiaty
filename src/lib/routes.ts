import type { PayPhase, Role } from "./types";

export const homeFor = (role: Role) => (role === "tailor" ? "/browse" : "/requests");

export const routes = {
  landing: "/",
  login: "/login",
  signup: "/login?mode=signup",
  requests: "/requests",
  newRequest: "/requests/new",
  request: (id: string) => `/requests/${id}`,
  browse: "/browse",
  tailorRequest: (id: string) => `/browse/${id}`,
  myBids: "/my-bids",
  bidHistory: (id: string) => `/bids/${id}/history`,
  orders: "/orders",
  order: (id: string) => `/orders/${id}`,
  chat: (id: string) => `/orders/${id}/chat`,
  pay: (orderId: string, phase: PayPhase) => `/pay/${orderId}?phase=${phase}`,
  payments: "/payments",
  paySuccess: (orderId: string) => `/pay/success?order=${orderId}`,
  payError: (status: string, orderId?: string) => `/pay/error?status=${status}${orderId ? `&order=${orderId}` : ""}`,
};

export const navFor = (role: Role) =>
  role === "customer"
    ? [
        { href: routes.requests, label: "طلباتي" },
        { href: routes.orders, label: "الطلبات" },
        { href: routes.payments, label: "المدفوعات" },
        { href: routes.newRequest, label: "طلب جديد" },
      ]
    : [
        { href: routes.browse, label: "تصفّح الطلبات" },
        { href: routes.myBids, label: "عروضي" },
        { href: routes.orders, label: "الطلبات" },
        { href: routes.payments, label: "المدفوعات" },
      ];
