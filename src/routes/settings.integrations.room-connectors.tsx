import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, CircleAlert, KeyRound, LoaderCircle, LockKeyhole, Plus, RefreshCw, Search, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RoomConnectorGuide } from "@/components/room-connector-guide";
import { listRoomConnections, roomConnectionAction, saveRoomConnection } from "@/lib/room-connectors.functions";
import { type ConnectorRoom, type RoomConnection } from "@/lib/room-connectors";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings/integrations/room-connectors")({
  head: () => ({ meta: [
    { title: "Room Connectors — Signage CMS" }, { name: "description", content: "Set up Google Workspace and Microsoft 365 room calendar connections, verify access and choose managed rooms." },
    { property: "og:title", content: "Room Connectors — Signage CMS" }, { property: "og:description", content: "Secure room calendar setup, verification and discovery for Google Workspace and Microsoft 365." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: RoomConnectorsPage,
});

function RoomConnectorsPage() {
  const list = useServerFn(listRoomConnections);
  const save = useServerFn(saveRoomConnection);
  const action = useServerFn(roomConnectionAction);
  const [provider, setProvider] = useState<"google" | "microsoft">("google");
  const [connections, setConnections] = useState<RoomConnection[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState(false);
  const [editing, setEditing] = useState<string | undefined>();
  const [activeId, setActiveId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [reader, setReader] = useState("");
  const [directory, setDirectory] = useState("");
  const [keyJson, setKeyJson] = useState("");
  const [fileName, setFileName] = useState("");
  const [tenant, setTenant] = useState("");
  const [client, setClient] = useState("");
  const [secret, setSecret] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [roomDialog, setRoomDialog] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ConnectorRoom[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const refresh = useCallback(async () => {
    try { setConnections(await list()); } catch { setProblem(true); setMessage("Could not load your connections. Sign in again or retry."); }
    finally { setLoading(false); }
  }, [list]);
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (!active) return; setSignedIn(Boolean(data.session)); if (data.session) void refresh(); else setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      setSignedIn(Boolean(session));
      if (session) void refresh(); else { setConnections([]); setKeyJson(""); setSecret(""); }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [refresh]);
  const reset = (nextProvider = provider) => {
    setProvider(nextProvider); setEditing(undefined); setActiveId(undefined); setName(""); setReader(""); setDirectory(""); setKeyJson(""); setFileName(""); setTenant(""); setClient(""); setSecret(""); setMessage("");
    if (fileInput.current) fileInput.current.value = "";
  };
  const notify = (text: string, failed = false) => { setMessage(text); setProblem(failed); };
  const runAction = async (id: string, operation: "verify" | "discover") => {
    setBusy(true); notify("");
    try {
      const result = await action({ data: { id, action: operation } });
      notify(result.message, !result.ok);
      if (result.ok && operation === "discover") {
        setRooms(result.rooms); setSelected(connections.find(c => c.id === id)?.rooms.map(r => r.id) ?? []); setSearch(""); setRoomDialog(id);
      }
      await refresh();
    } catch { notify("Could not complete this request. Check that you are signed in and try again.", true); }
    finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true); notify("");
    try {
      const credential = provider === "google" ? { provider, keyJson, directoryEmail: directory || reader } : { provider, tenantId: tenant, clientId: client, clientSecret: secret };
      const result = await save({ data: { ...(editing ? { id: editing } : {}), name, readerEmail: reader, credential } });
      setActiveId(result.id); setEditing(result.id); setKeyJson(""); setSecret(""); setFileName("Credential securely stored");
      const verified = await action({ data: { id: result.id, action: "verify" } });
      notify(verified.message, !verified.ok); await refresh();
    } catch { notify("Could not save or verify. Check the required fields and upload a valid service-account key, or valid Microsoft app IDs and secret.", true); }
    finally { setBusy(false); }
  };
  const readFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json") || file.size > 50000) { notify("Choose a service-account JSON file smaller than 50 KB.", true); return; }
    try { const text = await file.text(); const parsed = JSON.parse(text); if (parsed.type !== "service_account" || !parsed.private_key || !parsed.client_email || !parsed.client_id) throw new Error(); setKeyJson(text); setFileName(file.name); notify(""); }
    catch { setKeyJson(""); setFileName(""); notify("This is not a valid service-account key JSON. Download a JSON key from the service account's Keys tab.", true); }
  };
  const replace = (connection: RoomConnection) => { reset(connection.provider); setEditing(connection.id); setName(connection.name); setReader(connection.reader_email); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const visibleRooms = rooms.filter(room => `${room.name} ${room.email} ${room.location}`.toLowerCase().includes(search.toLowerCase()));
  const connectedCount = connections.filter(connection => connection.status === "connected").length;
  const hasCredential = provider === "google" ? Boolean(keyJson) : Boolean(tenant && client && secret);

  return <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="label-caps mb-2 text-accent">WORKPLACE CONNECTIONS</p><h1 className="font-display text-3xl font-semibold">Room Connectors</h1><p className="mt-2 text-sm text-muted-foreground">Your rooms. Both workspaces. One place to manage access.</p></div><Button variant="outline" onClick={() => reset()}><Plus className="size-4" />New connection</Button></div>
    <div className="my-7 grid grid-cols-3 border-y border-border py-4"><div><p className="font-display text-2xl font-semibold">{connectedCount.toString().padStart(2, "0")}</p><p className="mt-1 text-xs text-muted-foreground">Connected</p></div><div><p className="font-display text-2xl font-semibold">{connections.reduce((sum, c) => sum + c.rooms.length, 0).toString().padStart(2, "0")}</p><p className="mt-1 text-xs text-muted-foreground">Managed rooms</p></div><div><ShieldCheck className="mb-2 size-5 text-accent" /><p className="text-xs text-muted-foreground">Read-only permissions</p></div></div>
    <div className="mb-7 flex flex-wrap gap-2" role="group" aria-label="Calendar provider">{(["google", "microsoft"] as const).map(p => <Button key={p} variant={p === provider ? "secondary" : "outline"} aria-pressed={p === provider} onClick={() => reset(p)}><CalendarDays className="size-4" />{p === "google" ? "Google Workspace" : "Microsoft 365"}{p === provider && <Check className="size-3.5 text-accent" />}</Button>)}<span className="self-center px-2 text-xs text-muted-foreground">Both can be connected independently.</span></div>
    <div className="grid min-w-0 gap-9 xl:grid-cols-[1.05fr_1fr]">
      <RoomConnectorGuide provider={provider} />
      <section className="min-w-0 border-t border-border pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0" aria-label="Connection setup">
        <div className="mb-6 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">{editing ? "Replace credentials" : "Connect your calendar"}</h2><LockKeyhole className="size-4 text-accent" /></div>
        {!signedIn && <section className="mb-6 border-y border-border py-4"><h3 className="text-sm font-semibold">Sign in to save private connections</h3><form className="mt-3 space-y-2" onSubmit={async e => { e.preventDefault(); setBusy(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) notify("Sign-in failed. Check your email and password.", true); setBusy(false); }}><Input type="email" aria-label="Account email" placeholder="Account email" required value={email} onChange={e => setEmail(e.target.value)} /><Input type="password" aria-label="Account password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} /><div className="flex flex-wrap gap-2"><Button disabled={busy} type="submit">Sign in</Button>{(["google", "lovable"] as const).map(p => <Button key={p} disabled={busy} type="button" variant="outline" onClick={async () => { const result = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin }); if (result.error) notify("Sign-in could not be completed.", true); }}>Continue with {p === "google" ? "Google" : "Lovable"}</Button>)}</div></form></section>}
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); void verify(); }}>
          <label className="block space-y-1.5"><span className="text-xs font-medium">Connection name</span><Input aria-label="Connection name" placeholder="e.g. Berlin headquarters" maxLength={100} required value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="block space-y-1.5"><span className="text-xs font-medium">{provider === "google" ? "Calendar reader email" : "Verification room email"}</span><Input aria-label="Reader email" type="email" placeholder={provider === "google" ? "calendar-reader@company.com" : "meeting-room@company.com"} required value={reader} onChange={e => setReader(e.target.value)} /></label>
          {provider === "google" ? <><label className="block space-y-1.5"><span className="text-xs font-medium">Directory reader email <span className="font-normal text-muted-foreground">· optional if same as above</span></span><Input type="email" aria-label="Directory reader email" placeholder="Workspace resource administrator" value={directory} onChange={e => setDirectory(e.target.value)} /></label>
            <input ref={fileInput} type="file" accept=".json,application/json" aria-label="Service account key JSON" className="hidden" onChange={e => void readFile(e.target.files?.[0])} />
            <div className="border border-dashed border-border bg-card p-5"><Upload className="mb-3 size-5 text-accent" /><p className="break-all text-sm font-medium">{fileName || "Service-account key JSON"}</p><p className="mb-4 mt-1 text-xs text-muted-foreground">Encrypted storage · never shown again</p><Button type="button" variant="outline" size="sm" disabled={busy || !signedIn} onClick={() => fileInput.current?.click()}><KeyRound className="size-3.5" />{fileName ? "Replace JSON" : "Choose JSON file"}</Button></div></>
            : <><label className="block space-y-1.5"><span className="text-xs font-medium">Directory (tenant) ID</span><Input aria-label="Tenant ID" required value={tenant} onChange={e => setTenant(e.target.value)} placeholder="Tenant UUID" /></label><label className="block space-y-1.5"><span className="text-xs font-medium">Application (client) ID</span><Input aria-label="Client ID" required value={client} onChange={e => setClient(e.target.value)} placeholder="Application UUID" /></label><label className="block space-y-1.5"><span className="text-xs font-medium">Client secret value</span><Input type="password" autoComplete="off" aria-label="Client secret" required value={secret} onChange={e => setSecret(e.target.value)} placeholder="Secret value, not its ID" /></label></>}
          <div className="flex flex-wrap gap-2 border-t border-border pt-4"><Button type="submit" disabled={busy || !signedIn || !hasCredential}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}Save & verify</Button>{editing && <Button type="button" variant="ghost" onClick={() => reset()}>Cancel</Button>}</div>
        </form>
        {message && <div role="status" className={cn("mt-4 flex gap-2 border-l-2 bg-card p-3 text-xs leading-relaxed", problem ? "border-destructive" : "border-accent")}>{problem ? <CircleAlert className="size-4 shrink-0 text-destructive" /> : <CheckCircle2 className="size-4 shrink-0 text-accent" />}<p className="min-w-0 break-words">{message}</p></div>}
        {activeId && connections.find(c => c.id === activeId)?.status === "connected" && <Button className="mt-4" variant="outline" disabled={busy} onClick={() => void runAction(activeId, "discover")}>Discover rooms<ArrowRight className="size-4" /></Button>}
      </section>
    </div>
    <section className="mt-10 border-t border-border pt-6" aria-label="Saved connections"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Your connections <span className="ml-2 text-sm text-muted-foreground">{connections.length}</span></h2><Button variant="ghost" size="icon" disabled={!signedIn || busy} title="Refresh connections" aria-label="Refresh connections" onClick={() => void refresh()}><RefreshCw className="size-4" /></Button></div>
      {loading ? <p className="text-sm text-muted-foreground">Loading connections…</p> : !connections.length ? <div className="flex items-center gap-4 border-y border-border py-8"><CalendarDays className="size-8 text-muted-foreground" /><div><p className="text-sm font-medium">No connections yet</p><p className="mt-1 text-xs text-muted-foreground">{signedIn ? "Add Google Workspace, Microsoft 365, or both." : "Sign in to view and manage your company's room connections."}</p></div></div> : <div className="space-y-3">{connections.map(connection => <article key={connection.id} className="rounded-md border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="label-caps mb-1">{connection.provider === "google" ? "GOOGLE WORKSPACE" : "MICROSOFT 365"}</p><h3 className="break-words text-base font-semibold">{connection.name}</h3><p className="mt-1 break-all text-xs text-muted-foreground">{connection.reader_email}</p></div><span className={cn("flex items-center gap-1.5 text-xs font-medium", connection.status === "connected" ? "text-accent" : connection.status === "error" ? "text-destructive" : "text-muted-foreground")}>{connection.status === "connected" ? <CheckCircle2 className="size-3.5" /> : <CircleAlert className="size-3.5" />}{connection.status === "connected" ? "Connected" : connection.status === "error" ? "Needs attention" : "Not verified"}</span></div><div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span>{connection.rooms.length} managed rooms</span><span>Last verified: {connection.verified_at ? new Date(connection.verified_at).toLocaleString() : "Never"}</span></div>{connection.last_error && <p className="mt-3 break-words border-l-2 border-destructive pl-3 text-xs leading-relaxed text-destructive">{connection.last_error}</p>}<div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3"><Button size="sm" variant="outline" disabled={busy} onClick={() => void runAction(connection.id, "verify")}><ShieldCheck className="size-3.5" />Verify</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void runAction(connection.id, "discover")}><Search className="size-3.5" />Discover rooms</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => replace(connection)}><KeyRound className="size-3.5" />Replace {connection.provider === "google" ? "key" : "credentials"}</Button><Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => setRemoveId(connection.id)}><Trash2 className="size-3.5" />Remove</Button></div></article>)}</div>}
    </section>
    <Dialog open={Boolean(roomDialog)} onOpenChange={open => { if (!open) setRoomDialog(null); }}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Choose your managed rooms</DialogTitle><DialogDescription>{rooms.length} rooms found. Calendar-read access will be checked for each selected room.</DialogDescription></DialogHeader><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms" aria-label="Search discovered rooms" /><div className="flex justify-between text-xs text-muted-foreground"><span>{selected.length} selected</span><Button variant="ghost" size="sm" onClick={() => setSelected(selected.length === rooms.length ? [] : rooms.map(r => r.id))}>{selected.length === rooms.length ? "Deselect all" : "Select all"}</Button></div><div className="max-h-80 space-y-1 overflow-y-auto">{visibleRooms.map(room => <label key={room.id} className="flex cursor-pointer gap-3 border-b border-border py-3"><Checkbox checked={selected.includes(room.id)} onCheckedChange={checked => setSelected(previous => checked ? [...previous, room.id] : previous.filter(id => id !== room.id))} aria-label={`Manage ${room.name}`} /><div className="min-w-0"><p className="text-sm font-medium">{room.name}</p><p className="break-all text-xs text-muted-foreground">{room.email}</p><p className="mt-1 text-xs text-muted-foreground">{[room.location, room.capacity ? `${room.capacity} people` : ""].filter(Boolean).join(" · ")}</p></div></label>)}{!visibleRooms.length && <p className="py-5 text-sm text-muted-foreground">No rooms found.</p>}</div><Button disabled={busy} onClick={async () => { if (!roomDialog) return; setBusy(true); try { const result = await action({ data: { id: roomDialog, action: "select", roomIds: selected } }); notify(result.message, !result.ok); if (result.ok) setRoomDialog(null); await refresh(); } catch { notify("Could not save the selected rooms. Please try again.", true); } finally { setBusy(false); } }}><Check className="size-4" />Save managed rooms</Button>{problem && message && <p role="alert" className="text-xs text-destructive">{message}</p>}</DialogContent></Dialog>
    <Dialog open={Boolean(removeId)} onOpenChange={open => { if (!open) setRemoveId(null); }}><DialogContent><DialogHeader><DialogTitle>Remove this connection?</DialogTitle><DialogDescription>The saved key and managed-room selections will be deleted. Meetings in Google or Microsoft are not changed. Revoke the credential with the provider if it is no longer needed.</DialogDescription></DialogHeader><div className="flex gap-2"><Button variant="outline" onClick={() => setRemoveId(null)}><X className="size-4" />Cancel</Button><Button variant="destructive" disabled={busy} onClick={async () => { if (!removeId) return; setBusy(true); try { const result = await action({ data: { id: removeId, action: "remove" } }); setRemoveId(null); reset(); notify(result.message); await refresh(); } catch { notify("Could not remove this connection. Please retry.", true); } finally { setBusy(false); } }}><Trash2 className="size-4" />Remove connection</Button></div></DialogContent></Dialog>
  </main>;
}