export {
  DEFAULT_DOCUMENT_BODY,
  DEFAULT_DOCUMENT_BODY_HTML,
  DEFAULT_DOCUMENT_TITLE,
  DOCUMENT_EDITOR_PLACEHOLDER,
  DOCUMENT_ZOOM_OPTIONS,
  FONT_FAMILIES,
  FONT_SIZES,
  PRINT_BODY_CONTENT_HEIGHT_PX,
  PRINT_CONTENT_WIDTH_PX,
  PRINT_HORIZONTAL_PADDING_PX,
  PRINT_PAGE_HEIGHT_PX,
  PRINT_PAGE_WIDTH_PX,
} from "@/components/reports/document-composer/constants";
export type { DocumentZoomMode } from "@/components/reports/document-composer/constants";

export { createDocumentEditorExtensions } from "@/components/reports/document-composer/create-document-editor-extensions";
export { DocumentComposer } from "@/components/reports/document-composer/document-composer";
export { DocumentHeaderActions, DocumentActions } from "@/components/reports/document-composer/document-header-actions";
export { DocumentEditorProvider, useDocumentEditorContext } from "@/components/reports/document-composer/document-editor-context";
export { DocumentPage, DocumentPageStack } from "@/components/reports/document-composer/document-page";
export { DocumentToolbar, FormatToolbar } from "@/components/reports/document-composer/document-toolbar";
export { DocumentViewport } from "@/components/reports/document-composer/document-viewport";
export { DocumentZoom } from "@/components/reports/document-composer/document-zoom";
export { FontSize } from "@/components/reports/document-composer/extensions/font-size-extension";
export { Indent } from "@/components/reports/document-composer/extensions/indent-extension";
export type { DocumentBusinessProfile, DocumentComposerProps } from "@/components/reports/document-composer/types";

/** @deprecated Use DocumentZoomMode from document-composer */
export type PreviewZoomMode = import("@/components/reports/document-composer/constants").DocumentZoomMode;

/** @deprecated Use DOCUMENT_ZOOM_OPTIONS from document-composer */
export { DOCUMENT_ZOOM_OPTIONS as PREVIEW_ZOOM_OPTIONS } from "@/components/reports/document-composer/constants";
