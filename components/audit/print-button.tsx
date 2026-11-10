"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PrinterIcon } from "lucide-react";

export function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="h-8 text-xs gap-1.5"
      aria-label="Cetak lembar audit"
    >
      <PrinterIcon className="size-3.5" />
      <span>Cetak</span>
    </Button>
  );
}
