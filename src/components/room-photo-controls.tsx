import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ROOM_PHOTO_BUCKET, roomPhotoError, type RoomPhoto } from "@/lib/room-photos";

export function RoomPhotoControls({ roomId, photo, onChange }: { roomId: string; photo?: RoomPhoto; onChange: (photo?: RoomPhoto) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const activeRoom = useRef(roomId);
  activeRoom.current = roomId;
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setSignedIn(Boolean(session)); if (session) setAuthOpen(false); });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => { setMessage(""); }, [roomId]);
  const authenticate = async (signup: boolean) => {
    setBusy(true); setMessage("");
    try {
      const { error } = signup ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }) : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (signup) setMessage("Check your email to confirm your account, then sign in.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not sign in."); }
    finally { setBusy(false); }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    const error = roomPhotoError(file);
    if (error) { setMessage(error); return; }
    const targetRoom = roomId;
    setBusy(true); setMessage("");
    try {
      const bitmap = await createImageBitmap(file); bitmap.close();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) { setAuthOpen(true); return; }
      const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      const path = `${data.user.id}/${targetRoom}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(ROOM_PHOTO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      if (activeRoom.current === targetRoom) { onChange({ path, name: file.name }); setMessage("Room photo uploaded."); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not upload this photo."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  return <div className="space-y-2 border-t border-border pt-3">
    <span className="label-caps">Room photo</span>
    {photo && <p className="break-all text-xs text-muted-foreground">{photo.name}</p>}
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Upload room photo" onChange={(e) => void upload(e.target.files?.[0])} />
    <div className="flex gap-1"><Button variant="outline" size="sm" className="min-w-0 flex-1 text-xs" disabled={busy} onClick={() => signedIn ? input.current?.click() : setAuthOpen(true)}>{busy ? <LoaderCircle className="size-3 animate-spin" /> : <ImagePlus className="size-3" />}{photo ? "Replace photo" : "Upload room photo"}</Button>{photo && <Button variant="ghost" size="icon" disabled={busy} aria-label="Remove room photo" title="Use default room photo" onClick={() => { onChange(undefined); setMessage("Default room photo restored."); }}><Trash2 className="size-3" /></Button>}</div>
    <p className="text-[11px] text-muted-foreground">JPG, PNG or WebP · up to 10 MB · Private</p>
    {message && !authOpen && <p role="status" className="break-words text-xs text-muted-foreground">{message}</p>}
    <Dialog open={authOpen} onOpenChange={setAuthOpen}><DialogContent><DialogHeader><DialogTitle>Sign in for room photos</DialogTitle><DialogDescription>Your room photos are stored privately in your account.</DialogDescription></DialogHeader><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void authenticate(false); }}><Input type="email" aria-label="Photo account email" placeholder="Email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /><Input type="password" aria-label="Photo account password" placeholder="Password" autoComplete="current-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /><div className="flex gap-2"><Button type="submit" disabled={busy}>Sign in</Button><Button type="button" variant="outline" disabled={busy || !email || password.length < 8} onClick={() => void authenticate(true)}>Create account</Button></div></form><div className="flex flex-wrap gap-2">{(["google", "lovable"] as const).map(provider => <Button key={provider} variant="outline" disabled={busy} onClick={async () => { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin }); if (result.error) setMessage(result.error.message); }}>Continue with {provider === "google" ? "Google" : "Lovable"}</Button>)}</div>{message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}</DialogContent></Dialog>
  </div>;
}