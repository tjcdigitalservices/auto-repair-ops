import {
  PRINT_BODY_CONTENT_HEIGHT_PX,
  PRINT_CONTENT_WIDTH_PX,
} from "@/components/document-engine/constants";

/** Must match TipTap / live A4 body typography or pages break too early. */
export const DOCUMENT_PAGINATION_MEASURE_CLASS_NAME =
  "document-editor-content document-page-body text-[11px] leading-[1.4] text-slate-900";

function normalizeDocumentHtml(html: string) {
  const trimmed = html.trim();

  if (!trimmed || trimmed === "<p></p>") {
    return "<p><br></p>";
  }

  return trimmed;
}

const SPLITTABLE_BLOCK_TAGS = new Set(["p", "h2", "h3"]);

function isSplittableBlock(node: Node): node is HTMLElement {
  return (
    node instanceof HTMLElement && SPLITTABLE_BLOCK_TAGS.has(node.tagName.toLowerCase())
  );
}

function measureHtmlHeight(measureHost: HTMLElement) {
  return Math.max(measureHost.offsetHeight, measureHost.scrollHeight, 0);
}

function cloneBlockShell(block: HTMLElement) {
  const next = document.createElement(block.tagName.toLowerCase());
  const className = block.getAttribute("class");
  const style = block.getAttribute("style");

  if (className) {
    next.setAttribute("class", className);
  }

  if (style) {
    next.setAttribute("style", style);
  }

  return next;
}

/**
 * TipTap paste often yields one very tall <p>. Pagination only used to split
 * between sibling blocks, so overflow stayed on page 1 with hidden clipping.
 */
function splitOversizedBlock(
  block: HTMLElement,
  maxHeightPx: number,
  measureHost: HTMLElement,
): HTMLElement[] {
  const words = (block.textContent ?? "").split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [block];
  }

  const parts: HTMLElement[] = [];
  let start = 0;

  while (start < words.length) {
    let low = start + 1;
    let high = words.length;
    let best = start + 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const trial = cloneBlockShell(block);
      trial.textContent = words.slice(start, mid).join(" ");
      measureHost.innerHTML = "";
      measureHost.appendChild(trial);

      if (measureHtmlHeight(measureHost) <= maxHeightPx) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (best <= start) {
      best = start + 1;
    }

    const part = cloneBlockShell(block);
    part.textContent = words.slice(start, best).join(" ");
    parts.push(part);
    start = best;
  }

  return parts.length > 0 ? parts : [block];
}

function expandBlocksForPagination(blocks: Node[], maxHeightPx: number, measureHost: HTMLElement) {
  const expanded: Node[] = [];

  for (const block of blocks) {
    if (!isSplittableBlock(block)) {
      expanded.push(block);
      continue;
    }

    measureHost.innerHTML = "";
    measureHost.appendChild(block.cloneNode(true));

    if (measureHtmlHeight(measureHost) <= maxHeightPx) {
      expanded.push(block);
      continue;
    }

    expanded.push(...splitOversizedBlock(block, maxHeightPx, measureHost));
  }

  measureHost.innerHTML = "";
  return expanded;
}

export type PaginateDocumentHtmlOptions = {
  maxHeightPx?: number;
  contentWidthPx?: number;
  measureClassName?: string;
};

export type PaginatedDocumentPage = {
  html: string;
  startBlockIndex: number;
  endBlockIndex: number;
  startOffsetPx: number;
};

function resolveOptions(
  optionsOrMaxHeight: PaginateDocumentHtmlOptions | number = {},
  legacyContentWidthPx?: number,
): Required<PaginateDocumentHtmlOptions> {
  const options: PaginateDocumentHtmlOptions =
    typeof optionsOrMaxHeight === "number"
      ? {
          maxHeightPx: optionsOrMaxHeight,
          contentWidthPx: legacyContentWidthPx,
        }
      : optionsOrMaxHeight;

  return {
    maxHeightPx: options.maxHeightPx ?? PRINT_BODY_CONTENT_HEIGHT_PX,
    contentWidthPx: options.contentWidthPx ?? PRINT_CONTENT_WIDTH_PX,
    measureClassName: options.measureClassName ?? DOCUMENT_PAGINATION_MEASURE_CLASS_NAME,
  };
}

