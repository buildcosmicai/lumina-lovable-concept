export type LicensingSummary = {
  screensUsed: number;
  entitlement: number;
  state: "OK" | "EXPIRING" | "GRACE" | "EXPIRED";
  grants: {
    id: string;
    kind: "PAID" | "DEMO";
    quantity: number;
    startsAt: string;
    expiresAt: string | null;
    state:
      | "OK"
      | "ACTIVE"
      | "UPCOMING"
      | "EXPIRING"
      | "GRACE"
      | "EXPIRED"
      | "SUPERSEDED"
      | "REVOKED";
  }[];
  plan: {
    key: "DEMO" | "STARTER" | "BUSINESS" | "ENTERPRISE";
    label: string;
    features: Record<
      | "AUDIT_LOG"
      | "CUSTOM_ROLES"
      | "API_ACCESS"
      | "SSO"
      | "WHITE_LABEL"
      | "ROOM_DISPLAY"
      | "LIGHT_BAR"
      | "CLOCK_TIMER"
      | "WEB_PRESETS",
      boolean
    >;
    limits: { maxUsers: number | null; maxSites: number | null; storageGb: number | null };
    extraSites?: number;
    extraStorageGb?: number;
    support?: string;
  };
  seller: { name: string; contactEmail: string | null; phone: string | null } | null;
  orders: { orderId: string; quantity: number; purpose: "PAID" | "DEMO"; decidedAt: string | null }[];
};

export type PlanFeatureKey = keyof LicensingSummary["plan"]["features"];

export const FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  AUDIT_LOG: "Audit log",
  CUSTOM_ROLES: "Custom roles and permissions",
  API_ACCESS: "API access",
  SSO: "Single sign-on",
  WHITE_LABEL: "White-label",
  ROOM_DISPLAY: "Orbit room display",
  LIGHT_BAR: "Power and light-bar control",
  CLOCK_TIMER: "Clock and Timer pack",
  WEB_PRESETS: "Web and video presets",
};

export const GRANT_STATE_LABELS: Record<LicensingSummary["grants"][number]["state"], string> = {
  OK: "Active",
  ACTIVE: "Active",
  UPCOMING: "Starts soon",
  EXPIRING: "Expiring soon",
  GRACE: "Grace period",
  EXPIRED: "Expired",
  SUPERSEDED: "Replaced",
  REVOKED: "Revoked",
};

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const allFeatures = (on: PlanFeatureKey[]): Record<PlanFeatureKey, boolean> => ({
  AUDIT_LOG: on.includes("AUDIT_LOG"),
  CUSTOM_ROLES: on.includes("CUSTOM_ROLES"),
  API_ACCESS: on.includes("API_ACCESS"),
  SSO: on.includes("SSO"),
  WHITE_LABEL: on.includes("WHITE_LABEL"),
  ROOM_DISPLAY: on.includes("ROOM_DISPLAY"),
  LIGHT_BAR: on.includes("LIGHT_BAR"),
  CLOCK_TIMER: on.includes("CLOCK_TIMER"),
  WEB_PRESETS: on.includes("WEB_PRESETS"),
});

const businessPlan = {
  key: "BUSINESS" as const,
  label: "Business",
  features: allFeatures(["AUDIT_LOG", "CUSTOM_ROLES", "ROOM_DISPLAY", "LIGHT_BAR", "CLOCK_TIMER", "WEB_PRESETS"]),
  limits: { maxUsers: 25, maxSites: 10, storageGb: 100 },
  support: "Priority support",
};

