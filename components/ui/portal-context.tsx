"use client";

import * as React from "react";

export const PortalContainerContext = React.createContext<
  React.RefObject<HTMLElement | null> | HTMLElement | null
>(null);

/**
 * Hook untuk menentukan kontainer elemen portal (Select, Popover, Dialog, dll).
 * Otomatis mendeteksi saat elemen berada dalam mode Full Screen (HTML5 native maupun CSS overlay).
 */
export function usePortalContainer(
  propContainer?: HTMLElement | React.RefObject<HTMLElement | null> | null
): HTMLElement | React.RefObject<HTMLElement | null> | undefined {
  const contextContainer = React.useContext(PortalContainerContext);
  const [fullscreenElement, setFullscreenElement] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const updateFullscreen = () => {
      setFullscreenElement(
        typeof document !== "undefined"
          ? (document.fullscreenElement as HTMLElement | null)
          : null
      );
    };

    updateFullscreen();
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreen);
    };
  }, []);

  // 1. Prioritas utama: prop eksplisit
  if (propContainer !== undefined && propContainer !== null) {
    return propContainer;
  }

  // 2. Prioritas kedua: konteks portal (misal dari MatrixTable saat isFullscreen)
  if (contextContainer) {
    return contextContainer;
  }

  // 3. Prioritas ketiga: elemen HTML5 fullscreen aktif saat ini
  if (fullscreenElement) {
    return fullscreenElement;
  }

  // 4. Default: undefined (Base UI akan merender ke document.body)
  return undefined;
}
