import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, InfoIcon } from "lucide-react";
import { itemPoinSchema, matrixRowCabangSchema } from "@/lib/schemas";
import { buildMatrixTree } from "@/lib/matrix";
import { MatrixTable } from "@/components/audit/matrix-table";
import type { Periode } from "@/types/audit";
import { z } from "zod";

export const instant = false;

export default async function AuditPage() {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Pengguna dengan role admin diarahkan ke dashboard admin atau penilaian
  if (session.profile.role !== "user") {
    redirect("/dashboard/admin");
  }

  const { profile, cabangNama } = session;

  if (!profile.cabang_id) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Perhatian</AlertTitle>
          <AlertDescription>
            Akun Anda belum ditautkan ke cabang. Hubungi Admin SIA.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createClient();

  // 1. Ambil daftar periode (prioritaskan periode is_open = true terbaru)
  const { data: rawPeriodeList } = await supabase
    .from("periode")
    .select("*")
    .order("id", { ascending: false });

  const periodeList = (rawPeriodeList ?? []) as Periode[];
  const periodeAktif =
    periodeList.find((p) => p.is_open) ?? (periodeList[0] || null);

  if (!periodeAktif) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Informasi</AlertTitle>
          <AlertDescription>
            Belum ada periode audit yang tersedia. Hubungi Admin SIA.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  // 2. Query paralel matriks cabang dan poin item (Hanya v_audit_matrix_cabang, bukan admin)
  const [matrixRes, poinRes] = await Promise.all([
    supabase
      .from("v_audit_matrix_cabang")
      .select("*")
      .eq("periode_id", periodeAktif.id)
      .eq("cabang_id", profile.cabang_id)
      .order("nomor"),
    supabase
      .from("v_audit_item_poin")
      .select("*")
      .order("item_nomor")
      .order("urutan"),
  ]);

  if (matrixRes.error) {
    console.error("Gagal memuat v_audit_matrix_cabang:", matrixRes.error);
    throw new Error("Gagal memuat data matriks audit cabang.");
  }

  if (poinRes.error) {
    console.error("Gagal memuat v_audit_item_poin:", poinRes.error);
    throw new Error("Gagal memuat detail poin pertanyaan audit.");
  }

  // 3. Validasi skema toleran
  const rows = z.array(matrixRowCabangSchema).parse(matrixRes.data);
  const poinList = z.array(itemPoinSchema).parse(poinRes.data);

  // 4. Susun struktur pohon matriks (Pilar -> Variabel -> Item)
  const tree = buildMatrixTree(rows, poinList);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header halaman meniru Excel instrumen */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight uppercase">
          TABEL MATRIKS INSTRUMEN AUDIT KEPATUHAN INTEGRATIF LAZNAS BMH
        </h1>
        <p className="text-sm font-medium text-foreground">
          Periode : {periodeAktif.nama}
        </p>
        <p className="text-xs text-muted-foreground">
          Satuan Internal Audit BMH
        </p>
        <p className="text-sm font-semibold text-foreground">
          BMH Perwakilan {cabangNama || "—"}
        </p>
      </div>

      {/* Banner informasi jika periode ditutup */}
      {!periodeAktif.is_open && (
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Periode Ditutup</AlertTitle>
          <AlertDescription>
            Periode ini sudah ditutup. Isian tidak dapat diubah.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabel matriks instrumen interaktif mode cabang (memuat ringkasan live) */}
      <MatrixTable
        mode="cabang"
        data={tree}
        readOnly={!periodeAktif.is_open}
        periodeId={periodeAktif.id}
        poinList={poinList}
        headerInfo={{
          title: `BMH Perwakilan ${cabangNama || "—"}`,
          subtitle: `Periode: ${periodeAktif.nama}`,
        }}
      />
    </main>
  );
}
