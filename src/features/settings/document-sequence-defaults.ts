import type { SettingsDocumentSequenceKey } from "@/features/settings/types";

export const SETTINGS_DOCUMENT_SEQUENCE_DEFAULTS: ReadonlyArray<{
  key: SettingsDocumentSequenceKey;
  prefix: string;
  padding: number;
  last_value: number;
}> = [
  { key: "quotation", prefix: "QT-", padding: 4, last_value: 0 },
  { key: "job_order", prefix: "JO-", padding: 4, last_value: 0 },
  { key: "invoice", prefix: "INV-", padding: 4, last_value: 0 },
  { key: "sale", prefix: "POS-", padding: 4, last_value: 0 },
];

/** Includes staff codes — used when provisioning a branch. */
export const BRANCH_DOCUMENT_SEQUENCE_DEFAULTS: ReadonlyArray<{
  key: string;
  prefix: string;
  padding: number;
  last_value: number;
}> = [
  ...SETTINGS_DOCUMENT_SEQUENCE_DEFAULTS,
  { key: "staff", prefix: "EMP-", padding: 4, last_value: 0 },
];
