"use client";

import { useLayoutEffect, useState } from "react";

import {
  PRINT_BODY_CONTENT_HEIGHT_PX,
  PRINT_CONTENT_WIDTH_PX,
} from "@/components/document-engine/constants";

function readAvailableBodyHeight(measureTarget: HTMLElement) {
  const region =
    measureTarget.closest(".document-editable-region") ?? measureTarget.parentElement;

  if (!region || !(region instanceof HTMLElement)) {
    return Math.floor(measureTarget.clientHeight);
  }

  const styles = getComputedStyle(region);
  const paddingY =
    (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
  const available = Math.floor(region.clientHeight - paddingY);
  const hostHeight = Math.floor(measureTarget.clientHeight);

  if (available > 0 && hostHeight > 0) {
    return Math.min(available, hostHeight);
  }

  return available > 0 ? available : hostHeight;
}

function readContentWidth(measureTarget: HTMLElement) {
  const width = Math.floor(measureTarget.clientWidth);
  return width > 0 ? width : PRINT_CONTENT_WIDTH_PX;
}

/**
 * Measures the free body band inside the pinned A4 header/footer grid.
 * Avoid reading a self-assigned pixel height — that locks pagination to the
 * initial fallback and lets content spill into the footer when the real header
 * is taller than the constant assumes.
 */
export function useDocumentBodyHeight(
  measureRef: React.RefObject<HTMLElement | null>,
  enabled = true,
) {
  const [bodyHeightPx, setBodyHeightPx] = useState(PRINT_BODY_CONTENT_HEIGHT_PX);
  const [contentWidthPx, setContentWidthPx] = useState(PRINT_CONTENT_WIDTH_PX);

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    const measureTarget = measureRef.current;

    if (!measureTarget) {
      return;
    }

    function measure() {
      const nextHeight = readAvailableBodyHeight(measureTarget!);
      const nextWidth = readContentWidth(measureTarget!);

      if (nextHeight > 0) {
        setBodyHeightPx((current) => (current === nextHeight ? current : nextHeight));
      }

      if (nextWidth > 0) {
        setContentWidthPx((current) => (current === nextWidth ? current : nextWidth));
      }
    }

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);
    const pageFrame =
      measureTarget.closest(".print-page--document") ??
      measureTarget.closest(".document-editable-region") ??
      measureTarget;

    observer.observe(pageFrame);
    observer.observe(measureTarget);

    return () => observer.disconnect();
  }, [enabled, measureRef]);

  return { bodyHeightPx, contentWidthPx };
}
