"use client";

import * as React from "react";
import { ExternalLinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { safeHref } from "@/lib/safe-link";
import { lampiranSchema } from "@/lib/schemas";
import { toast } from "sonner";

interface LampiranInputProps {
  itemNomor: number;
  urutan?: number;
  value: string | null | undefined;
  disabled?: boolean;
  onSave: (value: string | null) => void;
}

/**
 * Kontrol input teks URL lampiran bukti evidence mandiri cabang.
 * Menyimpan saat blur atau menekan tombol Enter.
 */
export function LampiranInput({
  itemNomor,
  urutan,
  value,
  disabled = false,
  onSave,
}: LampiranInputProps) {
  const [text, setText] = React.useState<string>(value ?? "");
  const [isFocused, setIsFocused] = React.useState(false);
  const [prevPropValue, setPrevPropValue] = React.useState(value);

  // Pola React resmi: sinkronisasi state saat prop berubah tanpa useEffect
  if (value !== prevPropValue) {
    setPrevPropValue(value);
    if (!isFocused) {
      setText(value ?? "");
    }
  }

  const commitValue = React.useCallback(() => {
    if (disabled) return;

    const trimmed = text.trim();
    const normalizedValue = trimmed === "" ? null : trimmed;

    // Jika nilainya identik dengan nilai tersimpan saat ini, lewati
    if (normalizedValue === (value ?? null)) {
      return;
    }

    // Validasi URL hanya http/https jika tidak kosong
    if (normalizedValue !== null) {
      const parsed = lampiranSchema.safeParse(normalizedValue);
      if (!parsed.success) {
        const errorMsg =
          parsed.error.issues[0]?.message ||
          "Tautan harus berupa URL http:// atau https:// valid";
        toast.error(`Item ${itemNomor}: ${errorMsg}`);
        return;
      }
    }

    onSave(normalizedValue);
  }, [disabled, text, value, itemNomor, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const validHref = safeHref(text || value);

  return (
    <div className="w-full min-w-[200px]">
      <div className="flex items-center gap-1.5">
        <Input
          type="url"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            commitValue();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={urutan ? `https://… (bukti #${urutan})` : "https://…"}
          className="h-7 text-xs font-mono"
          aria-label={`Lampiran link evidence item ${itemNomor} bukti ${urutan ?? 1}`}
        />
        {validHref && (
          <a
            href={validHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center size-7 rounded-md border border-input bg-transparent hover:bg-muted text-foreground transition-colors shrink-0"
            aria-label={`Buka tautan lampiran item ${itemNomor} bukti ${urutan ?? 1}`}
            title="Buka evidence di tab baru"
          >
            <ExternalLinkIcon className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
