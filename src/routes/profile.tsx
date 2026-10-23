import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { KeyRound, LogOut, MonitorSmartphone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SettingsShell } from "@/components/settings-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Signage CMS" },
      { name: "description", content: "Manage your Signage CMS account profile, password and sessions." },
      { property: "og:title", content: "Profile — Signage CMS" },
      { property: "og:description", content: "Manage your Signage CMS account profile, password and sessions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const PASSWORD_MIN_LENGTH = 10;

function ProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      const user = data.user;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metaName = meta["name"];
      const metaFullName = meta["full_name"];
      const displayName = typeof metaName === "string" ? metaName : typeof metaFullName === "string" ? metaFullName : "";
      const metaRole = meta["role"];
      const metaWorkspace = meta["workspace"];
      setEmail(user.email ?? null);
      setLastSignIn(user.last_sign_in_at ?? null);
      setName(displayName);
      setSavedName(displayName);
      if (typeof metaRole === "string") setRole(metaRole);
      if (typeof metaWorkspace === "string") setWorkspace(metaWorkspace);
    });
    return () => {
      active = false;
    };
  }, []);

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast("Name required", { description: "Enter a display name before saving." });
      return;
    }
    setSavedName(trimmed);
    toast.success("Name saved", { description: "Stored for this session only — account sync comes later." });
  };

  const updatePassword = () => {
    if (!currentPassword) {
      toast("Current password required", { description: "Enter your current password to continue." });
      return;
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      toast("Password too short", { description: `Use at least ${PASSWORD_MIN_LENGTH} characters.` });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("Passwords don't match", { description: "Re-enter the same new password in both fields." });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Checks passed", { description: "Account servers aren't connected yet, so no password was changed." });
  };

  const signOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/sign-in" });
  };

  return (
    <SettingsShell crumbs={[{ label: "Settings", to: "/settings" }, { label: "Profile" }]}>
      <Toaster />
      <main className="mx-auto max-w-3xl p-6 sm:p-8">
        <p className="label-caps mb-2">ACCOUNT</p>
        <h1 className="font-display text-3xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your personal details, password and sessions.</p>

        <div className="mt-8 space-y-6">
          <Card icon={UserRound} title="Profile" description="How you appear across the workspace.">
            <div className="space-y-4">
              <div>
                <label htmlFor="profile-name" className="label-caps mb-1.5 block">Name</label>
                <div className="flex gap-2">
                  <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" className="h-10 bg-card text-sm" />
                  <Button onClick={saveName} disabled={name.trim() === savedName} className="h-10 shrink-0">Save</Button>
                </div>
              </div>
              <div>
                <p className="label-caps mb-1.5">Email</p>
                <p className="text-sm">{email ?? "—"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Your administrator changes this — contact them to update it.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnly label="Role" value={role} />
                <ReadOnly label="Workspace" value={workspace} />
              </div>
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">Last signed in: {lastSignIn ? new Date(lastSignIn).toLocaleString() : "—"}</p>
            </div>
          </Card>

          <Card icon={KeyRound} title="Password" description="Change the password you sign in with.">
            <form onSubmit={(event) => { event.preventDefault(); updatePassword(); }} className="space-y-3">
              <div>
                <label htmlFor="current-password" className="label-caps mb-1.5 block">Current password</label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" className="h-10 bg-card text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-password" className="label-caps mb-1.5 block">New password</label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" className="h-10 bg-card text-sm" />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="label-caps mb-1.5 block">Confirm new password</label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className="h-10 bg-card text-sm" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">At least {PASSWORD_MIN_LENGTH} characters.</p>
              <Button type="submit" className="h-10">Update password</Button>
            </form>
          </Card>

          <Card icon={MonitorSmartphone} title="Sessions" description="Where you're signed in.">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" disabled className="h-10">Sign out of all other devices</Button>
              <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Coming later</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">This needs account backend support, so it's planned for a later release.</p>
          </Card>

          <div className="border-t border-border pt-6">
            <Button variant="outline" onClick={signOut} disabled={signingOut} className="h-10 gap-2">
              <LogOut className="size-4" />{signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      </main>
    </SettingsShell>
  );
}

function Card({ icon: Icon, title, description, children }: { icon: typeof UserRound; title: string; description: string; children: ReactNode }) {
  return (
    <section className="panel p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Icon className="size-5 text-accent" />{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ReadOnly({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="label-caps mb-1.5">{label}</p>
      <p className="text-sm">{value ?? "—"}</p>
    </div>
  );
}
