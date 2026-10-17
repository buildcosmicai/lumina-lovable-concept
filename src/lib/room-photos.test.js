import { expect, test } from "bun:test";
import { roomPhotoError } from "./room-photos";
import { meetingConfig } from "./meeting-rooms";
test("room photos accept supported image formats", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) expect(roomPhotoError({ type, size: 1024 })).toBe("");
  expect(roomPhotoError({ type: "image/svg+xml", size: 1024 })).not.toBe("");
});
test("room photos enforce the bucket size limit", () => {
  expect(roomPhotoError({ type: "image/jpeg", size: 10 * 1024 * 1024 })).toBe("");
  expect(roomPhotoError({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 })).not.toBe("");
});
test("each selected room keeps its own photo across design changes", () => {
  const roomPhotos = { "ms-forum": { path: "owner/ms-forum/photo.jpg", name: "Forum.jpg" } };
  expect(meetingConfig({ roomId: "ms-forum", design: "panorama", roomPhotos }).roomPhotos["ms-forum"].name).toBe("Forum.jpg");
  expect(meetingConfig({ roomId: "ms-atelier", design: "prism", roomPhotos }).roomPhotos["ms-atelier"]).toBeUndefined();
});