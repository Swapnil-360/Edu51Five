// Supabase Storage helpers with client-side image compression.
// All V2 images (avatars, covers, team logos/banners) go through here —
// never store base64 in DB columns (the legacy profile_pic mistake).

import { supabase } from "./supabase";

interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number; // 0-1, webp quality
}

/**
 * Resize + convert an image File to webp using a canvas.
 * Keeps aspect ratio; caps dimensions at maxWidth/maxHeight.
 */
export async function compressImage(
  file: File,
  { maxWidth, maxHeight, quality = 0.82 }: ResizeOptions,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed"))),
      "image/webp",
      quality,
    );
  });
}

/** Preset sizes per asset kind */
const PRESETS: Record<string, ResizeOptions> = {
  avatar: { maxWidth: 512, maxHeight: 512, quality: 0.85 },
  cover: { maxWidth: 1600, maxHeight: 500, quality: 0.8 },
  logo: { maxWidth: 512, maxHeight: 512, quality: 0.85 },
  banner: { maxWidth: 1600, maxHeight: 500, quality: 0.8 },
};

/**
 * Compress and upload an image to a Supabase Storage bucket.
 * Returns the public URL (with cache-busting query param).
 *
 * Path conventions:
 *  - avatars bucket:     {userId}/avatar.webp | {userId}/cover.webp
 *  - team-assets bucket: {teamId}/logo.webp  | {teamId}/banner.webp
 */
export async function uploadImage(
  bucket: "avatars" | "team-assets",
  folderId: string,
  kind: "avatar" | "cover" | "logo" | "banner",
  file: File,
): Promise<string> {
  const blob = await compressImage(file, PRESETS[kind]);
  const path = `${folderId}/${kind}.webp`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  // cache-bust so replaced images show immediately
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Remove a stored object (best-effort; ignores missing files). */
export async function removeStorageFile(
  bucket: string,
  path: string,
): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}
