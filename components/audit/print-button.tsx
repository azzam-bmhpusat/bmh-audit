"use client";

import {
  ExportExcelButton,
  type ExportExcelButtonProps,
} from "./export-excel-button";

/**
 * @deprecated Gunakan ExportExcelButton untuk mengekspor data matriks ke format Excel (.xlsx).
 */
export function PrintButton(props: Partial<ExportExcelButtonProps>) {
  if (props.tree && props.mode) {
    return (
      <ExportExcelButton
        tree={props.tree}
        mode={props.mode}
        headerInfo={props.headerInfo}
        className={props.className}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="hidden"
      aria-hidden="true"
    />
  );
}

export { ExportExcelButton };
