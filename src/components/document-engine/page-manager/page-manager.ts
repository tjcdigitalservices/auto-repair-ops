import { paginateDocumentHtml, type PaginateDocumentHtmlOptions } from "@/components/document-engine/page-manager/paginate-document-html";

export type DocumentPageSlice = {
  index: number;
  html: string;
};

export type PageManagerSnapshot = {
  pages: DocumentPageSlice[];
  pageCount: number;
};

export class PageManager {
  private pages: DocumentPageSlice[] = [{ index: 0, html: "<p><br></p>" }];

  paginate(html: string, options?: PaginateDocumentHtmlOptions): PageManagerSnapshot {
    const htmlPages = paginateDocumentHtml(html, options);
    this.pages = htmlPages.map((pageHtml, index) => ({
      index,
      html: pageHtml,
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
