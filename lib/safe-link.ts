/**
 * lib/safe-link.ts
 * Sanitasi tautan lampiran bukti evidence (lapis kedua keamanan rendering).
 * Memastikan tautan yang dirender hanya menggunakan skema aman (http:// atau https://).
 */

export function safeHref(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  if (trimmed === "") {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
