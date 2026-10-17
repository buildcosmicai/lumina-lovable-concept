export type RoomPhoto = { path: string; name: string };
export const ROOM_PHOTO_BUCKET = "room-photos";
export function roomPhotoError(file: { type: string; size: number }) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Choose a JPG, PNG or WebP photo.";
  if (file.size > 10 * 1024 * 1024) return "Choose a photo smaller than 10 MB.";
  return "";
}