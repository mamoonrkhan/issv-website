const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a site path with the deploy base. Leaves external, mailto: and #hash links alone. */
export function u(path: string): string {
  if (!path) return BASE + '/';
  if (/^([a-z]+:|#|\/\/)/i.test(path)) return path;
  return BASE + (path.startsWith('/') ? path : '/' + path);
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
