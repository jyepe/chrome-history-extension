export function parseHost(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function hostLetter(host: string): string {
  const match = host.match(/[a-z0-9]/i);
  return match ? match[0].toUpperCase() : "·";
}

/** Seeded 32-bit hash (FNV-1a variant) — stable across runs. */
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Map a host to a deterministic oklch color.
 * Lightness and chroma are fixed for visual consistency with the mock;
 * hue is derived from the hash so each domain gets its own tile color.
 */
export function hostColor(host: string): string {
  const hue = hashString(host) % 360;
  const lightness = 0.72 + ((hashString(host) >>> 9) % 10) / 100; // 0.72–0.81
  const chroma = 0.12 + ((hashString(host) >>> 17) % 5) / 100; // 0.12–0.16
  return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue})`;
}
