import type { ImageMetadata } from 'astro';

// Every image uploaded through the CMS lives in src/assets so the build can
// resize it, convert it to AVIF/WebP and strip location data.
const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true },
);

/** Resolve a CMS image path ("/src/assets/photos/greene-middle-school.jpg") to optimizable metadata. */
export function resolveImage(path: string | undefined | null): ImageMetadata | undefined {
  if (!path) return undefined;
  const key = path.startsWith('/') ? path : '/' + path;
  return files[key]?.default;
}