export function paginateDocumentPages(
  html: string,
  optionsOrMaxHeight: PaginateDocumentHtmlOptions | number = {},
  legacyContentWidthPx?: number,
): PaginatedDocumentPage[] {
  const { maxHeightPx, contentWidthPx, measureClassName } = resolveOptions(
    optionsOrMaxHeight,
    legacyContentWidthPx,
  );

  if (typeof document === "undefined") {
    return [
      {
        html: normalizeDocumentHtml(html),
        startBlockIndex: 0,
        endBlockIndex: 1,
        startOffsetPx: 0,
      },
    ];
  }

  const normalizedHtml = normalizeDocumentHtml(html);
  const measureHost = document.createElement("div");
  measureHost.className = measureClassName;
  measureHost.style.cssText = [
    "position:absolute",
    "left:-10000px",
    "top:0",
    "visibility:hidden",
    `width:${contentWidthPx}px`,
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(measureHost);

  const source = document.createElement("div");
  source.innerHTML = normalizedHtml;
  const rawBlocks = Array.from(source.childNodes).filter(
    (node) => node.nodeType === Node.ELEMENT_NODE || node.textContent?.trim(),
  );
  const blocks = expandBlocksForPagination(rawBlocks, maxHeightPx, measureHost);

  const pages: Array<Omit<PaginatedDocumentPage, "startOffsetPx">> = [];
  let currentPage = document.createElement("div");
  let pageStartBlockIndex = 0;
  let blockIndex = 0;

  function pageHeight() {
    return measureHtmlHeight(measureHost);
  }

  function syncMeasureFromCurrentPage() {
    measureHost.innerHTML = "";
    for (const child of Array.from(currentPage.childNodes)) {
      measureHost.appendChild(child.cloneNode(true));
    }
  }

  function flushPage(endBlockIndex: number) {
    if (currentPage.childNodes.length === 0) {
      return;
    }

    pages.push({
      html: currentPage.innerHTML,
      startBlockIndex: pageStartBlockIndex,
      endBlockIndex,
    });
    pageStartBlockIndex = endBlockIndex;
    currentPage = document.createElement("div");
    measureHost.innerHTML = "";
  }

  for (const block of blocks) {
    const candidate = block.cloneNode(true);
    currentPage.appendChild(candidate);
    syncMeasureFromCurrentPage();

    if (pageHeight() > maxHeightPx && currentPage.childNodes.length > 1) {
      currentPage.removeChild(candidate);
      syncMeasureFromCurrentPage();
      flushPage(blockIndex);
      currentPage.appendChild(candidate.cloneNode(true));
      syncMeasureFromCurrentPage();
    }

    blockIndex += 1;
  }

  flushPage(blockIndex);

  // Measure preceding block height so the editor overlay translateY matches the
  // paginated layout (including synthetic splits for oversized paragraphs).
  const pagesWithOffsets: PaginatedDocumentPage[] = pages.map((page) => {
    measureHost.innerHTML = "";
    for (let index = 0; index < page.startBlockIndex; index += 1) {
      const block = blocks[index];
      if (block) {
        measureHost.appendChild(block.cloneNode(true));
      }
    }

    return {
      ...page,
      startOffsetPx: page.startBlockIndex === 0 ? 0 : pageHeight(),
    };
  });

  document.body.removeChild(measureHost);

  const printablePages = pagesWithOffsets.filter((page) => hasPrintablePageHtml(page.html));

  return printablePages.length > 0
    ? printablePages
    : [
        {
          html: "<p><br></p>",
          startBlockIndex: 0,
          endBlockIndex: 1,
          startOffsetPx: 0,
        },
      ];
}

function hasPrintablePageHtml(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html.trim();

  if (container.childNodes.length === 0) {
    return false;
  }

  return Array.from(container.childNodes).some((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return Boolean(node.textContent?.trim());
    }

    if (!(node instanceof HTMLElement)) {
      return false;
    }

    const media = node.querySelector("img, table, hr, svg");
    if (media) {
      return true;
    }

    return Boolean(node.textContent?.trim()) || node.querySelector("br") !== null;
  });
}

export function paginateDocumentHtml(
  html: string,
  optionsOrMaxHeight: PaginateDocumentHtmlOptions | number = {},
  legacyContentWidthPx?: number,
) {
  return paginateDocumentPages(html, optionsOrMaxHeight, legacyContentWidthPx).map(
    (page) => page.html,
  );
}
