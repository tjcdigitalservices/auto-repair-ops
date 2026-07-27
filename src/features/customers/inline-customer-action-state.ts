import type { CustomerOption } from "@/features/customers/types";

export type InlineCustomerCreateActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  data?: CustomerOption;
};

export const INITIAL_INLINE_CUSTOMER_CREATE_ACTION_STATE: InlineCustomerCreateActionState = {
  status: "idle",
};
