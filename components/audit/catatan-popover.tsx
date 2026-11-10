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
  onSave: (val: string | null) => void;
}

/**
 * Popover catatan auditor per item (PRD §8.3 [S]).
 * Menampilkan Textarea maksimal 1000 karakter dengan penghitung karakter dan tombol simpan.
 */
export function CatatanPopover({
  itemNomor,
  catatan,
  disabled = false,
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
    if (disabled || isOverLimit) return;
    const trimmed = text.trim();
    onSave(trimmed === "" ? null : trimmed);
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
            disabled={disabled}
            className={cn(
              "size-6 relative",
              hasCatatan && "font-semibold"
            )}
            aria-label={`Catatan auditor item ${itemNomor}`}
          />
        }
      >
        <MessageSquareIcon className="size-3.5" />
        {hasCatatan && (
          <span className="sr-only">Ada catatan auditor</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="center" side="top" className="w-80 p-3 space-y-3">
        <PopoverHeader className="gap-0.5">
          <PopoverTitle className="text-xs font-semibold">
            Catatan Auditor (Item #{itemNomor})
          </PopoverTitle>
          <PopoverDescription className="text-[11px] text-muted-foreground">
            Tulis catatan atau temuan pemeriksaan untuk item ini.
          </PopoverDescription>
        </PopoverHeader>

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
      </PopoverContent>
    </Popover>
  );
}
