import { DEFAULT_DOCUMENT_BLOCKS } from "@/components/document-engine/blocks/definitions";
import type { DocumentBlockDefinition } from "@/components/document-engine/blocks/types";

const blockRegistry = new Map<string, DocumentBlockDefinition>(
  DEFAULT_DOCUMENT_BLOCKS.map((definition) => [definition.id, definition]),
);

export function registerDocumentBlock(definition: DocumentBlockDefinition) {
  blockRegistry.set(definition.id, definition);
}

export function registerDocumentBlocks(definitions: DocumentBlockDefinition[]) {
  definitions.forEach(registerDocumentBlock);
}

export function getDocumentBlock(blockId: string) {
  return blockRegistry.get(blockId);
}

export function listDocumentBlocks() {
  return Array.from(blockRegistry.values());
}

export function listInsertableDocumentBlocks() {
  return listDocumentBlocks().filter((block) =>
    ["customer-information", "vehicle-information", "company-information", "notes"].includes(block.id),
  );
}

export { DEFAULT_DOCUMENT_BLOCKS };
