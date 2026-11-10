import {
  paginateDocumentPages,
  type PaginateDocumentHtmlOptions,
  type PaginatedDocumentPage,
} from "@/components/document-engine/page-manager/paginate-document-html";

export type DocumentPageSlice = PaginatedDocumentPage & {
  index: number;
};

export type PageManagerSnapshot = {
  pages: DocumentPageSlice[];
  pageCount: number;
};

export class PageManager {
  private pages: DocumentPageSlice[] = [
    {
      index: 0,
      html: "<p><br></p>",
      startBlockIndex: 0,
      endBlockIndex: 1,
      startOffsetPx: 0,
    },
  ];

  paginate(html: string, options?: PaginateDocumentHtmlOptions): PageManagerSnapshot {
    this.pages = paginateDocumentPages(html, options).map((page, index) => ({
      ...page,
      index,
    }));

    return this.getSnapshot();
  }

  getSnapshot(): PageManagerSnapshot {
    return {
      pages: this.pages,
      pageCount: this.pages.length,
    };
  }
}

export function createPageManager() {
  return new PageManager();
}
