import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROOM_PHOTO_BUCKET, type RoomPhoto } from "@/lib/room-photos";

export function RoomPhotoImage({ photo, fallback, ...props }: { photo?: RoomPhoto; fallback: string; className: string; alt: string; width?: number; height?: number; loading?: "lazy" | "eager" }) {
  const [resolved, setResolved] = useState<{ path: string; url: string }>();
  useEffect(() => {
    if (!photo) return;
    let active = true;
    const resolve = async () => {
      const { data, error } = await supabase.storage.from(ROOM_PHOTO_BUCKET).createSignedUrl(photo.path, 3600);
      if (active) setResolved(!error && data ? { path: photo.path, url: data.signedUrl } : undefined);
    };
    void resolve();
    const timer = setInterval(resolve, 45 * 60 * 1000);
    const { data } = supabase.auth.onAuthStateChange(() => { setResolved(undefined); void resolve(); });
    return () => { active = false; clearInterval(timer); data.subscription.unsubscribe(); };
  }, [photo?.path]);
  return <img {...props} src={photo && resolved?.path === photo.path ? resolved.url : fallback} onError={() => setResolved(undefined)} />;
}