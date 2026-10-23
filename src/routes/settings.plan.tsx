import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, Building2, Check, Clock3, CreditCard, Layers3, Lock, Mail, MonitorSmartphone, Phone, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FEATURE_LABELS,
  GRANT_STATE_LABELS,
  getMockSummary,
  PLAN_STATES,
  type LicensingSummary,
  type PlanFeatureKey,
} from "@/lib/plan-licensing";
import { cn } from "@/lib/utils";

type PlanSearch = { state?: string };

export const Route = createFileRoute("/settings/plan")({
  validateSearch: (search: Record<string, unknown>): PlanSearch => {
    const raw = search["state"];
    return typeof raw === "string" ? { state: raw } : {};
  },
  head: () => ({
    meta: [
      { title: "Plan & licences — Signage CMS" },
      { name: "description", content: "See your screen licences, current plan, features and who to contact for more." },
      { property: "og:title", content: "Plan & licences — Signage CMS" },
      { property: "og:description", content: "See your screen licences, current plan, features and who to contact for more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanPage,
});

const formatDate = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : null;

const daysUntil = (iso: string) =>
  Math.round((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86_400_000);

function grantBadgeVariant(state: LicensingSummary["grants"][number]["state"]) {
  if (state === "ACTIVE" || state === "OK") return "default" as const;
  if (state === "EXPIRING" || state === "UPCOMING" || state === "GRACE") return "secondary" as const;
  if (state === "EXPIRED" || state === "REVOKED") return "destructive" as const;
  return "outline" as const;
}

function PlanPage() {
  const { state } = Route.useSearch();
  const { summary, mode } = getMockSummary(state);

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <p className="label-caps mb-2">SETTINGS</p>
      <h1 className="font-display text-3xl font-semibold">Plan &amp; licences</h1>

      <nav aria-label="Preview states" className="mt-4 flex flex-wrap gap-1.5">
        {PLAN_STATES.map((s) => (
          <Button
            key={s.key}
            asChild
            size="sm"
            variant={(state ?? "paid-ok") === s.key ? "secondary" : "ghost"}
            className="text-xs"
          >
            <Link to="/settings/plan" search={{ state: s.key }}>{s.label}</Link>
          </Button>
        ))}
      </nav>

      {mode === "loading" && <PlanSkeleton />}
      {mode === "error" && <PlanError />}
      {mode === "data" && summary && <PlanContent summary={summary} />}
    </main>
  );
}

function PlanSkeleton() {
  return (
    <div className="mt-8 space-y-6" aria-label="Loading plan details">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}

function PlanError() {
  return (
    <div role="alert" className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
      <AlertTriangle className="mx-auto size-8 text-destructive" />
      <h2 className="mt-3 font-display text-lg font-semibold">We couldn't load your plan</h2>
      <p className="mt-1 text-sm text-muted-foreground">Something went wrong while fetching your licence details.</p>
      <Button asChild className="mt-5" variant="outline">
        <Link to="/settings/plan" search={{ state: "error" }}><RefreshCw className="size-4" />Try again</Link>
      </Button>
    </div>
  );
}

function PlanContent({ summary }: { summary: LicensingSummary }) {
  const activeGrants = summary.grants.filter((g) => !["SUPERSEDED", "REVOKED"].includes(g.state));
  const expiries = activeGrants.filter((g) => g.expiresAt).map((g) => g.expiresAt as string).sort();
  const nextExpiry = expiries[0] ?? null;
  const demoGrant = activeGrants.find((g) => g.kind === "DEMO");
  const usagePct = summary.entitlement > 0 ? Math.min(100, Math.round((summary.screensUsed / summary.entitlement) * 100)) : 0;
  const nearLimit = summary.entitlement > 0 && summary.screensUsed / summary.entitlement > 0.95;
  const remaining = Math.max(0, summary.entitlement - summary.screensUsed);

  return (
    <div className="mt-8 space-y-10">
      {summary.state !== "OK" && (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 text-sm",
            summary.state === "EXPIRED" ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10",
          )}
        >
          <AlertTriangle className={cn("mt-0.5 size-5 shrink-0", summary.state === "EXPIRED" ? "text-destructive" : "text-warning")} />
          <p>
            {summary.state === "EXPIRING" && nextExpiry && (
              <>Your licence expires in {daysUntil(nextExpiry)} days ({formatDate(nextExpiry)}). Contact your provider to renew.</>
            )}
            {summary.state === "GRACE" && (
              <>Your licence has expired and is in a 14-day grace period. After that, adding screens and making changes is blocked. Screens keep playing.</>
            )}
            {summary.state === "EXPIRED" && (
              <>Your licence has expired. Adding screens and making changes is blocked until it is renewed. Your screens keep playing the last published content.</>
            )}
          </p>
        </div>
      )}

      {demoGrant && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            This is a demo. It ends on {formatDate(demoGrant.expiresAt)}. Contact{" "}
            {summary.seller ? summary.seller.name : "your Lumina account manager"} to continue with a full licence.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <section aria-label="Screens" className="rounded-xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><MonitorSmartphone className="size-4" />Screens</p>
          <p className="mt-3 font-display text-3xl font-semibold">
            {summary.screensUsed} <span className="text-lg text-muted-foreground">/ {summary.entitlement}</span>
          </p>
          <Progress
            value={usagePct}
            aria-label={`Screen usage: ${summary.screensUsed} of ${summary.entitlement} licensed screens in use`}
            className={cn("mt-3", nearLimit && "[&>div]:bg-destructive")}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {remaining} licensed screen{remaining === 1 ? "" : "s"} still available
          </p>
        </section>

        <section aria-label="Your plan" className="rounded-xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Layers3 className="size-4" />Your plan</p>
          <Badge className="mt-3 text-sm" variant={summary.plan.key === "DEMO" ? "secondary" : "default"}>
            {summary.plan.label}
          </Badge>
          {summary.plan.support && <p className="mt-3 text-sm text-muted-foreground">{summary.plan.support}</p>}
        </section>

        <section aria-label="Valid until" className="rounded-xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />Valid until</p>
          {nextExpiry ? (
            <>
              <p className="mt-3 font-display text-2xl font-semibold">{formatDate(nextExpiry)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {daysUntil(nextExpiry) < 0 ? "Expired" : daysUntil(nextExpiry) === 0 ? "Expires today" : `in ${daysUntil(nextExpiry)} days`}
              </p>
            </>
          ) : (
            <p className="mt-3 font-display text-2xl font-semibold">No expiry</p>
          )}
        </section>
      </div>

      <section aria-label="Licences">
        <h2 className="font-display text-lg font-semibold">Licences</h2>
        {summary.grants.length === 0 ? (
          <p className="mt-3 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No licences yet. Your provider adds screens for you.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">Type</th>
                  <th scope="col" className="px-4 py-3 font-medium">Screens</th>
                  <th scope="col" className="px-4 py-3 font-medium">Starts</th>
                  <th scope="col" className="px-4 py-3 font-medium">Valid until</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.grants.map((grant) => (
                  <tr key={grant.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Badge variant={grant.kind === "DEMO" ? "secondary" : "outline"}>{grant.kind === "DEMO" ? "Demo" : "Paid"}</Badge>
                    </td>
                    <td className="px-4 py-3">{grant.quantity}</td>
                    <td className="px-4 py-3">{formatDate(grant.startsAt)}</td>
                    <td className="px-4 py-3">{grant.expiresAt ? formatDate(grant.expiresAt) : "No expiry"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={grantBadgeVariant(grant.state)}>{GRANT_STATE_LABELS[grant.state]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-label="What your plan includes">
        <h2 className="font-display text-lg font-semibold">What your plan includes</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(FEATURE_LABELS) as PlanFeatureKey[]).map((key) => {
            const included = summary.plan.features[key];
            return (
              <li
                key={key}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm",
                  !included && "text-muted-foreground",
                )}
              >
                {included ? <Check className="size-4 shrink-0 text-primary" /> : <Lock className="size-4 shrink-0" />}
                <span>{FEATURE_LABELS[key]}</span>
                {!included && <span className="ml-auto text-xs">Not in your plan</span>}
              </li>
            );
          })}
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {(
            [
              ["Users", summary.plan.limits.maxUsers],
              ["Sites", summary.plan.limits.maxSites === null ? null : summary.plan.limits.maxSites + (summary.plan.extraSites ?? 0)],
              [
                "Storage",
                summary.plan.limits.storageGb === null
                  ? null
                  : `${summary.plan.limits.storageGb + (summary.plan.extraStorageGb ?? 0)} GB`,
              ],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-lg font-semibold">{value === null ? "Unlimited" : value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Plans: Starter, Business, Enterprise.</p>
      </section>

      <section aria-label="Need more screens or features" className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Building2 className="size-5 text-accent" />Need more screens or features?
        </h2>
        {summary.seller ? (
          <div className="mt-3 space-y-1.5 text-sm">
            <p className="font-medium">{summary.seller.name}</p>
            {summary.seller.contactEmail && (
              <p>
                <a href={`mailto:${summary.seller.contactEmail}`} className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline">
                  <Mail className="size-3.5" />{summary.seller.contactEmail}
                </a>
              </p>
            )}
            {summary.seller.phone && (
              <p className="flex items-center gap-1.5 text-muted-foreground"><Phone className="size-3.5" />{summary.seller.phone}</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm">Contact your Lumina account manager.</p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">Licences are arranged by your provider.</p>
      </section>

      <section aria-label="Order history">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <CreditCard className="size-5 text-accent" />Order history
        </h2>
        {summary.orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card text-sm">
            {summary.orders.map((order) => (
              <li key={order.orderId} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <span className="font-mono text-xs">{order.orderId}</span>
                <span>
                  {order.quantity} screens{order.purpose === "DEMO" ? " (demo)" : ""}
                </span>
                <span className="ml-auto text-muted-foreground">{order.decidedAt ? formatDate(order.decidedAt) : "Pending"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
