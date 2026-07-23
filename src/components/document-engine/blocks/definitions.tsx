"use client";

import { Building2, Car, ImageIcon, Minus, PenLine, StickyNote, User } from "lucide-react";

import { MergeVariableChip } from "@/components/document-engine/variables/merge-variable-chip";
import type { DocumentBlockDefinition } from "@/components/document-engine/blocks/types";
import { cn } from "@/lib/utils";

function BlockShell({
  title,
  selected,
  children,
}: {
  title: string;
  selected?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "document-block rounded-lg border border-border/80 bg-muted/20 p-3",
        selected && "ring-2 ring-primary/30",
      )}
      contentEditable={false}
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ label, variableId }: { label: string; variableId: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5 text-[11px]">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <MergeVariableChip variableId={variableId} />
    </div>
  );
}

export function CustomerInformationBlock({ selected }: { selected?: boolean }) {
  return (
    <BlockShell title="Customer Information" selected={selected}>
      <InfoRow label="Name" variableId="customer.name" />
      <InfoRow label="Phone" variableId="customer.phone" />
      <InfoRow label="Email" variableId="customer.email" />
      <InfoRow label="Address" variableId="customer.address" />
    </BlockShell>
  );
}

export function VehicleInformationBlock({ selected }: { selected?: boolean }) {
  return (
    <BlockShell title="Vehicle Information" selected={selected}>
      <InfoRow label="Make" variableId="vehicle.make" />
      <InfoRow label="Model" variableId="vehicle.model" />
      <InfoRow label="Plate No." variableId="vehicle.plateNumber" />
      <InfoRow label="VIN" variableId="vehicle.vin" />
    </BlockShell>
  );
}

export function CompanyInformationBlock({ selected }: { selected?: boolean }) {
  return (
    <BlockShell title="Company Information" selected={selected}>
      <InfoRow label="Name" variableId="company.name" />
      <InfoRow label="Address" variableId="company.address" />
      <InfoRow label="Phone" variableId="company.phone" />
      <InfoRow label="Email" variableId="company.email" />
      <InfoRow label="VAT No." variableId="company.vatNumber" />
    </BlockShell>
  );
}

export function NotesBlock({
  selected,
  notesText = "",
  onNotesTextChange,
}: {
  selected?: boolean;
  notesText?: string;
  onNotesTextChange?: (value: string) => void;
}) {
  return (
    <BlockShell title="Notes" selected={selected}>
      <textarea
        value={notesText}
        onChange={(event) => onNotesTextChange?.(event.target.value)}
        placeholder="Add notes here…"
        rows={3}
        className="w-full resize-y rounded-md border border-border/70 bg-background px-2 py-1.5 text-[11px] leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
      />
    </BlockShell>
  );
}

export function DividerBlock({ selected }: { selected?: boolean }) {
  return (
    <div className={cn("document-block py-2", selected && "ring-2 ring-primary/30")} contentEditable={false}>
      <hr className="border-t border-border/80" />
    </div>
  );
}

export function SignatureBlock({ selected }: { selected?: boolean }) {
  return (
    <BlockShell title="Signature" selected={selected}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 h-10 border-b border-border/80" />
          <p className="text-[10px] text-muted-foreground">Authorized signature</p>
        </div>
        <div>
          <div className="mb-1 h-10 border-b border-border/80" />
          <p className="text-[10px] text-muted-foreground">Date</p>
        </div>
      </div>
    </BlockShell>
  );
}

export function ImagePlaceholderBlock({ selected }: { selected?: boolean }) {
  return (
    <div
      className={cn(
        "document-block flex h-28 items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/10",
        selected && "ring-2 ring-primary/30",
      )}
      contentEditable={false}
    >
      <div className="text-center">
        <ImageIcon className="mx-auto mb-1 size-5 text-muted-foreground" />
        <p className="text-[11px] font-medium text-muted-foreground">Image placeholder</p>
      </div>
    </div>
  );
}

export const DEFAULT_DOCUMENT_BLOCKS: DocumentBlockDefinition[] = [
  {
    id: "customer-information",
    label: "Customer Information",
    icon: User,
    RenderComponent: CustomerInformationBlock,
  },
  {
    id: "vehicle-information",
    label: "Vehicle Information",
    icon: Car,
    RenderComponent: VehicleInformationBlock,
  },
  {
    id: "company-information",
    label: "Company Information",
    icon: Building2,
    RenderComponent: CompanyInformationBlock,
  },
  {
    id: "notes",
    label: "Notes",
    icon: StickyNote,
    RenderComponent: NotesBlock,
  },
  {
    id: "divider",
    label: "Divider",
    icon: Minus,
    RenderComponent: DividerBlock,
  },
  {
    id: "signature",
    label: "Signature",
    icon: PenLine,
    RenderComponent: SignatureBlock,
  },
  {
    id: "image-placeholder",
    label: "Image Placeholder",
    icon: ImageIcon,
    RenderComponent: ImagePlaceholderBlock,
  },
];
