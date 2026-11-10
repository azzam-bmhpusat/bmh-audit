"use server";

import { createClient } from "@/lib/supabase/server";
import { bobotSchema, itemNomorSchema } from "@/lib/schemas";
import { z } from "zod";

export interface UbahBobotInput {
  itemNomor: number;
  bobot: number;
}

export type UbahBobotResult =
  | { ok: true; itemNomor: number; bobot: number }
  | { ok: false; error: string };

const ubahBobotInputSchema = z.object({
  itemNomor: itemNomorSchema,
  bobot: bobotSchema,
});

/**
 * Server Action untuk mengubah bobot item audit oleh admin SIA.
 * Catatan: Perubahan bobot berlaku global untuk seluruh cabang dan seluruh periode.
 */
export async function ubahBobot(
  input: UbahBobotInput
): Promise<UbahBobotResult> {
  // 1. Validasi Zod
  const parsed = ubahBobotInputSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Bobot atau nomor item tidak valid";
    return { ok: false, error: errorMsg };
  }

  const { itemNomor, bobot } = parsed.data;

  // 2. Autentikasi dan otorisasi role 'admin' di server
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Sesi telah berakhir. Silakan login kembali." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return {
      ok: false,
      error: "Hanya akun auditor (admin) yang berwenang mengubah bobot instrumen.",
    };
  }

  // 3. Update bobot di tabel audit_item
  const { data: updatedItem, error: updateError } = await supabase
    .from("audit_item")
    .update({ bobot })
    .eq("nomor", itemNomor)
    .select("nomor, bobot")
    .single();

  if (updateError || !updatedItem) {
    console.error("[BOBOT] Gagal update audit_item:", updateError?.message);
    return { ok: false, error: "Gagal memperbarui bobot item di database." };
  }

  return { ok: true, itemNomor: updatedItem.nomor, bobot: updatedItem.bobot };
}
