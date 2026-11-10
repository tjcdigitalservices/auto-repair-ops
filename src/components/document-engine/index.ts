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
} from "@/components/document-engine/constants";
export type { DocumentZoomMode } from "@/components/document-engine/constants";

export { createDocumentEditorExtensions } from "@/components/document-engine/create-document-editor-extensions";
export { DocumentComposer } from "@/components/document-engine/document-composer";
export { DocumentBody } from "@/components/document-engine/document-body";
export { DocumentFooter } from "@/components/document-engine/document-footer";
export { DocumentHeader } from "@/components/document-engine/document-header";
export {
  DocumentHeaderActions,
  DocumentActions,
  DocumentHeaderActions as DocumentActionToolbar,
} from "@/components/document-engine/document-header-actions";
export { DocumentPage } from "@/components/document-engine/document-page";
export { DocumentToolbar, FormatToolbar } from "@/components/document-engine/document-toolbar";
export { DocumentViewport } from "@/components/document-engine/document-viewport";
export {
  DocumentEditorProvider,
  useDocumentEditorContext,
} from "@/components/document-engine/hooks/document-editor-context";
export { useDocumentEditor } from "@/components/document-engine/hooks/use-document-editor";
export { useDocumentViewportScale } from "@/components/document-engine/hooks/use-document-viewport-scale";
export { BlankDocumentPage } from "@/components/document-engine/templates/blank-document-page";
export { DocumentTemplatePage } from "@/components/document-engine/templates/document-template-page";
export {
  getDocumentTemplate,
  listDocumentTemplates,
  DOCUMENT_TEMPLATES,
} from "@/components/document-engine/templates/registry";
export { blankDocumentTemplate } from "@/components/document-engine/templates/blank";
export { quotationDocumentTemplate } from "@/components/document-engine/templates/quotation";
export { invoiceDocumentTemplate } from "@/components/document-engine/templates/invoice";
export { jobOrderDocumentTemplate } from "@/components/document-engine/templates/job-order";
export { receiptDocumentTemplate } from "@/components/document-engine/templates/receipt";
export { createBrandedDocumentTemplate } from "@/components/document-engine/templates/create-branded-template";
export { DEFAULT_A4_PAGE_LAYOUT } from "@/components/document-engine/templates/types";
export { DocumentSaveStatusBadge } from "@/components/document-engine/document-save-status";
export {
  EMPTY_DOCUMENT_JSON,
  createDefaultDocumentJson,
  normalizeDocumentJson,
  isDocumentJson,
} from "@/components/document-engine/persistence/document-content";
export type {
  DocumentRecord,
  DocumentSaveStatus,
  DocumentStatus,
  DocumentListItem,
  SaveDocumentInput,
  SaveDocumentResult,
} from "@/components/document-engine/persistence/types";
export { DocumentBlockExtension } from "@/components/document-engine/blocks/document-block-extension";
export {
  registerDocumentBlock,
  registerDocumentBlocks,
  getDocumentBlock,
  listDocumentBlocks,
  listInsertableDocumentBlocks,
  DEFAULT_DOCUMENT_BLOCKS,
} from "@/components/document-engine/blocks/registry";
export type {
  DocumentBlockDefinition,
  DocumentBlockRenderProps,
} from "@/components/document-engine/blocks/types";
export { DocumentInsertMenu } from "@/components/document-engine/insert/document-insert-menu";
export {
  registerInsertMenuItem,
  listInsertMenuItems,
} from "@/components/document-engine/insert/registry";
export type {
  InsertMenuAction,
  InsertMenuGroup,
  InsertMenuItem,
} from "@/components/document-engine/insert/registry";
export { MergeVariableExtension } from "@/components/document-engine/variables/merge-variable-extension";
export { MergeVariableChip } from "@/components/document-engine/variables/merge-variable-chip";
export {
  registerMergeVariable,
  registerMergeVariables,
  getMergeVariable,
  listMergeVariables,
  listMergeVariableGroups,
} from "@/components/document-engine/variables/registry";
export type {
  MergeVariableDefinition,
  MergeVariableRenderProps,
} from "@/components/document-engine/variables/types";
export { DocumentPaginatedPages } from "@/components/document-engine/document-paginated-pages";
export {
  paginateDocumentHtml,
  paginateDocumentPages,
} from "@/components/document-engine/page-manager/paginate-document-html";
export type { PaginatedDocumentPage } from "@/components/document-engine/page-manager/paginate-document-html";
export {
  findPageIndexForBlockIndex,
  focusDocumentPageAtClick,
  getDocumentBlockIndexAtPos,
  getDocumentBlockStartPos,
  resolveDocumentPosForPageClick,
} from "@/components/document-engine/page-manager/document-page-editing";
export { createPageManager } from "@/components/document-engine/page-manager/page-manager";
export { buildDocumentPageContext } from "@/components/document-engine/page-manager/build-document-page-context";
export { usePageManager } from "@/components/document-engine/page-manager/use-page-manager";
export { useDocumentBodyHeight } from "@/components/document-engine/page-manager/use-document-body-height";
export { FontSize } from "@/components/document-engine/extensions/font-size-extension";
export { Indent } from "@/components/document-engine/extensions/indent-extension";
export type {
  BlankDocumentPageProps,
  DocumentBusinessProfile,
  DocumentComposerProps,
  DocumentFooterProps,
  DocumentHeaderProps,
  DocumentPageProps,
  DocumentTemplateName,
  DocumentTemplateDefinition,
  DocumentTemplateContext,
  DocumentPageLayout,
} from "@/components/document-engine/types";

/** @deprecated Use DocumentZoomMode from document-engine */
export type PreviewZoomMode = import("@/components/document-engine/constants").DocumentZoomMode;

/** @deprecated Use DOCUMENT_ZOOM_OPTIONS from document-engine */
export { DOCUMENT_ZOOM_OPTIONS as PREVIEW_ZOOM_OPTIONS } from "@/components/document-engine/constants";

/** @deprecated Use DocumentPageStack from print layout if needed */
export { PrintPageStack as DocumentPageStack } from "@/components/reports/print-document-layout";
