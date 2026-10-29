import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  Gauge,
  Handshake,
  Images,
  Layers,
  ListVideo,
  LoaderCircle,
  MessageSquare,
  Monitor,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import {
  createAssistantThread,
  editAssistantThread,
  listAssistantThreads,
} from "@/lib/assistant.functions";
import relayMark from "@/assets/relay-assistant.png";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Thread = { id: string; title: string; updated_at: string };
type AssistantContext = {
  signedIn: boolean;
  ready: boolean;
  requestSignIn: () => void;
  newThread: () => Promise<string | undefined>;
  refresh: () => Promise<void>;
  pendingPrompt: string;
  setPendingPrompt: (text: string) => void;
};
const Context = createContext<AssistantContext | null>(null);
export function useAssistantWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("Assistant workspace missing.");
  return value;
}
export function RelayMark({ className }: { className?: string }) {
  return (
    <img
      src={relayMark}
      alt="Relay"
      width={64}
      height={64}
      className={cn("size-9 object-contain", className)}
    />
  );
}

const nav = [
  { label: "Control Center", to: "/control-center", icon: Gauge },
  { label: "Pulse", to: "/pulse", icon: Activity },
  { label: "Screens", to: "/screens", icon: Monitor },
  { label: "Schedules", to: "/schedules", icon: CalendarDays },
  { label: "Media", to: "/media", icon: Images },
  { label: "Playlists", to: "/playlists", icon: ListVideo },
  { label: "Layouts", to: "/layouts", icon: Layers },
  { label: "Users", to: "/users", icon: UserRound },
  { label: "Partners", to: "/partners", icon: Handshake },
  { label: "AI Assistant", to: "/assistant", icon: MessageSquare },
] as const;

