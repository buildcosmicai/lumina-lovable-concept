import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity, Building2, CalendarDays, Check, ChevronLeft, ChevronRight, FileUp, Gauge, Handshake, Images, KeyRound, Layers,
  LifeBuoy, ListVideo, Monitor, Network, Plus, Search, Settings, Users, X, Eye, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partners — Signage CMS" },
      { name: "description", content: "Onboard distributors and resellers, scope them to the customers they sell to, and approve licence requests." },
      { property: "og:title", content: "Partners — Signage CMS" },
      { property: "og:description", content: "Distributor and reseller portal with scoped customer visibility and PO-based licence requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnersPage,
});

const NAV_ITEMS = [
  { label: "Control Center", icon: Gauge, to: "/control-center" as const },
  { label: "Pulse", icon: Activity, to: "/pulse" as const },
  { label: "Screens", icon: Monitor, to: "/screens" as const },
  { label: "Schedules", icon: CalendarDays, to: "/schedules" as const },
  { label: "Media", icon: Images, to: "/media" as const },
  { label: "Playlists", icon: ListVideo, to: "/playlists" as const },
  { label: "Layouts", icon: Layers, to: "/layouts" as const },
  { label: "Licensing", icon: KeyRound },
  { label: "Users", icon: Users, to: "/users" as const },
  { label: "Partners", icon: Handshake, to: "/partners" as const },
];

type PartnerType = "Distributor" | "Reseller";
type Partner = { id: string; name: string; type: PartnerType; parent?: string | undefined; region: string; contact: string; status: "Active" | "Invited" };
type Customer = { id: string; name: string; partner: string; screens: number; online: number; licences: number; renewal: string; support: "None" | "Requested" | "Granted" };
type ReqStatus = "Pending" | "Approved" | "Rejected";
type LicReq = { id: number; customer: string; partner: string; qty: number; po: string; status: ReqStatus; date: string };

const SEED_PARTNERS: Partner[] = [
  { id: "d1", name: "NorthBridge Distribution", type: "Distributor", region: "UK & Ireland", contact: "ops@northbridge.co", status: "Active" },
  { id: "d2", name: "Vista AV Supply", type: "Distributor", region: "DACH", contact: "partners@vista-av.de", status: "Active" },
  { id: "r1", name: "BrightWall Integrators", type: "Reseller", parent: "d1", region: "London", contact: "hello@brightwall.io", status: "Active" },
  { id: "r2", name: "Signal Retail Systems", type: "Reseller", parent: "d1", region: "Manchester", contact: "sales@signalrs.co.uk", status: "Active" },
  { id: "r3", name: "Alpen Display GmbH", type: "Reseller", parent: "d2", region: "Munich", contact: "info@alpendisplay.de", status: "Invited" },
];
const SEED_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Harbour Coffee Co.", partner: "r1", screens: 42, online: 40, licences: 45, renewal: "Mar 2027", support: "None" },
  { id: "c2", name: "Metro Fitness", partner: "r1", screens: 18, online: 18, licences: 20, renewal: "Jan 2027", support: "Granted" },
  { id: "c3", name: "Lumen Pharmacies", partner: "r2", screens: 96, online: 91, licences: 100, renewal: "Nov 2026", support: "None" },
  { id: "c4", name: "Grand Atrium Hotels", partner: "d1", screens: 30, online: 29, licences: 30, renewal: "Jun 2027", support: "None" },
  { id: "c5", name: "Bergbahn Resorts", partner: "r3", screens: 12, online: 9, licences: 12, renewal: "Dec 2026", support: "Requested" },
  { id: "c6", name: "Kaufhaus Weiss", partner: "d2", screens: 64, online: 64, licences: 70, renewal: "Apr 2027", support: "None" },
];
const SEED_REQS: LicReq[] = [
  { id: 1, customer: "c3", partner: "r2", qty: 25, po: "PO-88412.pdf", status: "Pending", date: "Today" },
  { id: 2, customer: "c1", partner: "r1", qty: 10, po: "PO-2026-117.pdf", status: "Approved", date: "3 d ago" },
  { id: 3, customer: "c5", partner: "r3", qty: 4, po: "BB-order-04.pdf", status: "Pending", date: "Yesterday" },
];

