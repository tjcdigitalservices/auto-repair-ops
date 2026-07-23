"use client";

import { useEffect, useRef, useState } from "react";

import { PRINT_PAGE_WIDTH_PX } from "@/components/document-engine/constants";

export function useDocumentViewportScale(
  viewportRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  const [scale, setScale] = useState(0.72);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    function updateScale() {
      const padding = 32;
      const availableWidth = Math.max(viewport!.clientWidth - padding, 0);
      const scaleByWidth = availableWidth / PRINT_PAGE_WIDTH_PX;
      const nextScale = Math.min(scaleByWidth, 1);

      setScale(Math.max(0.45, nextScale));
    }

    updateScale();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [enabled, viewportRef]);

  return scale;
}
