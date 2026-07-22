export const DEFAULT_DOCUMENT_TITLE = "BLANK DOCUMENT";
export const DEFAULT_DOCUMENT_BODY = "This area is reserved for future document content.";
export const DEFAULT_DOCUMENT_BODY_HTML = `<p>${DEFAULT_DOCUMENT_BODY}</p>`;

export const PRINT_PAGE_WIDTH_PX = (210 * 96) / 25.4;
export const PRINT_PAGE_HEIGHT_PX = (297 * 96) / 25.4;
export const PRINT_HORIZONTAL_PADDING_PX = (8 * 96) / 25.4;
export const PRINT_CONTENT_WIDTH_PX = PRINT_PAGE_WIDTH_PX - PRINT_HORIZONTAL_PADDING_PX * 2;
export const PRINT_BODY_CONTENT_HEIGHT_PX = 780;

export const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Courier New", value: '"Courier New", monospace' },
] as const;

export const FONT_SIZES = [
  { label: "10", value: "10pt" },
  { label: "11", value: "11pt" },
  { label: "12", value: "12pt" },
  { label: "14", value: "14pt" },
  { label: "16", value: "16pt" },
  { label: "18", value: "18pt" },
  { label: "24", value: "24pt" },
] as const;

export type PreviewZoomMode = "fit" | 0.75 | 1 | 1.25;

export const PREVIEW_ZOOM_OPTIONS: Array<{ value: PreviewZoomMode; label: string }> = [
  { value: "fit", label: "Fit" },
  { value: 0.75, label: "75%" },
  { value: 1, label: "100%" },
  { value: 1.25, label: "125%" },
];
