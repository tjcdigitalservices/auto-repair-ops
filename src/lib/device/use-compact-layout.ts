"use client";

import { useEffect, useState } from "react";

const COMPACT_LAYOUT_QUERY = "(max-width: 1023px)";

/** True on phones and tablets (below Tailwind `lg`). */
export function useCompactLayout() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_LAYOUT_QUERY);
    const sync = () => setIsCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isCompact;
}
