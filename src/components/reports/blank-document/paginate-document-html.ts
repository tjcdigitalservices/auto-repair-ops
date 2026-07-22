import {
  PRINT_BODY_CONTENT_HEIGHT_PX,
  PRINT_CONTENT_WIDTH_PX,
} from "@/components/reports/blank-document/constants";

function normalizeDocumentHtml(html: string) {
  const trimmed = html.trim();

  if (!trimmed || trimmed === "<p></p>") {
    return "<p><br></p>";
  }

  return trimmed;
}

export function paginateDocumentHtml(
  html: string,
  maxHeightPx = PRINT_BODY_CONTENT_HEIGHT_PX,
  contentWidthPx = PRINT_CONTENT_WIDTH_PX,
) {
  if (typeof document === "undefined") {
    return [normalizeDocumentHtml(html)];
  }

  const normalizedHtml = normalizeDocumentHtml(html);
  const measureHost = document.createElement("div");
  measureHost.className = "blank-document-body-content";
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
  const blocks = Array.from(source.childNodes).filter(
    (node) => node.nodeType === Node.ELEMENT_NODE || node.textContent?.trim(),
  );

  const pages: string[] = [];
  let currentPage = document.createElement("div");
  let currentHeight = 0;

  function measureBlock(node: Node) {
    measureHost.innerHTML = "";
    measureHost.appendChild(node.cloneNode(true));
    const measuredHeight = measureHost.offsetHeight || measureHost.scrollHeight;

    return Math.max(measuredHeight, 1);
  }

  function flushPage() {
    if (currentPage.childNodes.length === 0) {
      return;
    }

    pages.push(currentPage.innerHTML);
    currentPage = document.createElement("div");
    currentHeight = 0;
  }

  for (const block of blocks) {
    const blockHeight = measureBlock(block);

    if (currentHeight + blockHeight > maxHeightPx && currentPage.childNodes.length > 0) {
      flushPage();
    }

    currentPage.appendChild(block.cloneNode(true));
    currentHeight += blockHeight;
  }

  flushPage();
  document.body.removeChild(measureHost);

  return pages.length > 0 ? pages : ["<p><br></p>"];
}
