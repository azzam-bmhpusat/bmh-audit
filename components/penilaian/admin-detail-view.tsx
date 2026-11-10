"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PredikatTable } from "@/components/penilaian/predikat-table";
import { AdminRekapComparison } from "@/components/penilaian/admin-rekap-comparison";
import { MatrixTable } from "@/components/audit/matrix-table";
import type {
  AuditPredikat,
  ItemPoin,
  MatrixRowAdmin,
  MatrixTree,
  PenilaianAdmin,
} from "@/types/audit";
import { Separator } from "@/components/ui/separator";

interface AdminDetailViewProps {
  periodeId: number;
  cabangId: number;
  penilaian: PenilaianAdmin;
  predikatList: AuditPredikat[];
  matrixTree: MatrixTree<MatrixRowAdmin>;
  poinList: ItemPoin[];
}

export function AdminDetailView({
  periodeId,
  cabangId,
  penilaian,
  predikatList,
  matrixTree,
  poinList,
}: AdminDetailViewProps) {
  const router = useRouter();

  // Setelah simpan nilai auditor sukses, refresh data dari server view
  const handleSavedSuccess = React.useCallback(() => {
    router.refresh();
  }, [router]);

  // Highlight predikat auditor jika sudah dinilai, jika belum highlight audite
  const activePredikat =
    penilaian.jumlah_butir_diaudit > 0
      ? penilaian.nilai_kepatuhan_auditor
      : penilaian.jumlah_butir_terisi > 0
      ? penilaian.nilai_kepatuhan_audite
      : null;

  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* BAGIAN 1: Tabel Standar Predikat                               */}
      {/* ============================================================== */}
      <section>
        <PredikatTable
          predikatList={predikatList}
          activeNilai={activePredikat}
        />
      </section>

      <Separator />

      {/* ============================================================== */}
      {/* BAGIAN 2: Rekapitulasi 2 Blok (Isian Cabang vs Sudah Di Audit) */}
      {/* ============================================================== */}
      <section>
        <AdminRekapComparison penilaian={penilaian} />
      </section>

      <Separator />

      {/* ============================================================== */}
      {/* BAGIAN 3: Matriks Per Butir 72 Soal                            */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">
            Matriks Penilaian Instrumen Audit
          </h3>
          <p className="text-xs text-muted-foreground">
            Validasi 5 bukti evidence, tentukan Skor Auditor (1–5), dan berikan catatan per butir pertanyaan
          </p>
        </div>

        <MatrixTable
          mode="admin"
          data={matrixTree}
          periodeId={periodeId}
          cabangId={cabangId}
          poinList={poinList}
          readOnly={false}
          showSummaryCard={false}
          onSavedSuccess={handleSavedSuccess}
        />
      </section>
    </div>
  );
}
