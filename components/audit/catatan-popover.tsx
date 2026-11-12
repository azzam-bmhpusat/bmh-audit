"use client";

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareIcon } from "lucide-react";
import { cn } from "cn";

interface CatatanPopoverProps {
  itemNomor: number;
  catatan: string | null | undefined;
  disabled?: boolean;
  viewOnly?: boolean;
  onSave?: (val: string | null) => void;
}

/**
 * Popover catatan auditor per item (PRD §8.3 [S]).
 * Menampilkan Textarea maksimal 1000 karakter untuk admin, atau view-only untuk cabang.
 */
export function CatatanPopover({
  itemNomor,
  catatan,
  disabled = false,
  viewOnly = false,
  onSave,
}: CatatanPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(catatan ?? "");

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setText(catatan ?? "");
    }
    setOpen(nextOpen);
  };

  const hasCatatan = Boolean(catatan && catatan.trim().length > 0);
  const charCount = text.length;
  const isOverLimit = charCount > 1000;

  const handleSave = () => {
    if (disabled || isOverLimit || viewOnly) return;
    const trimmed = text.trim();
    onSave?.(trimmed === "" ? null : trimmed);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={hasCatatan ? "secondary" : "ghost"}
            size="icon-xs"
            disabled={disabled && !viewOnly}
            className={cn(
              "size-6 relative",
              hasCatatan && "bg-warning-bg text-warning-text border-warning-border border font-semibold",
              !hasCatatan && viewOnly && "text-muted-foreground hover:text-foreground"
            )}
            title={
              hasCatatan
                ? `Catatan auditor item ${itemNomor}`
                : viewOnly
                ? `Belum ada catatan auditor item ${itemNomor}`
                : `Tambah catatan auditor item ${itemNomor}`
            }
            aria-label={`Catatan auditor item ${itemNomor}`}
          />
        }
      >
        <MessageSquareIcon className="size-3.5" />
        {hasCatatan && (
          <>
            <span
              className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-warning-text"
              aria-hidden="true"
            />
            <span className="sr-only">Ada catatan auditor</span>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="center" side="top" className="w-80 p-3 space-y-3">
        <PopoverHeader className="gap-0.5">
          <PopoverTitle className="text-xs font-semibold">
            Catatan Auditor (Item #{itemNomor}) untuk perwakilan
          </PopoverTitle>
          <PopoverDescription className="text-[11px] text-muted-foreground">
            {viewOnly
              ? "Catatan atau temuan pemeriksaan dari auditor untuk perwakilan ini."
              : "Tulis catatan atau temuan pemeriksaan untuk item ini."}
          </PopoverDescription>
        </PopoverHeader>

        {viewOnly ? (
          <div className="space-y-3">
            {hasCatatan ? (
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {catatan}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground italic">
                Belum ada catatan dari auditor untuk item ini.
              </div>
            )}
            <div className="flex items-center justify-end pt-1 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-7 text-xs px-2.5"
              >
                Tutup
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ketik catatan auditor..."
                maxLength={1000}
                className="min-h-20 text-xs resize-none"
                aria-label={`Isi catatan auditor item ${itemNomor}`}
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Maksimal 1000 karakter</span>
                <span className={cn("tabular-nums", isOverLimit && "font-bold text-foreground")}>
                  {charCount}/1000
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setText(catatan ?? "");
                  setOpen(false);
                }}
                className="h-7 text-xs px-2.5"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={handleSave}
                disabled={disabled || isOverLimit}
                className="h-7 text-xs px-3"
              >
                Simpan
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
