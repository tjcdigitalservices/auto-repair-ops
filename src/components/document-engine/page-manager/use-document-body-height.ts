"use client";

import { useLayoutEffect, useState } from "react";

import { PRINT_BODY_CONTENT_HEIGHT_PX } from "@/components/document-engine/constants";

export function useDocumentBodyHeight(
  measureRef: React.RefObject<HTMLElement | null>,
  enabled = true,
) {
  const [bodyHeightPx, setBodyHeightPx] = useState(PRINT_BODY_CONTENT_HEIGHT_PX);

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    const measureTarget = measureRef.current;

    if (!measureTarget) {
      return;
    }

    function measure() {
      const nextHeight = Math.floor(measureTarget!.clientHeight);

      if (nextHeight > 0) {
        setBodyHeightPx(nextHeight);
      }
    }

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(measureTarget);

    return () => observer.disconnect();
  }, [enabled, measureRef]);

  return bodyHeightPx;
}
