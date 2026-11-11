"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  toggleLockFormAction,
  updateStatusAuditAction,
} from "@/app/actions/audit-status";
import { toast } from "sonner";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ClockIcon,
  Loader2Icon,
  LockIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  UnlockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuditStatusControlProps {
  periodeId: number;
  cabangId: number;
  cabangNama: string;
  periodeNama: string;
  initialStatus: string;
  initialIsLocked?: boolean;
  jumlahButirTerisi: number;
  jumlahButirDiaudit: number;
  jumlahIndikator?: number;
  readOnly?: boolean;
  onStatusUpdated?: (newStatus: string) => void;
  onLockToggled?: (isLocked: boolean) => void;
  className?: string;
}

export function AuditStatusControl({
  periodeId,
  cabangId,
  cabangNama,
  periodeNama,
  initialStatus,
  initialIsLocked = false,
  jumlahButirTerisi,
  jumlahButirDiaudit,
  jumlahIndikator = 72,
  readOnly = false,
  onStatusUpdated,
  onLockToggled,
  className,
}: AuditStatusControlProps) {
  const [currentStatus, setCurrentStatus] = React.useState<string>(
    initialStatus || "Belum Diaudit"
  );
  const [isLocked, setIsLocked] = React.useState<boolean>(initialIsLocked);
  const [targetStatus, setTargetStatus] = React.useState<
    "Belum Diaudit" | "Sedang Diaudit" | "Sudah Diaudit"
  >("Sudah Diaudit");
  const [catatan, setCatatan] = React.useState<string>("");
  const [isStatusDialogOpen, setIsStatusDialogOpen] = React.useState<boolean>(false);
  const [isLockDialogOpen, setIsLockDialogOpen] = React.useState<boolean>(false);
  const [isPending, startTransition] = React.useTransition();

  // Sinkronkan state jika initialStatus / initialIsLocked berubah dari server
  const [prevInitialStatus, setPrevInitialStatus] = React.useState(initialStatus);
  const [prevInitialIsLocked, setPrevInitialIsLocked] = React.useState(initialIsLocked);

  if (initialStatus !== prevInitialStatus) {
    setPrevInitialStatus(initialStatus);
    setCurrentStatus(initialStatus || "Belum Diaudit");
  }

  if (initialIsLocked !== prevInitialIsLocked) {
    setPrevInitialIsLocked(initialIsLocked);
    setIsLocked(Boolean(initialIsLocked));
  }

  const jumlahBelumDinilai = Math.max(0, jumlahButirTerisi - jumlahButirDiaudit);
  const isAuditLengkap =
    jumlahButirDiaudit >= jumlahIndikator ||
    (jumlahButirTerisi > 0 && jumlahBelumDinilai === 0);

  const handleOpenStatusDialog = (
    status: "Belum Diaudit" | "Sedang Diaudit" | "Sudah Diaudit"
  ) => {
    setTargetStatus(status);
    setCatatan("");
    setIsStatusDialogOpen(true);
  };

  const handleConfirmStatusChange = () => {
    startTransition(async () => {
      try {
        const result = await updateStatusAuditAction({
          periodeId,
          cabangId,
          status: targetStatus,
          catatan: catatan.trim() || undefined,
        });

        if (result.ok) {
          setCurrentStatus(result.status);
          setIsStatusDialogOpen(false);
          toast.success(result.message);
          if (onStatusUpdated) {
            onStatusUpdated(result.status);
          }
        } else {
          toast.error(result.error);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Gagal memperbarui status audit.";
        toast.error(msg);
      }
    });
  };

  const handleConfirmToggleLock = () => {
    startTransition(async () => {
      try {
        const nextLockState = !isLocked;
        const result = await toggleLockFormAction({
          periodeId,
          cabangId,
          isLocked: nextLockState,
        });

        if (result.ok) {
          setIsLocked(result.isLocked);
          setIsLockDialogOpen(false);
          toast.success(result.message);
          if (onLockToggled) {
            onLockToggled(result.isLocked);
          }
        } else {
          toast.error(result.error);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Gagal mengubah status kunci form.";
        toast.error(msg);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Sudah Diaudit":
        return (
          <Badge variant="default" className="font-medium gap-1 px-2.5 py-1 text-xs shadow-xs">
            <CheckCircle2Icon className="size-3.5" />
            <span>Sudah Diaudit</span>
          </Badge>
        );
      case "Sedang Diaudit":
        return (
          <Badge
            variant="secondary"
            className="border font-medium gap-1 px-2.5 py-1 text-xs"
          >
            <ClockIcon className="size-3.5" />
            <span>Sedang Diaudit</span>
          </Badge>
        );
      case "Belum Diaudit":
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground border-dashed font-medium gap-1 px-2.5 py-1 text-xs"
          >
            <AlertCircleIcon className="size-3.5" />
            <span>Belum Diaudit</span>
          </Badge>
        );
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-xs shadow-xs",
          className
        )}
      >
        {/* Informasi Status, Status Kunci & Progres */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status:
            </span>
            {getStatusBadge(currentStatus)}

            {/* Badge Status Kunci Form */}
            {isLocked && (
              <Badge
                variant="outline"
                className="border-destructive/40 text-destructive bg-destructive/5 font-medium gap-1 px-2.5 py-1 text-xs"
              >
                <LockIcon className="size-3" />
                <span>Form Terkunci</span>
              </Badge>
            )}
          </div>

          <div className="hidden sm:block text-muted-foreground/40">•</div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Progres Verifikasi:{" "}
              <strong className="text-foreground font-semibold tabular-nums">
                {jumlahButirDiaudit}
              </strong>{" "}
              / {jumlahIndikator} butir
            </span>
            {jumlahButirTerisi > 0 && (
              <span className="tabular-nums">
                ({Math.round((jumlahButirDiaudit / jumlahIndikator) * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* Tombol Aksi: Kunci Form & Pemberian Status */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Tombol Kunci / Buka Kunci Form */}
            <Button
              type="button"
              variant={isLocked ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "gap-1.5 cursor-pointer font-medium h-8 text-xs",
                isLocked
                  ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setIsLockDialogOpen(true)}
              aria-label={isLocked ? "Buka kunci form isian cabang" : "Kunci form isian cabang"}
            >
              {isLocked ? (
                <>
                  <UnlockIcon className="size-3.5" />
                  <span>Buka Kunci Form</span>
                </>
              ) : (
                <>
                  <LockIcon className="size-3.5" />
                  <span>Kunci Form</span>
                </>
              )}
            </Button>

            {/* Tombol Utama Status: Tandai Sudah Diaudit / Buka Kembali */}
            {currentStatus !== "Sudah Diaudit" ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-1.5 shadow-xs cursor-pointer font-medium h-8 text-xs"
                onClick={() => handleOpenStatusDialog("Sudah Diaudit")}
              >
                <CheckCircle2Icon className="size-3.5" />
                <span>Tandai Sudah Diaudit</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 cursor-pointer font-medium h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => handleOpenStatusDialog("Sedang Diaudit")}
              >
                <RotateCcwIcon className="size-3.5" />
                <span>Buka Kembali Audit</span>
              </Button>
            )}

            {/* Menu Dropdown Status Lainnya */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 cursor-pointer"
                    aria-label="Pilihan status audit lainnya"
                  >
                    <ChevronDownIcon className="size-3.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48 text-xs">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Ubah Status Manual
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={currentStatus === "Sudah Diaudit"}
                    onClick={() => handleOpenStatusDialog("Sudah Diaudit")}
                    className="gap-2 cursor-pointer"
                  >
                    <CheckCircle2Icon className="size-3.5 text-primary" />
                    <span>Sudah Diaudit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={currentStatus === "Sedang Diaudit"}
                    onClick={() => handleOpenStatusDialog("Sedang Diaudit")}
                    className="gap-2 cursor-pointer"
                  >
                    <ClockIcon className="size-3.5 text-muted-foreground" />
                    <span>Sedang Diaudit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={currentStatus === "Belum Diaudit"}
                    onClick={() => handleOpenStatusDialog("Belum Diaudit")}
                    className="gap-2 cursor-pointer"
                  >
                    <AlertCircleIcon className="size-3.5 text-muted-foreground" />
                    <span>Belum Diaudit</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Popup Dialog Konfirmasi Status Audit */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-full bg-muted text-foreground">
                {targetStatus === "Sudah Diaudit" ? (
                  <ShieldCheckIcon className="size-5 text-primary" />
                ) : (
                  <ClockIcon className="size-5 text-muted-foreground" />
                )}
              </div>
              <AlertDialogTitle className="text-base font-bold">
                {targetStatus === "Sudah Diaudit"
                  ? "Konfirmasi Penyelesaian Audit"
                  : `Ubah Status: ${targetStatus}`}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription render={<div />} className="text-xs text-left space-y-3 pt-1">
              <div className="leading-relaxed">
                Apakah Anda yakin ingin menetapkan status audit untuk{" "}
                <strong className="text-foreground">{cabangNama}</strong> pada
                periode <strong className="text-foreground">{periodeNama}</strong>{" "}
                menjadi{" "}
                <strong className="text-foreground font-semibold uppercase">
                  &quot;{targetStatus}&quot;
                </strong>
                ?
              </div>

              {/* Box Peringatan / Informasi Kelengkapan */}
              {targetStatus === "Sudah Diaudit" && (
                <>
                  {!isAuditLengkap && jumlahBelumDinilai > 0 ? (
                    <Alert variant="destructive" className="py-2.5">
                      <AlertTriangleIcon className="size-4" />
                      <AlertTitle className="text-xs font-semibold">
                        Peringatan Kelengkapan Butir
                      </AlertTitle>
                      <AlertDescription className="text-[11px] leading-relaxed">
                        Masih terdapat{" "}
                        <strong>{jumlahBelumDinilai} butir</strong> yang diisi
                        oleh cabang tetapi belum diberi Skor Auditor. Apakah Anda
                        tetap ingin menandai audit ini sebagai selesai?
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="py-2.5 border-primary/30 bg-primary/5 text-foreground">
                      <CheckCircle2Icon className="size-4 text-primary" />
                      <AlertTitle className="text-xs font-semibold">
                        Instrumen Terpenuhi
                      </AlertTitle>
                      <AlertDescription className="text-[11px] leading-relaxed">
                        Seluruh isian cabang ({jumlahButirDiaudit} butir) telah
                        selesai diverifikasi dan dinilai oleh auditor SIA.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {/* Form Input Catatan Tambahan (Opsional) */}
              <div className="space-y-1.5 pt-1">
                <Label
                  htmlFor="catatan-audit-status"
                  className="text-xs font-medium text-foreground"
                >
                  Catatan Kesimpulan / Alasan (Opsional)
                </Label>
                <Textarea
                  id="catatan-audit-status"
                  placeholder="Tuliskan catatan tambahan mengenai status audit ini..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="text-xs resize-none h-20"
                  maxLength={1000}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={isPending}
              className="text-xs h-8 cursor-pointer"
            >
              Batal
            </AlertDialogCancel>
            <Button
              type="button"
              variant="default"
              disabled={isPending}
              onClick={handleConfirmStatusChange}
              className="text-xs h-8 gap-1.5 cursor-pointer font-medium"
            >
              {isPending && <Loader2Icon className="size-3.5 animate-spin" />}
              <span>
                {targetStatus === "Sudah Diaudit"
                  ? "Ya, Tandai Sudah Diaudit"
                  : "Ya, Ubah Status"}
              </span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Popup Dialog Konfirmasi Kunci / Buka Kunci Form */}
      <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-full bg-muted text-foreground">
                {isLocked ? (
                  <UnlockIcon className="size-5 text-primary" />
                ) : (
                  <LockIcon className="size-5 text-destructive" />
                )}
              </div>
              <AlertDialogTitle className="text-base font-bold">
                {isLocked
                  ? "Buka Kunci Form Isian Cabang"
                  : "Konfirmasi Kunci Form Cabang"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription render={<div />} className="text-xs text-left space-y-3 pt-1">
              {isLocked ? (
                <div className="leading-relaxed">
                  Apakah Anda yakin ingin{" "}
                  <strong className="text-foreground">membuka kunci</strong> form
                  isian instrumen untuk{" "}
                  <strong className="text-foreground">{cabangNama}</strong> pada
                  periode <strong className="text-foreground">{periodeNama}</strong>?
                  Akun user cabang akan dapat kembali mengedit dan melengkapi data
                  isian (selama periode audit masih aktif).
                </div>
              ) : (
                <Alert variant="destructive" className="py-2.5">
                  <AlertTriangleIcon className="size-4" />
                  <AlertTitle className="text-xs font-semibold">
                    Perhatian Penguncian Form
                  </AlertTitle>
                  <AlertDescription className="text-[11px] leading-relaxed">
                    Setelah form untuk{" "}
                    <strong>{cabangNama}</strong> dikunci, akun user cabang{" "}
                    <strong>tidak dapat mengisi atau mengedit</strong> skor
                    mandiri maupun link bukti evidence lagi.
                  </AlertDescription>
                </Alert>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={isPending}
              className="text-xs h-8 cursor-pointer"
            >
              Batal
            </AlertDialogCancel>
            <Button
              type="button"
              variant="default"
              disabled={isPending}
              onClick={handleConfirmToggleLock}
              className="text-xs h-8 gap-1.5 cursor-pointer font-medium"
            >
              {isPending && <Loader2Icon className="size-3.5 animate-spin" />}
              <span>
                {isLocked ? "Ya, Buka Kunci Form" : "Ya, Kunci Form Sekarang"}
              </span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
