import type { StaffScheduleSummary } from "@/features/attendance/types";
import type { CustomerType } from "@/features/customers/types";
import type { InvoiceStatus, PaymentMethod } from "@/features/invoices/types";
import type { InventoryMovementType } from "@/features/inventory/types";
import type { JobOrderStatus } from "@/features/job-orders/types";
import type { PayBasis } from "@/features/payroll/types";
import type { PayrollAttendanceSourceRecord } from "@/features/payroll/types";
import type { ProductType } from "@/features/products/types";
import type { DocumentRecord } from "@/components/document-engine/persistence/types";
import type { QuotationItemType, QuotationStatus } from "@/features/quotations/types";
import type { StaffRole } from "@/features/staff/types";

export type SandboxRecordStatus = "active" | "inactive";

export type SandboxBranch = {
  id: string;
  code: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  isMain: boolean;
};

export type SandboxBusiness = {
  name: string;
  address: string;
  contact: string;
  email: string;
  vatRegistrationNo: string;
  receiptFooter: string;
  defaultTaxRate: string;
  logoDataUrl: string | null;
  markDataUrl: string | null;
  allowGlobalProductCatalog: boolean;
  allowGlobalServiceCatalog: boolean;
  allowPartialPayments: boolean;
  requireInvoiceBeforeJobCompletion: boolean;
  requireInvoiceBeforeVehicleRelease: boolean;
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
  requireAdditionalItemPreApproval: boolean;
  enableBarcodeSupport: boolean;
  enableShelfLocation: boolean;
  payrollStandardDailyHours: string;
  payrollHolidayPremiumRate: string;
  payrollDefaultSssAmount: string;
  payrollDefaultPhilhealthAmount: string;
  payrollDefaultPagibigAmount: string;
};

export type SandboxSequences = {
  customer: number;
  quotation: number;
  jobOrder: number;
  invoice: number;
  payment: number;
  staff: number;
  document: number;
  pos: number;
  payroll: number;
};

export type SandboxDocumentSequenceMeta = {
  key: "quotation" | "job_order" | "invoice" | "sale";
  prefix: string;
  padding: number;
};

export type SandboxShopSettings = {
  themePrimaryColor: string;
  themeAccentColor: string;
  websiteUrl: string;
  facebookUrl: string;
  facebookLabel: string;
  storeHours: Record<string, string>;
  documentSequences: SandboxDocumentSequenceMeta[];
};

export type SandboxCustomer = {
  id: string;
  customerCode: string | null;
  customerType: CustomerType;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: SandboxRecordStatus;
  linkedUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SandboxVehicle = {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number | null;
  plateNumber: string | null;
  vin: string | null;
  mileage: number | null;
  transmission: string | null;
  engineSize: string | null;
  variant: string | null;
  fuelType: string | null;
  color: string | null;
  status: SandboxRecordStatus;
  createdAt: string;
  updatedAt: string;
};

export type SandboxSupplier = {
  id: string;
  supplierName: string;
  contactPerson: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
  paymentTerms: string | null;
  notes: string | null;
  status: SandboxRecordStatus;
  createdAt: string;
  updatedAt: string;
};

export type SandboxProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  productType: ProductType;
  categoryName: string | null;
  brandName: string | null;
  unitId: string;
  unitLabel: string;
  supplierId: string | null;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  availableQuantity: number;
  shelfLocation: string | null;
  description: string | null;
  productImageUrl: string | null;
  websiteVisible: boolean;
  status: SandboxRecordStatus;
  createdAt: string;
  updatedAt: string;
};

export type SandboxStockMovement = {
  id: string;
  productId: string;
  movementType: InventoryMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType: string;
  notes: string | null;
  createdAt: string;
};

export type SandboxService = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  laborPrice: number;
  estimatedDurationMinutes: number | null;
  status: SandboxRecordStatus;
  createdAt: string;
  updatedAt: string;
};

