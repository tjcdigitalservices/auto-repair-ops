import type { FormActionState } from "@/lib/forms";

export type SpreadsheetImportActionState = FormActionState & {
  created?: number;
  updated?: number;
  skippedInvalid?: number;
  errorSamples?: Array<{ rowNumber: number; message: string }>;
};

export const INITIAL_SPREADSHEET_IMPORT_ACTION_STATE: SpreadsheetImportActionState = {
  status: "idle",
};