// Who is looking: vendor sees all; distributor sees itself + its resellers; reseller sees itself.
function scopeIds(viewer: string, partners: Partner[]): string[] | null {
  if (viewer === "vendor") return null;
  const me = partners.find((p) => p.id === viewer);
  if (!me) return [];
  return me.type === "Distributor" ? [me.id, ...partners.filter((p) => p.parent === me.id).map((p) => p.id)] : [me.id];
}

function PartnersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [partners, setPartners] = useState(SEED_PARTNERS);
  const [customers, setCustomers] = useState(SEED_CUSTOMERS);
  const [reqs, setReqs] = useState(SEED_REQS);
  const [viewer, setViewer] = useState("vendor");
  const [tab, setTab] = useState<"customers" | "requests" | "partners">("customers");
  const [focus, setFocus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<null | "partner" | "customer" | { licence: string }>(null);

  const isVendor = viewer === "vendor";
  const scope = scopeIds(viewer, partners);
  const inScope = (pid: string) => !scope || scope.includes(pid);
  const pName = (id: string) => partners.find((p) => p.id === id)?.name ?? "—";
  const cName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";
  const navAction = (label: string) => toast(label, { description: "This section is not connected yet." });

  const focusIds = focus ? [focus, ...partners.filter((p) => p.parent === focus).map((p) => p.id)] : null;
  const visCustomers = useMemo(() => customers.filter((c) => inScope(c.partner) && (!focusIds || focusIds.includes(c.partner)) && c.name.toLowerCase().includes(query.toLowerCase())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers, viewer, focus, query, partners]);
  const visReqs = reqs.filter((r) => inScope(r.partner));
  const visPartners = partners.filter((p) => inScope(p.id));
  const distributors = visPartners.filter((p) => p.type === "Distributor" || (p.type === "Reseller" && !visPartners.some((d) => d.id === p.parent)));

  const totals = {
    customers: visCustomers.length,
    screens: visCustomers.reduce((s, c) => s + c.screens, 0),
    online: visCustomers.reduce((s, c) => s + c.online, 0),
    pending: visReqs.filter((r) => r.status === "Pending").length,
  };

  const decide = (id: number, status: ReqStatus) => {
    const r = reqs.find((x) => x.id === id)!;
    setReqs((all) => all.map((x) => (x.id === id ? { ...x, status } : x)));
    if (status === "Approved") setCustomers((all) => all.map((c) => (c.id === r.customer ? { ...c, licences: c.licences + r.qty } : c)));
    toast(`Request ${status.toLowerCase()}`, { description: `${r.qty} licences for ${cName(r.customer)}` });
  };

  return (
    <div className="flex h-screen min-w-[1080px] overflow-hidden bg-surface text-foreground">
      <Toaster />
      <aside className={cn("relative flex h-screen shrink-0 border-r border-border bg-card transition-[width] duration-200", sidebarOpen ? "w-64" : "w-16")}>
        <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
          <Link to="/control-center" aria-label="Control Centre home" className="mb-5 grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Layers className="size-4" /></Link>
          <nav aria-label="Primary navigation" className="flex flex-col items-center gap-0.5">
            {NAV_ITEMS.map((item) => item.to ? (
              <Button key={item.label} asChild variant="ghost" size="icon" className={cn("size-9 text-muted-foreground", item.to === "/partners" && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}>
                <Link to={item.to} title={item.label} aria-label={item.label}><item.icon className="size-4" /></Link>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" size="icon" title={item.label} aria-label={item.label} onClick={() => navAction(item.label)} className="size-9 text-muted-foreground"><item.icon className="size-4" /></Button>
            ))}
          </nav>
          <Button variant="ghost" size="icon" title="Settings" aria-label="Settings" className="mt-auto size-9 text-muted-foreground" onClick={() => navAction("Settings")}><Settings className="size-4" /></Button>
        </div>
        {sidebarOpen && <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-3">
          <div className="mb-5 flex h-9 items-center justify-between gap-2">
            <div className="flex items-baseline gap-2"><p className="font-display text-sm font-semibold">Signage CMS</p><p className="label-caps">Workspace</p></div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar" className="size-7 text-muted-foreground"><ChevronLeft className="size-3.5" /></Button>
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => item.to ? (
              <Button key={item.label} asChild variant="ghost" className={cn("h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground", item.to === "/partners" && "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary")}>
                <Link to={item.to}><item.icon className="size-4 shrink-0" />{item.label}</Link>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" onClick={() => navAction(item.label)} className="h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground"><item.icon className="size-4 shrink-0" />{item.label}</Button>
            ))}
          </nav>
          <section className="mt-5 border-t border-border pt-5">
            <p className="label-caps px-2">Filter by partner</p>
            <ul className="mt-2 space-y-0.5 text-xs">
              <li><button onClick={() => setFocus(null)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left", !focus ? "bg-secondary font-semibold" : "text-muted-foreground hover:bg-secondary")}><Network className="size-3.5" />All partners</button></li>
              {distributors.map((d) => (
                <li key={d.id}>
                  <button onClick={() => setFocus(d.id)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left", focus === d.id ? "bg-secondary font-semibold" : "text-muted-foreground hover:bg-secondary")}>
                    <Building2 className="size-3.5 shrink-0" /><span className="truncate">{d.name}</span></button>
                  <ul className="ml-4 border-l border-border pl-2">
                    {visPartners.filter((r) => r.parent === d.id).map((r) => (
                      <li key={r.id}><button onClick={() => setFocus(r.id)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1 text-left", focus === r.id ? "bg-secondary font-semibold" : "text-muted-foreground hover:bg-secondary")}>
                        <Handshake className="size-3 shrink-0" /><span className="truncate">{r.name}</span></button></li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        </div>}
        {!sidebarOpen && <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" className="absolute left-11 top-3 size-7 border border-border bg-card text-muted-foreground shadow-sm"><ChevronRight className="size-3.5" /></Button>}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="flex items-center gap-4 border-b border-border bg-card px-6 py-4">
          <div>
            <p className="label-caps">Channel</p>
            <h1 className="font-display text-xl font-semibold">Partners</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1">
            <Eye className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Viewing as</span>
            <select aria-label="Viewing as" value={viewer} onChange={(e) => { setViewer(e.target.value); setFocus(null); setTab("customers"); }} className="bg-transparent text-xs font-semibold outline-none">
              <option value="vendor">Vendor (you)</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.type}: {p.name}</option>)}
            </select>
          </div>
          {isVendor
            ? <Button onClick={() => setDialog("partner")} className="gap-2"><Plus className="size-4" />Onboard partner</Button>
            : <Button onClick={() => setDialog("customer")} className="gap-2"><Plus className="size-4" />Add customer</Button>}
        </header>

        {!isVendor && <div className="mx-6 mt-4 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
          <ShieldCheck className="size-4 text-primary" />
          Partner preview — {pName(viewer)} only sees customers sold through them{partners.find((p) => p.id === viewer)?.type === "Distributor" ? " and their resellers" : ""}. Licences are requested with a PO and approved by the vendor.
        </div>}

        <section className="grid grid-cols-4 gap-3 px-6 pt-4">
          {[["Customers", totals.customers], ["Screens", totals.screens], ["Online", `${totals.screens ? Math.round((totals.online / totals.screens) * 100) : 0}%`], ["Pending licence requests", totals.pending]].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-border bg-card p-4"><p className="label-caps">{l}</p><p className="mt-1 font-display text-2xl font-semibold">{v}</p></div>
          ))}
        </section>

        <div className="flex items-center gap-1 px-6 pt-5">
          {([["customers", "Customers"], ["requests", "Licence requests"], ...(isVendor ? [["partners", "Partners"]] : [])] as [typeof tab, string][]).map(([k, l]) => (
            <Button key={k} variant="ghost" size="sm" onClick={() => setTab(k)} className={cn("text-muted-foreground", tab === k && "bg-secondary font-semibold text-foreground")}>{l}</Button>
          ))}
          {tab === "customers" && <div className="relative ml-auto w-64"><Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers" className="h-9 pl-8 text-sm" /></div>}
        </div>

        <div className="px-6 py-4">
          {tab === "customers" && (
            <table className="w-full overflow-hidden rounded-lg border border-border bg-card text-sm">
              <thead className="bg-surface text-left"><tr className="label-caps">{["Customer", "Sold through", "Screens", "Licences used", "Renewal", "Support access", ""].map((h) => <th key={h} className="px-4 py-2 font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {visCustomers.map((c) => {
                  const p = partners.find((x) => x.id === c.partner);
                  const used = Math.round((c.screens / Math.max(1, c.licences)) * 100);
                  return (
                    <tr key={c.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p?.name}{p?.parent && <span className="block">via {pName(p.parent)}</span>}</td>
                      <td className="px-4 py-3 font-mono text-xs">{c.online}/{c.screens} online</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded-full bg-secondary"><div className={cn("h-full rounded-full", used >= 95 ? "bg-destructive" : "bg-zone-4")} style={{ width: `${Math.min(100, used)}%` }} /></div><span className="font-mono text-xs">{c.screens}/{c.licences}</span></div></td>
                      <td className="px-4 py-3 text-xs">{c.renewal}</td>
                      <td className="px-4 py-3 text-xs">
                        {c.support === "Granted" ? <span className="rounded bg-zone-4/15 px-2 py-0.5">Granted</span>
                          : c.support === "Requested" ? <span className="rounded bg-primary/15 px-2 py-0.5">Awaiting customer</span>
                          : isVendor ? <span className="text-muted-foreground">—</span>
                          : <button className="inline-flex items-center gap-1 text-primary hover:underline" onClick={() => { setCustomers((all) => all.map((x) => (x.id === c.id ? { ...x, support: "Requested" } : x))); toast("Support access requested", { description: `${c.name}'s admin must approve it.` }); }}><LifeBuoy className="size-3" />Request</button>}
                      </td>
                      <td className="px-4 py-3 text-right">{!isVendor && <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setDialog({ licence: c.id })}><FileUp className="size-3" />Request licences</Button>}</td>
                    </tr>
                  );
                })}
                {!visCustomers.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No customers in this view.</td></tr>}
              </tbody>
            </table>
          )}

          {tab === "requests" && (
            <ul className="space-y-2">
              {visReqs.map((r) => (
                <li key={r.id} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
                  <KeyRound className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.qty} licences · {cName(r.customer)}</p>
                    <p className="text-xs text-muted-foreground">{pName(r.partner)} · {r.date} · <span className="font-mono">{r.po}</span></p>
                  </div>
                  <span className={cn("rounded px-2 py-0.5 text-xs", r.status === "Approved" ? "bg-zone-4/15" : r.status === "Rejected" ? "bg-destructive/15 text-destructive" : "bg-primary/15")}>{r.status}</span>
                  {isVendor && r.status === "Pending" && <>
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => decide(r.id, "Rejected")}><X className="size-3" />Reject</Button>
                    <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => decide(r.id, "Approved")}><Check className="size-3" />Approve</Button>
                  </>}
                </li>
              ))}
              {!visReqs.length && <p className="py-10 text-center text-sm text-muted-foreground">No licence requests yet.</p>}
            </ul>
          )}

          {tab === "partners" && isVendor && (
            <div className="grid grid-cols-2 gap-3">
              {partners.map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    {p.type === "Distributor" ? <Building2 className="size-4 text-primary" /> : <Handshake className="size-4 text-accent" />}
                    <p className="font-medium">{p.name}</p>
                    <span className={cn("ml-auto rounded px-2 py-0.5 text-xs", p.status === "Active" ? "bg-zone-4/15" : "bg-primary/15")}>{p.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.type}{p.parent && ` under ${pName(p.parent)}`} · {p.region} · {p.contact}</p>
                  <p className="mt-2 font-mono text-xs">{customers.filter((c) => (scopeIds(p.id, partners) ?? []).includes(c.partner)).length} customers visible</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {dialog === "partner" && <PartnerDialog distributors={partners.filter((p) => p.type === "Distributor")} onClose={() => setDialog(null)}
        onSave={(p) => { setPartners((all) => [...all, p]); setDialog(null); setTab("partners"); toast(`Invite sent to ${p.contact}`, { description: `${p.name} onboarded as ${p.type}.` }); }} />}
      {dialog === "customer" && <CustomerDialog onClose={() => setDialog(null)}
        onSave={(name) => { setCustomers((all) => [...all, { id: `c${Date.now()}`, name, partner: viewer, screens: 0, online: 0, licences: 0, renewal: "—", support: "None" }]); setDialog(null); toast(`${name} added`, { description: "Request licences with a PO to activate screens." }); }} />}
      {dialog && typeof dialog === "object" && <LicenceDialog customer={cName(dialog.licence)} onClose={() => setDialog(null)}
        onSave={(qty, po) => { setReqs((all) => [{ id: Date.now(), customer: dialog.licence, partner: customers.find((c) => c.id === dialog.licence)!.partner, qty, po, status: "Pending", date: "Just now" }, ...all]); setDialog(null); setTab("requests"); toast("Licence request sent", { description: "The vendor will review your PO." }); }} />}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30" onClick={onClose}>
      <div className="w-[440px] rounded-lg border border-border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">{title}</h2><Button variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label="Close"><X className="size-4" /></Button></div>
        {children}
      </div>
    </div>
  );
}
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="mb-3 block"><span className="label-caps mb-1 block">{label}</span>{children}</label>;

function PartnerDialog({ distributors, onClose, onSave }: { distributors: Partner[]; onClose: () => void; onSave: (p: Partner) => void }) {
  const [type, setType] = useState<PartnerType>("Reseller");
  const [name, setName] = useState(""); const [contact, setContact] = useState(""); const [region, setRegion] = useState("");
  const [parent, setParent] = useState(distributors[0]?.id ?? "");
  const ok = name.trim() && /\S+@\S+\.\S+/.test(contact);
  return (
    <Modal title="Onboard partner" onClose={onClose}>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {(["Distributor", "Reseller"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} className={cn("rounded-md border p-3 text-left text-xs", type === t ? "border-primary bg-primary/10" : "border-border")}>
            <p className="font-semibold">{t}</p><p className="text-muted-foreground">{t === "Distributor" ? "Sees its resellers and all their customers" : "Sees only customers it sells to"}</p>
          </button>
        ))}
      </div>
      <Field label="Company name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Admin contact email"><Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="admin@partner.com" /></Field>
      <Field label="Region"><Input value={region} onChange={(e) => setRegion(e.target.value)} /></Field>
      {type === "Reseller" && <Field label="Distributor"><select value={parent} onChange={(e) => setParent(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
        <option value="">Direct to vendor</option>{distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>}
      <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={!ok} onClick={() => onSave({ id: `p${Date.now()}`, name: name.trim(), type, parent: type === "Reseller" && parent ? parent : undefined, region: region || "—", contact, status: "Invited" })}>Send invite</Button></div>
    </Modal>
  );
}

function CustomerDialog({ onClose, onSave }: { onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <Modal title="Add customer" onClose={onClose}>
      <Field label="Customer company"><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <p className="text-xs text-muted-foreground">The customer gets their own workspace. Screens activate once the vendor approves a licence request.</p>
      <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!name.trim()} onClick={() => onSave(name.trim())}>Create workspace</Button></div>
    </Modal>
  );
}

function LicenceDialog({ customer, onClose, onSave }: { customer: string; onClose: () => void; onSave: (qty: number, po: string) => void }) {
  const [qty, setQty] = useState(5); const [po, setPo] = useState("");
  return (
    <Modal title={`Request licences · ${customer}`} onClose={onClose}>
      <Field label="Number of licences"><Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} /></Field>
      <Field label="Purchase order (PDF)">
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-foreground hover:bg-secondary">
          <FileUp className="size-4" />{po || "Upload PO"}
          <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setPo(e.target.files?.[0]?.name ?? "")} />
        </label>
      </Field>
      <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!po} onClick={() => onSave(qty, po)}>Send for approval</Button></div>
    </Modal>
  );
}
