import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, BookOpen, CalendarDays, Gauge, Handshake, Images, Layers, ListVideo, MessageSquare, Monitor, Settings, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HELP_TOPICS, HELP_ARTICLES } from "@/lib/help-articles";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Control Center", to: "/control-center", icon: Gauge }, { label: "Pulse", to: "/pulse", icon: Activity },
  { label: "Screens", to: "/screens", icon: Monitor }, { label: "Schedules", to: "/schedules", icon: CalendarDays },
  { label: "Media", to: "/media", icon: Images }, { label: "Playlists", to: "/playlists", icon: ListVideo },
  { label: "Layouts", to: "/layouts", icon: Layers }, { label: "Users", to: "/users", icon: Users },
  { label: "Partners", to: "/partners", icon: Handshake }, { label: "AI Assistant", to: "/assistant", icon: MessageSquare },
  { label: "Help", to: "/help", icon: BookOpen },
] as const;

export function HelpShell({ children, topic = "all", articleTitle }: { children: ReactNode; topic?: string; articleTitle?: string }) {
  return <div className="flex min-h-screen bg-background text-foreground">
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
      <Button asChild size="icon" className="mb-5 size-9"><Link to="/layouts" aria-label="Layouts home"><Layers className="size-4" /></Link></Button>
      <nav aria-label="Primary navigation" className="flex flex-col gap-0.5">{nav.map(item => <Button key={item.label} asChild size="icon" variant="ghost" className={cn("size-9 text-muted-foreground", item.to === "/help" && "bg-primary/15 text-foreground")}><Link to={item.to} aria-label={item.label} title={item.label}><item.icon className="size-4" /></Link></Button>)}</nav>
      <Button asChild size="icon" variant="ghost" className="mt-auto"><Link to="/profile" title="Profile" aria-label="Profile"><UserRound className="size-4" /></Link></Button><Button asChild size="icon" variant="ghost"><Link to="/settings" title="Settings" aria-label="Settings"><Settings className="size-4" /></Link></Button>
    </aside>
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
      <p className="mb-8 flex h-8 items-center gap-2 font-display text-sm font-semibold"><span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"><BookOpen className="size-3.5" /></span>Lumina Help</p>
      <p className="label-caps mb-3 px-2">KNOWLEDGE BASE</p>
      <Button asChild variant="ghost" className={cn("justify-start text-xs", topic === "all" && "bg-primary/10")}><Link to="/help" search={{ topic: "all", q: "" }}><BookOpen className="size-4" />All articles<span className="ml-auto font-mono text-[10px] text-muted-foreground">{HELP_ARTICLES.length}</span></Link></Button>
      <div className="mt-1 space-y-1">{HELP_TOPICS.map(item => <Button key={item.id} asChild variant="ghost" className={cn("w-full justify-start gap-2 px-2 text-xs font-normal text-muted-foreground", topic === item.id && "bg-secondary text-foreground")}><Link to="/help" search={{ topic: item.id, q: "" }}><item.icon className="size-3.5" />{item.name}</Link></Button>)}</div>
      <div className="mt-auto border-t border-border pt-5"><p className="text-xs font-semibold">A question beyond the guide?</p><Button asChild variant="ghost" className="mt-2 w-full justify-start px-0 text-xs text-accent"><Link to="/assistant"><MessageSquare className="size-4" />Ask Relay</Link></Button></div>
    </aside>
    <div className="min-w-0 flex-1"><header className="flex min-h-16 flex-wrap items-center gap-2 border-b border-border bg-card px-5 text-xs md:px-8"><Link to="/help" search={{ topic: "all", q: "" }} className="text-muted-foreground">Help centre</Link><span className="text-muted-foreground">/</span><span className="min-w-0 flex-1 truncate">{articleTitle ?? "Knowledge base"}</span><Button asChild variant="outline" size="sm"><Link to="/assistant"><MessageSquare className="size-3.5" />Ask Relay</Link></Button></header>{children}</div>
  </div>;
}