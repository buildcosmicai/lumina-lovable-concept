import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, ArrowRight, Eye, EyeOff, Fingerprint, Layers, Lock, Mail, Monitor, Radio, ShieldCheck, Signal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [
    { title: "Sign in — Signage CMS" },
    { name: "description", content: "Sign in to your digital signage workspace." },
    { property: "og:title", content: "Sign in — Signage CMS" },
    { property: "og:description", content: "Access your digital signage command centre." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: SignInPage,
});

const FLEET_BARS = [62, 78, 55, 84, 70, 92, 66, 74, 88, 60, 79, 95, 68, 82, 58, 90, 73, 85, 64, 77];

function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const signIn = () => {
    if (!email.trim() || !password) {
      toast("Missing details", { description: "Enter your email and password to continue." });
      return;
    }
    setSigningIn(true);
    setTimeout(() => {
      setSigningIn(false);
      toast.success("Welcome back", { description: "This demo workspace does not verify credentials yet." });
    }, 900);
  };

  return <div className="flex h-screen min-w-[900px] overflow-hidden bg-surface text-foreground">
    <Toaster />
    {/* Brand panel */}
    <section className="relative flex w-[46%] flex-col overflow-hidden border-r border-border bg-card px-12 py-10">
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="relative flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Layers className="size-4" /></span>
        <div><p className="font-display text-sm font-semibold">Signage CMS</p><p className="label-caps">Workspace</p></div>
      </div>
      <div className="relative mt-auto">
        <p className="label-caps mb-3 flex items-center gap-2 text-accent"><Sparkles className="size-3.5" /> Intelligent signage</p>
        <h1 className="font-display text-4xl font-semibold leading-[1.08]">Every screen in your network,<br /><span className="text-muted-foreground">one calm command centre.</span></h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">Monitor fleet health, schedule campaigns and protect playback across every location — before your audience notices anything.</p>
      </div>
      {/* Live fleet visual */}
      <div className="panel relative mt-10 p-5">
        <div className="flex items-center justify-between">
          <p className="label-caps flex items-center gap-2"><Signal className="size-3.5 text-accent" /> Fleet heartbeat</p>
          <span className="flex items-center gap-1.5 font-mono text-[9px] text-accent"><span className="size-1.5 rounded-full bg-accent animate-pulse" />LIVE</span>
        </div>
        <div className="mt-4 flex h-20 items-end gap-1.5">
          {FLEET_BARS.map((height, index) => <span key={index} className={cn("flex-1 rounded-sm", index % 5 === 3 ? "bg-primary/70" : "bg-accent/60")} style={{ height: `${height}%` }} />)}
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border pt-4">
          <Metric icon={Monitor} value="128" label="Screens online" />
          <Metric icon={Activity} value="99.98%" label="Playback uptime" />
          <Metric icon={Radio} value="1.2s" label="Signal latency" />
        </div>
      </div>
      <p className="relative mt-8 flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5 text-accent" />SOC 2 aligned · SSO ready · Region-pinned data</p>
    </section>

    {/* Form panel */}
    <section className="flex flex-1 flex-col items-center justify-center px-10">
      <div className="w-full max-w-sm">
        <p className="label-caps mb-2">Welcome back</p>
        <h2 className="font-display text-2xl font-semibold">Sign in to your workspace</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Pick up exactly where your fleet left off.</p>

        <div className="mt-8 space-y-3">
          <Button variant="outline" className="h-10 w-full gap-2 text-sm" onClick={() => toast("Single sign-on", { description: "SSO will be available once your organisation is connected." })}><Fingerprint className="size-4 text-primary" />Continue with SSO</Button>
          <div className="flex items-center gap-3 py-1"><span className="h-px flex-1 bg-border" /><span className="label-caps">or with email</span><span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={(event) => { event.preventDefault(); signIn(); }} className="space-y-3">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" aria-label="Email address" autoComplete="email" className="h-10 bg-card pl-9 text-sm" />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" aria-label="Password" autoComplete="current-password" className="h-10 bg-card pl-9 pr-10 text-sm" />
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" defaultChecked className="size-3.5 accent-[var(--primary)]" />Keep me signed in</label>
              <Button type="button" variant="link" className="h-auto p-0 text-xs text-primary" onClick={() => toast("Password reset", { description: "A reset link would be sent to your inbox." })}>Forgot password?</Button>
            </div>
            <Button type="submit" disabled={signingIn} className="h-10 w-full gap-2 text-sm">{signingIn ? "Signing in…" : "Sign in"}<ArrowRight className={cn("size-4", signingIn && "animate-pulse")} /></Button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">New to Signage CMS? <Button variant="link" className="h-auto p-0 text-xs text-primary" onClick={() => toast("Request access", { description: "Your workspace administrator can invite you." })}>Request an invite</Button></p>
        <p className="mt-10 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">Protected access · Audit logged</p>
      </div>
    </section>
  </div>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof Monitor; value: string; label: string }) {
  return <div className="px-4 first:pl-0"><Icon className="size-3.5 text-muted-foreground" /><p className="mt-2 font-display text-lg font-semibold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}
