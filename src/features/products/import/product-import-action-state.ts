import {
  INITIAL_FORM_ACTION_STATE,
  type FormActionState,
} from "@/lib/forms";

export type ProductImportActionState = FormActionState & {
  created?: number;
  updated?: number;
  stocksUpserted?: number;
  skippedInvalid?: number;
  errorSamples?: Array<{ rowNumber: number; message: string }>;
};

export const INITIAL_PRODUCT_IMPORT_ACTION_STATE: ProductImportActionState =
  INITIAL_FORM_ACTION_STATE;