export const MOCK_SUMMARIES: Record<string, LicensingSummary> = {
  "paid-ok": {
    screensUsed: 3,
    entitlement: 5,
    state: "OK",
    grants: [
      { id: "lic-1042", kind: "PAID", quantity: 5, startsAt: daysFromNow(-210), expiresAt: daysFromNow(155), state: "ACTIVE" },
      { id: "lic-0977", kind: "PAID", quantity: 3, startsAt: daysFromNow(-575), expiresAt: daysFromNow(-210), state: "SUPERSEDED" },
    ],
    plan: { ...businessPlan },
    seller: { name: "Signal Retail Systems", contactEmail: "licensing@signalretail.example", phone: "+44 20 7946 0813" },
    orders: [
      { orderId: "ORD-2026-0142", quantity: 5, purpose: "PAID", decidedAt: daysFromNow(-212) },
      { orderId: "ORD-2025-0311", quantity: 3, purpose: "PAID", decidedAt: daysFromNow(-578) },
    ],
  },
  "demo-expiring": {
    screensUsed: 2,
    entitlement: 4,
    state: "EXPIRING",
    grants: [
      { id: "lic-demo-18", kind: "DEMO", quantity: 4, startsAt: daysFromNow(-22), expiresAt: daysFromNow(8), state: "EXPIRING" },
    ],
    plan: {
      key: "DEMO",
      label: "Demo",
      features: allFeatures(["ROOM_DISPLAY", "CLOCK_TIMER", "WEB_PRESETS"]),
      limits: { maxUsers: 3, maxSites: 1, storageGb: 5 },
      support: "Community support",
    },
    seller: { name: "NorthBridge Distribution", contactEmail: "hello@northbridge.example", phone: "+1 415 555 0132" },
    orders: [{ orderId: "ORD-2026-0078", quantity: 4, purpose: "DEMO", decidedAt: daysFromNow(-22) }],
  },
  grace: {
    screensUsed: 6,
    entitlement: 6,
    state: "GRACE",
    grants: [
      { id: "lic-1010", kind: "PAID", quantity: 6, startsAt: daysFromNow(-370), expiresAt: daysFromNow(-5), state: "GRACE" },
    ],
    plan: { ...businessPlan },
    seller: { name: "Signal Retail Systems", contactEmail: "licensing@signalretail.example", phone: "+44 20 7946 0813" },
    orders: [{ orderId: "ORD-2025-0288", quantity: 6, purpose: "PAID", decidedAt: daysFromNow(-372) }],
  },
  expired: {
    screensUsed: 4,
    entitlement: 4,
    state: "EXPIRED",
    grants: [
      { id: "lic-0990", kind: "PAID", quantity: 4, startsAt: daysFromNow(-400), expiresAt: daysFromNow(-35), state: "EXPIRED" },
    ],
    plan: { ...businessPlan, support: "Standard support" },
    seller: { name: "NorthBridge Distribution", contactEmail: "hello@northbridge.example", phone: null },
    orders: [{ orderId: "ORD-2025-0201", quantity: 4, purpose: "PAID", decidedAt: daysFromNow(-402) }],
  },
  "no-seller": {
    screensUsed: 12,
    entitlement: 12,
    state: "OK",
    grants: [
      { id: "lic-1200", kind: "PAID", quantity: 12, startsAt: daysFromNow(-90), expiresAt: null, state: "ACTIVE" },
    ],
    plan: {
      key: "ENTERPRISE",
      label: "Enterprise",
      features: allFeatures(["AUDIT_LOG", "CUSTOM_ROLES", "API_ACCESS", "SSO", "WHITE_LABEL", "ROOM_DISPLAY", "LIGHT_BAR", "CLOCK_TIMER", "WEB_PRESETS"]),
      limits: { maxUsers: null, maxSites: null, storageGb: null },
      extraSites: 4,
      extraStorageGb: 250,
      support: "Dedicated account manager",
    },
    seller: null,
    orders: [
      { orderId: "ORD-2026-0201", quantity: 12, purpose: "PAID", decidedAt: daysFromNow(-92) },
    ],
  },
  empty: {
    screensUsed: 0,
    entitlement: 0,
    state: "OK",
    grants: [],
    plan: {
      key: "STARTER",
      label: "Starter",
      features: allFeatures(["CLOCK_TIMER", "WEB_PRESETS"]),
      limits: { maxUsers: 5, maxSites: 2, storageGb: 20 },
      support: "Standard support",
    },
    seller: { name: "Signal Retail Systems", contactEmail: "licensing@signalretail.example", phone: "+44 20 7946 0813" },
    orders: [],
  },
};

export const PLAN_STATES = [
  { key: "paid-ok", label: "Paid, OK" },
  { key: "demo-expiring", label: "Demo expiring" },
  { key: "grace", label: "Grace" },
  { key: "expired", label: "Expired" },
  { key: "no-seller", label: "No seller" },
  { key: "empty", label: "Empty" },
  { key: "loading", label: "Loading" },
  { key: "error", label: "Error" },
] as const;

export type PlanMockState = (typeof PLAN_STATES)[number]["key"];

export function getMockSummary(state: string | undefined): {
  summary: LicensingSummary | null;
  mode: "data" | "loading" | "error";
} {
  if (state === "loading") return { summary: null, mode: "loading" };
  if (state === "error") return { summary: null, mode: "error" };
  const summary = (state && MOCK_SUMMARIES[state]) || MOCK_SUMMARIES["paid-ok"];
  return { summary, mode: "data" };
}
