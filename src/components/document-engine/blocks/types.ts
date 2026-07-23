import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type DocumentBlockRenderProps = {
  selected?: boolean;
  notesText?: string;
  onNotesTextChange?: (value: string) => void;
};

export type DocumentBlockDefinition = {
  id: string;
  label: string;
  icon: LucideIcon;
  RenderComponent: ComponentType<DocumentBlockRenderProps>;
};