export function AssistantWorkspace({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [search, setSearch] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [rename, setRename] = useState<Thread | null>(null);
  const [title, setTitle] = useState("");
  const [loadError, setLoadError] = useState("");
  const list = useServerFn(listAssistantThreads);
  const create = useServerFn(createAssistantThread);
  const edit = useServerFn(editAssistantThread);
  const refresh = async () => {
    try {
      setThreads(await list());
      setLoadError("");
    } catch {
      setLoadError("Conversations could not be loaded.");
    }
  };
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSignedIn(Boolean(data.session));
        setReady(true);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (["SIGNED_IN", "SIGNED_OUT", "INITIAL_SESSION"].includes(event)) {
        setSignedIn(Boolean(session));
        setReady(true);
        if (session) setAuthOpen(false);
        else setThreads([]);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (signedIn) void refresh();
  }, [signedIn, pathname]);
  const newThread = async () => {
    if (!signedIn) {
      setAuthOpen(true);
      return;
    }
    setBusy(true);
    try {
      const thread = await create();
      await refresh();
      await navigate({ to: "/assistant/$threadId", params: { threadId: thread.id } });
      return thread.id;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create conversation.");
      return;
    } finally {
      setBusy(false);
    }
  };
  return (
    <Context.Provider
      value={{
        signedIn,
        ready,
        requestSignIn: () => setAuthOpen(true),
        newThread,
        refresh,
        pendingPrompt,
        setPendingPrompt,
      }}
    >
      <TooltipProvider>
        <div className="flex h-dvh min-h-[550px] overflow-hidden bg-background text-foreground">
          <Toaster />
          <aside className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
            <Button asChild size="icon" className="mb-5 size-9">
              <Link to="/layouts" aria-label="Layouts home">
                <Layers />
              </Link>
            </Button>
            <nav aria-label="Primary navigation" className="flex flex-col gap-1">
              {nav.map((item) => (
                <Button
                  asChild
                  key={item.label}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-9 text-muted-foreground",
                    item.to === "/assistant" && "bg-primary/15 text-foreground",
                  )}
                >
                  <Link to={item.to} title={item.label} aria-label={item.label}>
                    <item.icon className="size-4" />
                  </Link>
                </Button>
              ))}
            </nav>
            <Button asChild variant="ghost" size="icon" className="mt-auto">
              <Link to="/profile" title="Profile" aria-label="Profile">
                <UserRound />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <Link to="/settings" title="Settings" aria-label="Settings">
                <Settings />
              </Link>
            </Button>
          </aside>
          <aside
            className={cn(
              "shrink-0 flex-col border-r border-border bg-card px-4 py-5 md:flex md:w-60",
              sidebar ? "absolute bottom-0 left-16 top-0 z-20 flex w-60 shadow-panel" : "hidden",
            )}
          >
            <div className="mb-6 flex items-center gap-2">
              <RelayMark className="size-7" />
              <p className="font-display text-sm font-semibold">Signage CMS</p>
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto md:hidden"
                aria-label="Close conversations"
                onClick={() => setSidebar(false)}
              >
                <X />
              </Button>
            </div>
            <Button
              onClick={() => {
                setPendingPrompt("");
                void newThread();
              }}
              disabled={busy}
              className="w-full justify-start"
            >
              <Plus className="size-4" />
              New conversation
            </Button>
            <div className="relative mt-4">
              <Search className="absolute left-2.5 top-3 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
                className="bg-surface pl-8 text-xs"
              />
            </div>
            <p className="label-caps mb-3 mt-7">YOUR CONVERSATIONS</p>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {threads
                .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
                .map((thread) => (
                  <div
                    key={thread.id}
                    className={cn(
                      "group flex items-center rounded-md",
                      pathname.endsWith(thread.id) ? "bg-primary/10" : "hover:bg-secondary",
                    )}
                  >
                    <Button
                      asChild
                      variant="ghost"
                      className="min-w-0 flex-1 justify-start px-2 font-normal hover:bg-transparent"
                    >
                      <Link
                        to="/assistant/$threadId"
                        params={{ threadId: thread.id }}
                        onClick={() => setSidebar(false)}
                      >
                        <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-xs">{thread.title}</span>
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          aria-label={`Options for ${thread.title}`}
                          title="Conversation options"
                        >
                          <ChevronLeft className="size-3 rotate-[-90deg]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setRename(thread);
                            setTitle(thread.title);
                          }}
                        >
                          <Pencil />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            try {
                              await edit({ data: { id: thread.id, action: "delete" } });
                              await refresh();
                              if (pathname.endsWith(thread.id))
                                await navigate({ to: "/assistant" });
                            } catch {
                              toast.error("Could not delete conversation.");
                            }
                          }}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              {!threads.length && (
                <p className="px-2 text-xs leading-6 text-muted-foreground">
                  {signedIn ? "No conversations yet." : "Sign in to see your conversations."}
                </p>
              )}
              {loadError && (
                <Button variant="ghost" size="sm" onClick={() => void refresh()}>
                  Try loading again
                </Button>
              )}
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="size-4 text-accent" />
                Private to your account
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {signedIn ? "Conversation history is saved." : "You’re not signed in."}
              </p>
              {!signedIn && (
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  size="sm"
                  onClick={() => setAuthOpen(true)}
                >
                  Sign in
                  <ArrowUpRight />
                </Button>
              )}
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-5 md:px-7">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label="Show conversations"
                  onClick={() => setSidebar(true)}
                >
                  <MessageSquare />
                </Button>
                <div>
                  <h1 className="font-display text-sm font-semibold">AI Assistant</h1>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Signage workspace / Relay
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-2 rounded-sm border border-border px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-accent" />
                {signedIn ? "ACCOUNT CONNECTED" : "SIGN IN TO CHAT"}
              </span>
            </header>
            {children}
          </div>
          <Dialog open={authOpen} onOpenChange={setAuthOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign in to Relay</DialogTitle>
                <DialogDescription>
                  Your conversations stay private and follow you across devices.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {(["google", "lovable"] as const).map((provider) => (
                  <Button
                    key={provider}
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      setAuthError("");
                      sessionStorage.setItem("relay:return", pathname);
                      const result = await lovable.auth.signInWithOAuth(provider, {
                        redirect_uri: `${window.location.origin}/assistant`,
                      });
                      if (result.error) setAuthError(result.error.message);
                    }}
                  >
                    {provider === "google" ? "Continue with Google" : "Sign in with Lovable"}
                    <ArrowUpRight />
                  </Button>
                ))}
                {authError && (
                  <p role="alert" className="text-sm text-destructive">
                    {authError}
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog
            open={Boolean(rename)}
            onOpenChange={(open) => {
              if (!open) setRename(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename conversation</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!rename) return;
                  try {
                    await edit({ data: { id: rename.id, action: "rename", title } });
                    setRename(null);
                    await refresh();
                  } catch {
                    toast.error("Could not rename conversation.");
                  }
                }}
              >
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-label="Conversation name"
                  maxLength={120}
                />
                <Button className="mt-4" disabled={!title.trim()}>
                  Save name
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </Context.Provider>
  );
}
