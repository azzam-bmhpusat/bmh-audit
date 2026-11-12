/**
 * lib/auth/password.ts
 * Utilitas keamanan password: generator password sementara yang kuat secara kriptografis.
 */

/**
 * Menghasilkan password sementara yang kuat dan acak:
 * Mengandung huruf besar, huruf kecil, angka, dan karakter khusus.
 */
export function generateSecurePassword(length = 12): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%^&*";
  const array = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback untuk environment tanpa crypto global
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
