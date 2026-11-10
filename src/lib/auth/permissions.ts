import type { Database } from "@/types/database";

export type StaffRole = Database["public"]["Enums"]["staff_role"];

export type AppCapability =
  | "dashboard:view"
  | "customers:read"
  | "customers:write"
  | "vehicles:read"
  | "vehicles:write"
  | "quotations:read"
  | "quotations:write"
  | "bookings:read"
  | "bookings:write"
  | "job_orders:read"
  | "job_orders:write"
  | "inventory:read"
  | "inventory:write"
  | "products:read"
  | "products:write"
  | "services:read"
  | "services:write"
  | "suppliers:read"
  | "suppliers:write"
  | "invoices:read"
  | "invoices:write"
  | "payments:read"
  | "payments:write"
  | "pos:read"
  | "pos:write"
  | "staff:read"
  | "staff:write"
  | "attendance:read"
  | "attendance:write"
  | "payroll:read"
  | "payroll:write"
  | "reports:read"
  | "documents:read"
  | "documents:write"
  | "settings:read"
  | "settings:write";

const ALL_CAPABILITIES: readonly AppCapability[] = [
  "dashboard:view",
  "customers:read",
  "customers:write",
  "vehicles:read",
  "vehicles:write",
  "quotations:read",
  "quotations:write",
  "bookings:read",
  "bookings:write",
  "job_orders:read",
  "job_orders:write",
  "inventory:read",
  "inventory:write",
  "products:read",
  "products:write",
  "services:read",
  "services:write",
  "suppliers:read",
  "suppliers:write",
  "invoices:read",
  "invoices:write",
  "payments:read",
  "payments:write",
  "pos:read",
  "pos:write",
  "staff:read",
  "staff:write",
  "attendance:read",
  "attendance:write",
  "payroll:read",
  "payroll:write",
  "reports:read",
  "documents:read",
  "documents:write",
  "settings:read",
  "settings:write",
] as const;

export const ROLE_CAPABILITIES: Record<StaffRole, readonly AppCapability[]> = {
  owner: ALL_CAPABILITIES,
  admin: ALL_CAPABILITIES,
  service_advisor: [
    "dashboard:view",
    "customers:read",
    "customers:write",
    "vehicles:read",
    "vehicles:write",
    "quotations:read",
    "quotations:write",
    "bookings:read",
    "bookings:write",
    "job_orders:read",
    "job_orders:write",
    "inventory:read",
    "products:read",
    "services:read",
    "services:write",
    "suppliers:read",
    "invoices:read",
    "invoices:write",
    "payments:read",
    "payments:write",
    "reports:read",
    "documents:read",
    "documents:write",
  ],
  mechanic: [
    "dashboard:view",
    "job_orders:read",
    "job_orders:write",
    "inventory:read",
    "products:read",
    "services:read",
    "documents:read",
  ],
  cashier: [
    "dashboard:view",
    "customers:read",
    "vehicles:read",
    "bookings:read",
    "products:read",
    "invoices:read",
    "payments:read",
    "payments:write",
    "pos:read",
    "pos:write",
    "documents:read",
  ],
  inventory_staff: [
    "dashboard:view",
    "inventory:read",
    "inventory:write",
    "products:read",
    "products:write",
    "suppliers:read",
    "suppliers:write",
    "documents:read",
  ],
};

export function getRoleCapabilities(role: StaffRole): readonly AppCapability[] {
  return ROLE_CAPABILITIES[role];
}

export function hasCapability(role: StaffRole, capability: AppCapability) {
  return ROLE_CAPABILITIES[role].includes(capability);
}
