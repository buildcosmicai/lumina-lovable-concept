import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Activity, CalendarDays, Check, ChevronLeft, ChevronRight, Gauge, Images, KeyRound, Layers, ListVideo, Mail, Monitor,
  Plus, Search, Send, Settings, ShieldCheck, Trash2, UserPlus, Users, X, Clock3, Sparkles, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users & teams — Signage CMS" },
      { name: "description", content: "Onboard, edit, group and remove the people who manage your signage network." },
      { property: "og:title", content: "Users & teams — Signage CMS" },
      { property: "og:description", content: "Invite teammates, set roles and organise them into groups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
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

type Role = string;
type Status = "Active" | "Invited" | "Suspended";
type User = { id: number; name: string; email: string; role: Role; status: Status; groups: number[]; lastActive: string; tone: number; locations: string[] };
type Group = { id: number; name: string; tone: number };
type RoleDef = { role: Role; desc: string; perms: boolean[]; custom?: boolean };

let roleStore: RoleDef[] = [
  { role: "Owner", desc: "Everything, including billing", perms: [true, true, true, true, true] },
  { role: "Admin", desc: "Manage users, screens and content", perms: [true, true, true, true, false] },
  { role: "Publisher", desc: "Edit and push content live", perms: [true, true, true, false, false] },
  { role: "Editor", desc: "Create drafts, no publishing", perms: [true, true, false, false, false] },
  { role: "Viewer", desc: "Look, don't touch", perms: [true, false, false, false, false] },
];
const roleListeners = new Set<() => void>();
function setRoles(fn: (r: RoleDef[]) => RoleDef[]) { roleStore = fn(roleStore); roleListeners.forEach((l) => l()); }
function useRoles() {
  return useSyncExternalStore((l) => { roleListeners.add(l); return () => roleListeners.delete(l); }, () => roleStore, () => roleStore);
}
const PERMS = ["View", "Edit content", "Publish", "Manage users", "Billing"];
const TONES = ["bg-zone-1", "bg-zone-2", "bg-zone-3", "bg-zone-4", "bg-zone-5"];
const LOCATIONS = ["London HQ", "Manchester", "Bristol"];

const SEED_GROUPS: Group[] = [
  { id: 1, name: "Marketing", tone: 2 },
  { id: 2, name: "Facilities", tone: 3 },
  { id: 3, name: "Store managers", tone: 1 },
];
const SEED: User[] = [
  { id: 1, name: "Hanzo Mori", email: "hanzo@signage.co", role: "Owner", status: "Active", groups: [], lastActive: "Now", tone: 0, locations: LOCATIONS },
  { id: 2, name: "Priya Shah", email: "priya@signage.co", role: "Admin", status: "Active", groups: [1], lastActive: "12 min ago", tone: 1, locations: LOCATIONS },
  { id: 3, name: "Tom Becker", email: "tom@signage.co", role: "Publisher", status: "Active", groups: [1], lastActive: "2 h ago", tone: 2, locations: ["London HQ"] },
  { id: 4, name: "Aisha Okafor", email: "aisha@signage.co", role: "Editor", status: "Active", groups: [1, 3], lastActive: "Yesterday", tone: 3, locations: ["Manchester"] },
  { id: 5, name: "Lukas Weber", email: "lukas@signage.co", role: "Viewer", status: "Suspended", groups: [2], lastActive: "3 weeks ago", tone: 4, locations: ["Bristol"] },
  { id: 6, name: "Mei Lin", email: "mei@signage.co", role: "Editor", status: "Invited", groups: [3], lastActive: "Invite sent 2 d ago", tone: 1, locations: ["Bristol"] },
  { id: 7, name: "Diego Ramos", email: "diego@signage.co", role: "Publisher", status: "Active", groups: [3], lastActive: "5 h ago", tone: 2, locations: ["Manchester", "Bristol"] },
];

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const STATUS_STYLE: Record<Status, string> = {
  Active: "bg-zone-4/15 text-foreground",
  Invited: "bg-primary/15 text-foreground",
  Suspended: "bg-destructive/15 text-destructive",
};

function Avatar({ u, size = "size-8" }: { u: Pick<User, "name" | "tone">; size?: string }) {
  return <span className={cn("grid shrink-0 place-items-center rounded-full font-display text-[11px] font-semibold text-primary-foreground", size, TONES[u.tone])}>{initials(u.name) || "?"}</span>;
}

function UsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState(SEED);
  const ROLES = useRoles();
  const [roleEdit, setRoleEdit] = useState<string | null>(null);
  const [groups, setGroups] = useState(SEED_GROUPS);
  const [groupFilter, setGroupFilter] = useState<number | "all" | "none">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [inviting, setInviting] = useState(false);
  const [newGroup, setNewGroup] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number[] | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);

  const navAction = (label: string) => toast(label, { description: "This section is not connected yet." });
  const editing = users.find((u) => u.id === editId) ?? null;

  const visible = useMemo(() => users.filter((u) =>
    (groupFilter === "all" || (groupFilter === "none" ? u.groups.length === 0 : u.groups.includes(groupFilter))) &&
    (statusFilter === "All" || u.status === statusFilter) &&
    `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(query.toLowerCase())), [users, groupFilter, statusFilter, query]);

  const patch = (id: number, p: Partial<User>) => setUsers((all) => all.map((u) => (u.id === id ? { ...u, ...p } : u)));
  const togglePick = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const addToGroup = (ids: number[], gid: number) => {
    setUsers((all) => all.map((u) => (ids.includes(u.id) && !u.groups.includes(gid) ? { ...u, groups: [...u.groups, gid] } : u)));
    toast(`Added ${ids.length} ${ids.length === 1 ? "person" : "people"} to ${groups.find((g) => g.id === gid)?.name}`);
  };
  const doDelete = (ids: number[]) => {
    const owner = users.find((u) => ids.includes(u.id) && u.role === "Owner");
    if (owner) { toast.error("The workspace owner can't be removed"); setConfirmDelete(null); return; }
    setUsers((all) => all.filter((u) => !ids.includes(u.id)));
    setPicked([]); if (editId && ids.includes(editId)) setEditId(null);
    setConfirmDelete(null);
    toast(`Removed ${ids.length} ${ids.length === 1 ? "user" : "users"}`, { description: "Their content stays in the workspace." });
  };
  const createGroup = () => {
    const name = newGroup?.trim();
    if (!name) { setNewGroup(null); return; }
    const id = Math.max(0, ...groups.map((g) => g.id)) + 1;
    setGroups((g) => [...g, { id, name, tone: id % 5 }]);
    setNewGroup(null); toast(`Group “${name}” created`, { description: "Drag people onto it to add them." });
  };

  const counts = { active: users.filter((u) => u.status === "Active").length, invited: users.filter((u) => u.status === "Invited").length, seats: 15 };
  const stale = users.filter((u) => u.status === "Invited");

  return (
    <div className="flex h-screen min-w-[1080px] overflow-hidden bg-surface text-foreground">
      <Toaster />
      <aside className={cn("relative flex h-screen shrink-0 border-r border-border bg-card transition-[width] duration-200", sidebarOpen ? "w-64" : "w-16")}>
        <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
          <Link to="/control-center" aria-label="Control Centre home" className="mb-5 grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Layers className="size-4" /></Link>
          <nav aria-label="Primary navigation" className="flex flex-col items-center gap-0.5">
            {NAV_ITEMS.map((item) => item.to ? (
              <Button key={item.label} asChild variant="ghost" size="icon" className={cn("size-9 text-muted-foreground", item.to === "/users" && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}>
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
              <Button key={item.label} asChild variant="ghost" className={cn("h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground", item.to === "/users" && "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary")}>
                <Link to={item.to}><item.icon className="size-4 shrink-0" />{item.label}</Link>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" onClick={() => navAction(item.label)} className="h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground"><item.icon className="size-4 shrink-0" />{item.label}</Button>
            ))}
          </nav>
          <section className="mt-5 border-t border-border pt-5">
            <div className="flex items-center justify-between px-2"><p className="label-caps">Groups</p><Button variant="ghost" size="icon" className="size-6" aria-label="New group" onClick={() => setNewGroup("")}><Plus className="size-3.5" /></Button></div>
            <ul className="mt-2 space-y-0.5">
              {([["all", "Everyone", users.length], ["none", "No group", users.filter((u) => !u.groups.length).length]] as const).map(([id, label, n]) => (
                <li key={id}><button onClick={() => setGroupFilter(id)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs", groupFilter === id ? "bg-secondary font-semibold" : "text-muted-foreground hover:bg-secondary")}>
                  <Users className="size-3.5" />{label}<span className="ml-auto font-mono text-[10px]">{n}</span></button></li>
              ))}
              {groups.map((g) => (
                <li key={g.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragId) addToGroup(picked.includes(dragId) ? picked : [dragId], g.id); setDragId(null); }}
                  className="group/g">
                  <div className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-xs", groupFilter === g.id ? "bg-secondary font-semibold" : "text-muted-foreground hover:bg-secondary", dragId && "ring-1 ring-dashed ring-primary/60")}>
                    <button onClick={() => setGroupFilter(g.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <span className={cn("size-2.5 shrink-0 rounded-full", TONES[g.tone])} /><span className="truncate">{g.name}</span>
                      <span className="ml-auto font-mono text-[10px]">{users.filter((u) => u.groups.includes(g.id)).length}</span>
                    </button>
                    <button aria-label={`Delete group ${g.name}`} className="hidden text-muted-foreground hover:text-destructive group-hover/g:block" onClick={() => {
                      setGroups((all) => all.filter((x) => x.id !== g.id));
                      setUsers((all) => all.map((u) => ({ ...u, groups: u.groups.filter((x) => x !== g.id) })));
                      if (groupFilter === g.id) setGroupFilter("all");
                      toast(`Group “${g.name}” deleted`, { description: "Members were kept." });
                    }}><X className="size-3" /></button>
                  </div>
                </li>
              ))}
              {newGroup !== null && <li><Input autoFocus value={newGroup} placeholder="Group name" onChange={(e) => setNewGroup(e.target.value)} onBlur={createGroup}
                onKeyDown={(e) => { if (e.key === "Enter") createGroup(); if (e.key === "Escape") setNewGroup(null); }} className="h-8 text-xs" /></li>}
            </ul>
            <p className="mt-3 px-2 text-[11px] leading-relaxed text-muted-foreground">Tip: drag a person onto a group to add them.</p>
          </section>
        </div>}
        {!sidebarOpen && <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" className="absolute left-11 top-3 size-7 border border-border bg-card text-muted-foreground shadow-sm"><ChevronRight className="size-3.5" /></Button>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-6">
          <div><h1 className="text-base font-semibold leading-tight">Users & teams</h1><p className="text-xs text-muted-foreground">Who can manage your screens, and what they can do</p></div>
          <div className="relative ml-auto w-64"><Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people or roles" className="h-8 pl-8 text-xs" /></div>
          <Button size="sm" className="h-8" onClick={() => setInviting(true)}><UserPlus className="size-3.5" />Invite people</Button>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
            <section className="grid grid-cols-4 gap-3">
              <Stat label="Active" value={counts.active} sub="signed in this month" />
              <Stat label="Pending invites" value={counts.invited} sub="awaiting first sign-in" />
              <Stat label="Groups" value={groups.length} sub="for faster permissions" />
              <div className="panel p-4">
                <p className="label-caps">Seats used</p>
                <p className="mt-1 font-display text-2xl font-semibold">{users.length}<span className="text-sm text-muted-foreground"> / {counts.seats}</span></p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${(users.length / counts.seats) * 100}%` }} /></div>
              </div>
            </section>

            {stale.length > 0 && <section className="panel mt-4 flex items-center gap-3 border-primary/40 p-3">
              <Sparkles className="size-4 text-primary" />
              <p className="text-xs"><span className="font-semibold">{stale.map((s) => s.name).join(", ")}</span> {stale.length === 1 ? "hasn't" : "haven't"} accepted the invite yet. A friendly nudge usually works.</p>
              <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => toast("Reminder sent", { description: stale.map((s) => s.email).join(", ") })}><Send className="size-3" />Send reminder</Button>
            </section>}

            <section className="mt-4 flex items-center gap-1">
              {(["All", "Active", "Invited", "Suspended"] as const).map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "secondary" : "ghost"} className="h-7 text-xs" onClick={() => setStatusFilter(s)}>{s}</Button>
              ))}
              {picked.length > 0 && <div className="ml-auto flex items-center gap-2 rounded-md bg-foreground px-3 py-1 text-background">
                <span className="text-xs font-semibold">{picked.length} selected</span>
                <select aria-label="Add selected to group" defaultValue="" onChange={(e) => { if (e.target.value) addToGroup(picked, +e.target.value); e.target.value = ""; }} className="h-6 rounded bg-background/15 px-1 text-xs outline-none">
                  <option value="" className="text-foreground">Add to group…</option>
                  {groups.map((g) => <option key={g.id} value={g.id} className="text-foreground">{g.name}</option>)}
                </select>
                <select aria-label="Change role for selected" defaultValue="" onChange={(e) => { if (e.target.value) { setUsers((all) => all.map((u) => picked.includes(u.id) && u.role !== "Owner" ? { ...u, role: e.target.value as Role } : u)); toast(`Role changed to ${e.target.value}`); } e.target.value = ""; }} className="h-6 rounded bg-background/15 px-1 text-xs outline-none">
                  <option value="" className="text-foreground">Change role…</option>
                  {ROLES.slice(1).map((r) => <option key={r.role} className="text-foreground">{r.role}</option>)}
                </select>
                <button className="flex items-center gap-1 text-xs hover:underline" onClick={() => setConfirmDelete(picked)}><Trash2 className="size-3" />Remove</button>
                <button aria-label="Clear selection" onClick={() => setPicked([])}><X className="size-3.5" /></button>
              </div>}
            </section>

            <section className="panel mt-3 overflow-hidden">
              <div className="grid grid-cols-[28px_minmax(0,2fr)_110px_minmax(0,1.4fr)_100px_120px] items-center gap-3 border-b border-border bg-surface px-4 py-2 label-caps">
                <input type="checkbox" aria-label="Select all" checked={visible.length > 0 && visible.every((u) => picked.includes(u.id))} onChange={(e) => setPicked(e.target.checked ? visible.map((u) => u.id) : [])} />
                <span>Person</span><span>Role</span><span>Groups</span><span>Status</span><span>Last active</span>
              </div>
              {visible.map((u) => (
                <div key={u.id} draggable onDragStart={() => setDragId(u.id)} onDragEnd={() => setDragId(null)} onClick={() => setEditId(u.id)}
                  className={cn("grid cursor-pointer grid-cols-[28px_minmax(0,2fr)_110px_minmax(0,1.4fr)_100px_120px] items-center gap-3 border-b border-border px-4 py-2.5 text-sm last:border-0 hover:bg-surface", editId === u.id && "bg-primary/10")}>
                  <input type="checkbox" aria-label={`Select ${u.name}`} checked={picked.includes(u.id)} onClick={(e) => e.stopPropagation()} onChange={() => togglePick(u.id)} />
                  <div className="flex min-w-0 items-center gap-3"><Avatar u={u} /><div className="min-w-0"><p className="truncate font-medium">{u.name}</p><p className="truncate text-xs text-muted-foreground">{u.email}</p></div></div>
                  <span className="flex items-center gap-1 text-xs">{u.role === "Owner" && <ShieldCheck className="size-3 text-primary" />}{u.role}</span>
                  <div className="flex flex-wrap gap-1">{u.groups.length ? u.groups.map((gid) => { const g = groups.find((x) => x.id === gid); return g && <span key={gid} className="flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 text-[11px]"><span className={cn("size-1.5 rounded-full", TONES[g.tone])} />{g.name}</span>; }) : <span className="text-xs text-muted-foreground">—</span>}</div>
                  <span className={cn("w-fit rounded-sm px-1.5 py-0.5 text-[11px] font-medium", STATUS_STYLE[u.status])}>{u.status}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{u.lastActive}</span>
                </div>
              ))}
              {!visible.length && <p className="p-8 text-center text-sm text-muted-foreground">No one matches. Try another filter, or invite someone new.</p>}
            </section>

            <section className="panel mt-5 p-4">
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">What each role can do</h2><p className="text-xs text-muted-foreground">Build your own roles — click a tick to change a custom role</p></div>
                <Button size="sm" variant="outline" onClick={() => setRoleEdit("new")}><Plus className="size-3.5" />New role</Button></div>
              <div className="mt-3 grid grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))_4.5rem] gap-y-1 text-xs">
                <span />{PERMS.map((p) => <span key={p} className="label-caps text-center">{p}</span>)}<span />
                {ROLES.map((r) => [
                  <div key={r.role} className="py-1.5"><p className="font-medium">{r.role}{r.custom && <span className="ml-1.5 rounded bg-accent/15 px-1 text-[10px] text-accent">Custom</span>}<span className="ml-1.5 text-[10px] text-muted-foreground">{users.filter((u) => u.role === r.role).length} people</span></p><p className="text-[11px] text-muted-foreground">{r.desc}</p></div>,
                  ...r.perms.map((ok, i) => (
                    <button key={r.role + i} disabled={!r.custom || i === 0} aria-label={`${r.role} ${PERMS[i]}`} onClick={() => setRoles((all) => all.map((x) => x.role === r.role ? { ...x, perms: x.perms.map((v, j) => (j === i ? !v : v)) } : x))} className={cn("grid place-items-center rounded", r.custom && i > 0 && "hover:bg-surface")}>
                      {ok ? <Check className="size-3.5 text-accent" /> : <span className="size-1 rounded-full bg-border" />}
                    </button>
                  )),
                  <div key={r.role + "a"} className="flex items-center justify-end gap-0.5">{r.custom && <>
                    <Button variant="ghost" size="icon" className="size-6" aria-label={`Edit ${r.role}`} onClick={() => setRoleEdit(r.role)}><Settings className="size-3" /></Button>
                    <Button variant="ghost" size="icon" className="size-6" aria-label={`Delete ${r.role}`} onClick={() => {
                      const n = users.filter((u) => u.role === r.role).length;
                      setRoles((all) => all.filter((x) => x.role !== r.role));
                      if (n) setUsers((all) => all.map((u) => (u.role === r.role ? { ...u, role: "Viewer" } : u)));
                      toast(`Deleted ${r.role}${n ? ` — ${n} moved to Viewer` : ""}`);
                    }}><Trash2 className="size-3" /></Button></>}</div>,
                ])}
              </div>
            </section>
            {roleEdit && <RoleDialog initial={roleEdit === "new" ? undefined : ROLES.find((r) => r.role === roleEdit)} onClose={() => setRoleEdit(null)} onSave={(nr) => {
              if (roleEdit === "new") { setRoles((all) => [...all, nr]); toast(`Role “${nr.role}” created`); }
              else { setRoles((all) => all.map((x) => (x.role === roleEdit ? nr : x))); setUsers((all) => all.map((u) => (u.role === roleEdit ? { ...u, role: nr.role } : u))); toast("Role updated"); }
              setRoleEdit(null);
            }} />}
          </main>

          {editing && <EditPanel key={editing.id} user={editing} groups={groups} onClose={() => setEditId(null)} onSave={(p) => { patch(editing.id, p); toast("Changes saved"); }} onDelete={() => setConfirmDelete([editing.id])} />}
        </div>
      </div>

      {inviting && <InviteDialog groups={groups} onClose={() => setInviting(false)} onInvite={(list) => {
        const start = Math.max(...users.map((u) => u.id)) + 1;
        setUsers((all) => [...all, ...list.map((l, i) => ({ ...l, id: start + i, status: "Invited" as const, lastActive: "Invite sent just now", tone: (start + i) % 5 }))]);
        setInviting(false);
        toast(`${list.length} ${list.length === 1 ? "invite" : "invites"} sent`, { description: "They'll get an email with a sign-in link." });
      }} />}

      {confirmDelete && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30" onClick={() => setConfirmDelete(null)}>
        <div className="panel w-96 p-5" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-base font-semibold">Remove {confirmDelete.length === 1 ? users.find((u) => u.id === confirmDelete[0])?.name : `${confirmDelete.length} people`}?</h2>
          <p className="mt-1 text-sm text-muted-foreground">They'll lose access straight away. Layouts and media they made stay in the workspace.</p>
          <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="destructive" size="sm" onClick={() => doDelete(confirmDelete)}>Remove</Button></div>
        </div>
      </div>}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return <div className="panel p-4"><p className="label-caps">{label}</p><p className="mt-1 font-display text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{sub}</p></div>;
}

