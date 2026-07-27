import { z } from "zod";

export const inlineCustomerCreateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  contactNumber: z.string().trim().min(1, "Mobile number is required."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .or(z.literal(""))
    .transform((value) => value.trim()),
  address: z.string().trim(),
  notes: z.string().trim(),
});

export type InlineCustomerCreateValues = z.infer<typeof inlineCustomerCreateSchema>;

export function parseInlineCustomerCreateFormData(formData: FormData): InlineCustomerCreateValues {
  return {
    firstName: readString(formData, "firstName"),
    lastName: readString(formData, "lastName"),
    contactNumber: readString(formData, "contactNumber"),
    email: readString(formData, "email"),
    address: readString(formData, "address"),
    notes: readString(formData, "notes"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
