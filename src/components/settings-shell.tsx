import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, CalendarDays, Gauge, Handshake, Images, Layers, ListVideo, Monitor, Plug, Settings, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type Crumb = { label: string; to?: string };
const defaultCrumbs: Crumb[] = [
  { label: "Settings", to: "/settings" }, { label: "Integrations", to: "/settings/integrations" }, { label: "Room Connectors" },
];

const items = [
  { label: "Control Center", to: "/control-center", icon: Gauge }, { label: "Pulse", to: "/pulse", icon: Activity },
  { label: "Screens", to: "/screens", icon: Monitor }, { label: "Schedules", to: "/schedules", icon: CalendarDays },
  { label: "Media", to: "/media", icon: Images }, { label: "Playlists", to: "/playlists", icon: ListVideo },
  { label: "Layouts", to: "/layouts", icon: Layers }, { label: "Users", to: "/users", icon: Users }, { label: "Partners", to: "/partners", icon: Handshake },
] as const;
export function SettingsShell({ children, crumbs = defaultCrumbs }: { children: ReactNode; crumbs?: Crumb[] }) {
  return <div className="flex min-h-screen bg-surface text-foreground">
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card md:flex">
      <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
        <Button asChild size="icon" className="mb-5 size-9"><Link to="/layouts" aria-label="Layouts home"><Layers className="size-4" /></Link></Button>
        <nav aria-label="Primary navigation" className="flex flex-col gap-0.5">{items.map(item => <Button asChild key={item.label} variant="ghost" size="icon" className="size-9 text-muted-foreground"><Link to={item.to} title={item.label} aria-label={item.label}><item.icon className="size-4" /></Link></Button>)}</nav>
        <Button asChild variant="ghost" size="icon" className="mt-auto size-9 text-muted-foreground"><Link to="/profile" title="Profile" aria-label="Profile"><UserRound className="size-4" /></Link></Button>
        <Button asChild variant="ghost" size="icon" className="mt-1 size-9 bg-primary/15 text-primary"><Link to="/settings" title="Settings" aria-label="Settings"><Settings className="size-4" /></Link></Button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4"><p className="mb-6 flex h-9 items-center font-display text-sm font-semibold">Signage CMS</p><p className="label-caps mb-3">SETTINGS</p><Button asChild variant="ghost" className="mb-1 justify-start text-sm"><Link to="/profile"><UserRound className="size-4" />Profile</Link></Button><Button asChild variant="secondary" className="justify-start text-sm"><Link to="/settings/integrations"><Plug className="size-4" />Integrations</Link></Button><Button asChild variant="ghost" className="mt-1 justify-start pl-5 text-xs text-accent"><Link to="/settings/integrations/room-connectors"><CalendarDays className="size-3.5" />Room Connectors</Link></Button><Button asChild variant="ghost" className="mt-1 justify-start text-sm"><Link to="/settings/plan"><CreditCard className="size-4" />Plan &amp; licences</Link></Button></div>
    </aside>
    <div className="min-w-0 flex-1"><header className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-6 py-4 text-xs text-muted-foreground">{crumbs.map((crumb, index) => <span key={crumb.label} className="flex items-center gap-2">{index > 0 && <span>/</span>}{crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span className="text-foreground">{crumb.label}</span>}</span>)}<Button asChild size="sm" variant="ghost" className="ml-auto md:hidden"><Link to="/layouts"><Layers className="size-4" />Layouts</Link></Button></header>{children}</div>
  </div>;
}