function EditPanel({ user, groups, onClose, onSave, onDelete }: { user: User; groups: Group[]; onClose: () => void; onSave: (p: Partial<User>) => void; onDelete: () => void }) {
  const ROLES = useRoles();
  const [d, setD] = useState(user);
  const dirty = JSON.stringify(d) !== JSON.stringify(user);
  const isOwner = user.role === "Owner";
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Avatar u={d} size="size-10" />
        <div className="min-w-0 flex-1"><p className="truncate font-display font-semibold">{d.name || "Unnamed"}</p><p className="truncate text-xs text-muted-foreground">{d.email}</p></div>
        <Button variant="ghost" size="icon" className="size-7" aria-label="Close" onClick={onClose}><X className="size-3.5" /></Button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <label className="block"><span className="label-caps">Full name</span><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className="mt-1 h-8 text-sm" /></label>
        <label className="block"><span className="label-caps">Email</span><Input value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} className="mt-1 h-8 text-sm" /></label>
        <div>
          <span className="label-caps">Role</span>
          <div className="mt-1 grid gap-1">
            {ROLES.filter((r) => isOwner || r.role !== "Owner").map((r) => (
              <button key={r.role} disabled={isOwner} onClick={() => setD({ ...d, role: r.role })} className={cn("rounded-md border px-3 py-2 text-left text-xs disabled:opacity-60", d.role === r.role ? "border-primary bg-primary/10" : "border-border hover:bg-surface")}>
                <span className="font-semibold">{r.role}</span><span className="ml-2 text-muted-foreground">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label-caps">Groups</span>
          <div className="mt-1 flex flex-wrap gap-1">{groups.map((g) => (
            <button key={g.id} onClick={() => setD({ ...d, groups: toggle(d.groups, g.id) })} className={cn("flex items-center gap-1 rounded-full border px-2 py-1 text-xs", d.groups.includes(g.id) ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground")}>
              <span className={cn("size-1.5 rounded-full", TONES[g.tone])} />{g.name}</button>
          ))}</div>
        </div>
        <div>
          <span className="label-caps">Can manage screens in</span>
          <div className="mt-1 space-y-1">{LOCATIONS.map((l) => (
            <label key={l} className="flex items-center justify-between rounded-md px-1 py-1 text-xs">{l}<Switch checked={d.locations.includes(l)} onCheckedChange={() => setD({ ...d, locations: toggle(d.locations, l) })} /></label>
          ))}</div>
        </div>
        {!isOwner && <div className="flex items-center justify-between rounded-md border border-border p-3 text-xs">
          <div><p className="font-medium">Suspend access</p><p className="text-muted-foreground">Keep the account, block sign-in</p></div>
          <Switch checked={d.status === "Suspended"} onCheckedChange={(v) => setD({ ...d, status: v ? "Suspended" : "Active" })} />
        </div>}
        {user.status === "Invited" && <Button variant="outline" size="sm" className="w-full" onClick={() => toast("Invite re-sent", { description: user.email })}><Mail className="size-3.5" />Resend invite</Button>}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Clock3 className="size-3" />Last active: {user.lastActive}</div>
      </div>
      <div className="flex gap-2 border-t border-border p-4">
        {!isOwner && <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="size-3.5" />Remove</Button>}
        <Button size="sm" className="ml-auto" disabled={!dirty} onClick={() => onSave(d)}>Save changes</Button>
      </div>
    </aside>
  );
}

type Draft = Omit<User, "id" | "status" | "lastActive" | "tone">;
function RoleDialog({ initial, onClose, onSave }: { initial?: RoleDef | undefined; onClose: () => void; onSave: (r: RoleDef) => void }) {
  const ROLES = useRoles();
  const [name, setName] = useState(initial?.role ?? "");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [perms, setPerms] = useState<boolean[]>(initial?.perms ?? [true, false, false, false, false]);
  const taken = ROLES.some((r) => r.role.toLowerCase() === name.trim().toLowerCase() && r.role !== initial?.role);
  const ok = name.trim().length > 1 && !taken;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" onClick={onClose}>
      <div role="dialog" aria-label="Role builder" className="panel w-full max-w-md bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">{initial ? "Edit role" : "New role"}</h2><Button variant="ghost" size="icon" className="size-7" aria-label="Close" onClick={onClose}><X className="size-3.5" /></Button></div>
        {!initial && <div className="mt-3"><span className="label-caps">Start from</span><div className="mt-1 flex flex-wrap gap-1">{ROLES.filter((r) => r.role !== "Owner").map((r) => (
          <button key={r.role} onClick={() => { setPerms([...r.perms]); if (!desc) setDesc(r.desc); }} className="rounded-full border border-border px-2.5 py-0.5 text-xs hover:bg-surface">{r.role}</button>
        ))}</div></div>}
        <label className="mt-3 block"><span className="label-caps">Role name</span><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Store manager" className="mt-1 h-8 text-sm" /></label>
        {taken && <p className="mt-1 text-xs text-destructive">A role with this name already exists.</p>}
        <label className="mt-3 block"><span className="label-caps">Description</span><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What this role is for" className="mt-1 h-8 text-sm" /></label>
        <div className="mt-3"><span className="label-caps">Permissions</span>
          <div className="mt-1 divide-y divide-border rounded-md border border-border">{PERMS.map((p, i) => (
            <label key={p} className="flex items-center justify-between px-3 py-2 text-sm"><span>{p}{i === 0 && <span className="ml-2 text-xs text-muted-foreground">always on</span>}</span>
              <Switch aria-label={p} checked={!!perms[i]} disabled={i === 0} onCheckedChange={(v) => setPerms(perms.map((x, j) => (j === i ? v : x)))} /></label>
          ))}</div>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" disabled={!ok} onClick={() => onSave({ role: name.trim(), desc: desc.trim() || "Custom role", perms, custom: true })}>{initial ? "Save role" : "Create role"}</Button></div>
      </div>
    </div>
  );
}

function InviteDialog({ groups, onClose, onInvite }: { groups: Group[]; onClose: () => void; onInvite: (l: Draft[]) => void }) {
  const ROLES = useRoles();
  const [step, setStep] = useState(0);
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<Role>("Editor");
  const [gids, setGids] = useState<number[]>([]);
  const [locs, setLocs] = useState<string[]>(LOCATIONS);
  const parsed = emails.split(/[\s,;]+/).filter(Boolean);
  const valid = parsed.filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  const invalid = parsed.filter((e) => !valid.includes(e));
  const nameFrom = (e: string) => e.split("@")[0]!.split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  const steps = ["Who", "Role", "Access", "Review"];
  const canNext = step === 0 ? valid.length > 0 && !invalid.length : true;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30" onClick={onClose}>
      <div className="panel w-[560px] p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><h2 className="text-base font-semibold">Invite people</h2><p className="text-xs text-muted-foreground">Four quick steps — about 30 seconds</p></div>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Close" onClick={onClose}><X className="size-3.5" /></Button>
        </div>
        <ol className="flex gap-1 px-5 pt-4">{steps.map((s, i) => (
          <li key={s} className="flex-1"><div className={cn("h-1 rounded-full", i <= step ? "bg-primary" : "bg-secondary")} /><p className={cn("mt-1 text-[11px]", i === step ? "font-semibold" : "text-muted-foreground")}>{i + 1}. {s}</p></li>
        ))}</ol>
        <div className="min-h-[220px] px-5 py-4">
          {step === 0 && <div>
            <label className="label-caps" htmlFor="invite-emails">Email addresses</label>
            <textarea id="invite-emails" autoFocus value={emails} onChange={(e) => setEmails(e.target.value)} rows={4} placeholder="sam@company.com, alex@company.com — paste as many as you like"
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <div className="mt-2 flex flex-wrap gap-1">
              {valid.map((e) => <span key={e} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{e}</span>)}
              {invalid.map((e) => <span key={e} className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">{e} — check this</span>)}
            </div>
          </div>}
          {step === 1 && <div className="grid gap-1">{ROLES.slice(1).map((r) => (
            <button key={r.role} onClick={() => setRole(r.role)} className={cn("flex items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm", role === r.role ? "border-primary bg-primary/10" : "border-border hover:bg-surface")}>
              <span><span className="font-semibold">{r.role}</span><span className="ml-2 text-xs text-muted-foreground">{r.desc}</span></span>{role === r.role && <Check className="size-4 text-primary" />}
            </button>
          ))}</div>}
          {step === 2 && <div className="space-y-4">
            <div><p className="label-caps">Add to groups (optional)</p><div className="mt-1 flex flex-wrap gap-1">{groups.map((g) => (
              <button key={g.id} onClick={() => setGids((x) => x.includes(g.id) ? x.filter((y) => y !== g.id) : [...x, g.id])} className={cn("flex items-center gap-1 rounded-full border px-2 py-1 text-xs", gids.includes(g.id) ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground")}>
                <span className={cn("size-1.5 rounded-full", TONES[g.tone])} />{g.name}</button>
            ))}{!groups.length && <span className="text-xs text-muted-foreground">No groups yet</span>}</div></div>
            <div><p className="label-caps">Screens they can manage</p><div className="mt-1 space-y-1">{LOCATIONS.map((l) => (
              <label key={l} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">{l}<Switch checked={locs.includes(l)} onCheckedChange={() => setLocs((x) => x.includes(l) ? x.filter((y) => y !== l) : [...x, l])} /></label>
            ))}</div></div>
          </div>}
          {step === 3 && <div className="space-y-3 text-sm">
            <p>You're inviting <span className="font-semibold">{valid.length} {valid.length === 1 ? "person" : "people"}</span> as <span className="font-semibold">{role}</span>.</p>
            <ul className="space-y-1">{valid.map((e) => <li key={e} className="flex items-center gap-2"><Avatar u={{ name: nameFrom(e), tone: 1 }} size="size-6" /><span>{nameFrom(e)}</span><span className="text-xs text-muted-foreground">{e}</span></li>)}</ul>
            <p className="text-xs text-muted-foreground">Groups: {gids.map((g) => groups.find((x) => x.id === g)?.name).join(", ") || "none"} · Locations: {locs.join(", ") || "none"}</p>
          </div>}
        </div>
        <div className="flex justify-between border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => (step ? setStep(step - 1) : onClose())}>{step ? "Back" : "Cancel"}</Button>
          {step < 3 ? <Button size="sm" disabled={!canNext} onClick={() => setStep(step + 1)}>Next</Button>
            : <Button size="sm" onClick={() => onInvite(valid.map((e) => ({ name: nameFrom(e), email: e, role, groups: gids, locations: locs })))}><Send className="size-3.5" />Send invites</Button>}
        </div>
      </div>
    </div>
  );
}