export type SandboxLine = {
  id: string;
  parentId: string;
  itemType: QuotationItemType;
  productId: string | null;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isAdditional?: boolean;
  approvalStatus?: "not_required" | "pending" | "approved" | "rejected";
};

export type SandboxQuotation = {
  id: string;
  quotationNumber: string;
  customerId: string;
  vehicleId: string;
  status: QuotationStatus;
  discount: number;
  tax: number;
  subtotal: number;
  totalAmount: number;
  notes: string | null;
  natureOfRepair?: string | null;
  inspectionNotes?: string | null;
  createdAt: string;
  approvedAt: string | null;
};

export type SandboxMechanicAssignment = {
  id: string;
  staffId: string;
  taskDescription: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type SandboxJobOrder = {
  id: string;
  jobOrderNumber: string;
  quotationId: string | null;
  customerId: string;
  vehicleId: string;
  status: JobOrderStatus;
  customerConcern: string | null;
  inspectionNotes: string | null;
  diagnosis: string | null;
  workPerformed: string | null;
  mileageIn: number | null;
  mileageOut: number | null;
  assignedStaffId: string | null;
  mechanicAssignments?: SandboxMechanicAssignment[];
  completedChecklistItemIds?: string[];
  isHistorical?: boolean;
  serviceDate?: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  releasedAt: string | null;
};

export type SandboxPartUsage = {
  id: string;
  jobOrderId: string;
  jobOrderItemId?: string;
  productId: string;
  quantity: number;
  usageType?: "use" | "return";
  notes?: string | null;
  createdAt: string;
};

export type SandboxInvoice = {
  id: string;
  invoiceNumber: string;
  jobOrderId: string | null;
  customerId: string;
  vehicleId: string | null;
  source: "job_order" | "pos";
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  invoiceDate: string;
  createdAt: string;
  cancelledAt?: string | null;
  cancellationReason: string | null;
};

export type SandboxPayment = {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  paidAt: string;
};

export type SandboxPosSale = {
  id: string;
  saleNumber: string;
  invoiceId: string;
  customerId: string | null;
  totalAmount: number;
  createdAt: string;
};

export type SandboxStaff = {
  id: string;
  staffCode: string | null;
  firstName: string;
  lastName: string;
  documentTitle: string | null;
  role: StaffRole;
  isPayrollEligible: boolean;
  contactNumber: string | null;
  address: string | null;
  sssNumber: string | null;
  philhealthNumber: string | null;
  tinNumber: string | null;
  pagibigNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactNumber: string | null;
  status: SandboxRecordStatus;
  createdAt: string;
  updatedAt: string;
  schedule: StaffScheduleSummary | null;
  compensation: {
    payBasis: PayBasis;
    baseRate: number;
    overtimeRate: number | null;
    allowancePerPeriod: number;
    effectiveStartDate: string;
    exemptFromAttendance: boolean;
    useShopDefaultContributions: boolean;
    sssAmount: number | null;
    philhealthAmount: number | null;
    pagibigAmount: number | null;
    notes: string | null;
  } | null;
};

export type SandboxAttendance = {
  id: string;
  staffId: string;
  attendanceDate: string;
  status: PayrollAttendanceSourceRecord["status"];
  timeIn: string | null;
  timeOut: string | null;
  notes: string | null;
  approvedAt: string | null;
};

export type SandboxPayrollItem = {
  id: string;
  periodId: string;
  staffId: string;
  fullName: string;
  role: StaffRole;
  netPay: number;
  grossPay: number;
  basePay: number;
  presentCount: number;
  warningCodes: string[];
};

export type SandboxPayrollAdjustment = {
  id: string;
  periodId: string;
  staffId: string;
  adjustmentType: "addition" | "deduction";
  label: string;
  amount: number;
  notes: string | null;
  source: "manual" | "system_government";
  systemKey: "sss" | "philhealth" | "pagibig" | null;
  createdAt: string;
  updatedAt: string;
};

export type SandboxPayrollPeriod = {
  id: string;
  label: string;
  periodStartDate: string;
  periodEndDate: string;
  payoutDate: string;
  notes: string | null;
  status: "draft" | "processing" | "finalized";
  applyGovernmentDeductions: boolean;
  generatedAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SandboxDocument = DocumentRecord;

export type SandboxWebsitePost = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  status: "draft" | "published";
  createdAt: string;
};

export type SandboxQuoteRequest = {
  id: string;
  customerName: string;
  email: string;
  vehicle: string;
  concern: string;
  status: "new" | "reviewed" | "closed";
  createdAt: string;
};

export type SandboxVehicleMake = {
  id: string;
  name: string;
  status: SandboxRecordStatus;
  sortOrder: number;
};

export type SandboxVehicleModel = {
  id: string;
  makeId: string;
  name: string;
  status: SandboxRecordStatus;
  sortOrder: number;
};

export type SandboxLookupOption = {
  id: string;
  lookupType: "transmission" | "fuel_type" | "color";
  label: string;
  status: SandboxRecordStatus;
  sortOrder: number;
};

export type SandboxHoliday = {
  id: string;
  holidayDate: string;
  label: string;
  holidayKind: "branch_closure" | "public_holiday" | "company_holiday" | "special_non_working_day";
  payTreatment: "unpaid" | "paid_regular_day" | "custom";
  notes?: string | null;
};

export type SandboxAttendanceAccess = {
  requireShopIpForMechanicAttendance: boolean;
  requireShopLocationForMechanicAttendance: boolean;
  allowDtrAmendments: boolean;
  allowAttendanceAdminOverride: boolean;
  geofenceLatitude: string;
  geofenceLongitude: string;
  geofenceRadiusMeters: string;
};

export type SandboxAllowedIp = {
  id: string;
  ipAddress: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SandboxDtrAmendment = {
  id: string;
  staffId: string;
  attendanceDate: string;
  targetLogType: "time_in" | "time_out";
  amendmentType: "missed_time_in" | "missed_time_out" | "wrong_time" | "shop_network_issue" | "other";
  requestedTimestamp: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedIp: string | null;
  approvedTimestamp: string | null;
  approvedByStaffId: string | null;
  rejectedAt: string | null;
  rejectedByStaffId: string | null;
  finalTimestamp: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SandboxStaffDevice = {
  id: string;
  staffId: string;
  deviceName: string | null;
  userAgent: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  lastIp: string | null;
  status: "pending" | "approved" | "revoked";
  approvedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SandboxSnapshot = {
  version: 1;
  seedRevision: number;
  branch: SandboxBranch;
  business: SandboxBusiness;
  sequences: SandboxSequences;
  customers: SandboxCustomer[];
  vehicles: SandboxVehicle[];
  suppliers: SandboxSupplier[];
  products: SandboxProduct[];
  services: SandboxService[];
  quotations: SandboxQuotation[];
  quotationLines: SandboxLine[];
  jobOrders: SandboxJobOrder[];
  jobOrderLines: SandboxLine[];
  partUsage: SandboxPartUsage[];
  invoices: SandboxInvoice[];
  invoiceLines: SandboxLine[];
  payments: SandboxPayment[];
  posSales: SandboxPosSale[];
  staff: SandboxStaff[];
  attendance: SandboxAttendance[];
  payrollPeriods: SandboxPayrollPeriod[];
  payrollItems: SandboxPayrollItem[];
  payrollAdjustments: SandboxPayrollAdjustment[];
  documents: SandboxDocument[];
  websitePosts: SandboxWebsitePost[];
  quoteRequests: SandboxQuoteRequest[];
  vehicleMakes: SandboxVehicleMake[];
  vehicleModels: SandboxVehicleModel[];
  lookupOptions: SandboxLookupOption[];
  holidays: SandboxHoliday[];
  attendanceAccess?: SandboxAttendanceAccess;
  allowedIps?: SandboxAllowedIp[];
  staffDevices?: SandboxStaffDevice[];
  dtrAmendments?: SandboxDtrAmendment[];
  stockMovements?: SandboxStockMovement[];
  shopSettings?: SandboxShopSettings;
};
