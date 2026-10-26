import { useMemo, useState } from "react";
import { Building2, Layers, Monitor, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SCREENS, type ScreenStatus } from "@/lib/screens-data";
import { SCREEN_GROUPS, SITES, resolveTargets } from "@/lib/publish-targets";
import { cn } from "@/lib/utils";

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const DOT: Record<ScreenStatus, string> = { online: "bg-accent", attention: "bg-warning", offline: "bg-destructive" };

export function PublishTargetsDialog({ open, onOpenChange, itemName, onPublish }: {
  open: boolean; onOpenChange: (o: boolean) => void; itemName: string; onPublish: (screenCount: number, offline: number) => void;
}) {
  const [screenIds, setScreenIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const [siteGroupId, setSiteGroupId] = useState<string>("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ScreenStatus>("all");
  const [site, setSite] = useState("all");

  const filtered = useMemo(() => SCREENS.filter((s) =>
    (status === "all" || s.status === status) && (site === "all" || s.location === site) &&
    `${s.name} ${s.location} ${s.area}`.toLowerCase().includes(q.toLowerCase())), [q, status, site]);
  const targets = resolveTargets({ screenIds, groupIds, sites, siteGroupId: siteGroupId || null });
  const offline = targets.filter((s) => s.status === "offline").length;
  const reset = () => { setScreenIds([]); setGroupIds([]); setSites([]); setSiteGroupId(""); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Where to publish</DialogTitle>
          <DialogDescription>Choose screens, groups and sites for “{itemName}”. Mix any combination — duplicates are counted once.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="screens">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="screens"><Monitor className="size-3.5" />Screens{screenIds.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1.5">{screenIds.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="groups"><Layers className="size-3.5" />Groups{groupIds.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1.5">{groupIds.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="sites"><Building2 className="size-3.5" />Sites{sites.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1.5">{sites.length}</Badge>}</TabsTrigger>
          </TabsList>

          <TabsContent value="screens" className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search screens" placeholder="Search screens" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} /></div>
              <select aria-label="Filter by site" className="meeting-select w-36" value={site} onChange={(e) => setSite(e.target.value)}><option value="all">All sites</option>{SITES.map((s) => <option key={s}>{s}</option>)}</select>
              <select aria-label="Filter by status" className="meeting-select w-32" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="all">Any status</option><option value="online">Online</option><option value="attention">Attention</option><option value="offline">Offline</option></select>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{filtered.length} shown</span>
              <button className="text-accent hover:underline" onClick={() => { const all = filtered.every((s) => screenIds.includes(s.id)); setScreenIds(all ? screenIds.filter((id) => !filtered.some((s) => s.id === id)) : Array.from(new Set([...screenIds, ...filtered.map((s) => s.id)]))); }}>Select / clear shown</button>
            </div>
            <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border">
              {filtered.map((s) => (
                <li key={s.id}><label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50">
                  <Checkbox checked={screenIds.includes(s.id)} onCheckedChange={() => setScreenIds(toggle(screenIds, s.id))} aria-label={s.name} />
                  <span className={cn("size-2 rounded-full", DOT[s.status])} />
                  <span className="flex-1 text-sm">{s.name}<span className="block text-xs text-muted-foreground">{s.location} · {s.area} · {s.orientation}</span></span>
                  <span className="text-xs capitalize text-muted-foreground">{s.status}</span>
                </label></li>
              ))}
              {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No screens match.</li>}
            </ul>
          </TabsContent>

          <TabsContent value="groups">
            <ul className="grid grid-cols-2 gap-2">
              {SCREEN_GROUPS.map((g) => (
                <li key={g.id}><label className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5", groupIds.includes(g.id) ? "border-accent bg-accent/5" : "border-border")}>
                  <Checkbox checked={groupIds.includes(g.id)} onCheckedChange={() => setGroupIds(toggle(groupIds, g.id))} aria-label={g.name} />
                  <span className="text-sm">{g.name}<span className="block text-xs text-muted-foreground">{g.screenIds.length} screen{g.screenIds.length > 1 ? "s" : ""}</span></span>
                </label></li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="sites" className="space-y-3">
            <ul className="grid grid-cols-3 gap-2">
              {SITES.map((s) => (
                <li key={s}><label className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5", sites.includes(s) ? "border-accent bg-accent/5" : "border-border")}>
                  <Checkbox checked={sites.includes(s)} onCheckedChange={() => setSites(toggle(sites, s))} aria-label={s} />
                  <span className="text-sm">{s}<span className="block text-xs text-muted-foreground">{SCREENS.filter((x) => x.location === s).length} screens</span></span>
                </label></li>
              ))}
            </ul>
            <label className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Only screens in group</span>
              <select aria-label="Narrow sites by group" className="meeting-select w-56" value={siteGroupId} onChange={(e) => setSiteGroupId(e.target.value)}><option value="">Any group</option>{SCREEN_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
            </label>
          </TabsContent>
        </Tabs>

        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <strong>{targets.length}</strong> screen{targets.length === 1 ? "" : "s"} will receive this
          {offline > 0 && <span className="text-muted-foreground"> · {offline} offline, will update when back online</span>}
          {targets.length > 0 && <p className="mt-1 truncate text-xs text-muted-foreground">{targets.map((t) => t.name).join(", ")}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={reset}>Clear all</Button>
          <Button disabled={targets.length === 0} onClick={() => { onPublish(targets.length, offline); onOpenChange(false); }}><Send className="size-4" />Publish to {targets.length} screen{targets.length === 1 ? "" : "s"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
