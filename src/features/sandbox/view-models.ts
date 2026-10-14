import { DateTime } from "luxon";

import type {
  AttendanceCalendarDaySummary,
  AttendancePageData,
  AttendancePageFilters,
  AttendanceRecordSummary,
  AttendanceRosterData,
  AttendanceRosterItem,
  BranchHolidaySummary,
} from "@/features/attendance/types";
import {
  buildAttendanceSummary,
  getDefaultAttendanceDate,
  hasMissingTimeout,
  isAttendanceApproved,
  isScheduledWorkdayForDate,
  matchesAttendanceStatusFilter,
  matchesRosterStatusFilter,
  resolveAttendancePageFilters,
} from "@/features/attendance/utils";
import type { CustomerDetail, CustomerDocumentHistoryItem, CustomerListItem } from "@/features/customers/types";
import type { DashboardData } from "@/features/dashboard/queries/dashboard-queries";
import { mapQuotationDetailToFormValues } from "@/features/quotations/mappers";
import type {
  QuotationCreateFlowOptions,
  QuotationDetail,
  QuotationFormOptions,
  QuotationListItem,
  QuotationStatus,
} from "@/features/quotations/types";
import { canDeleteQuotation, canReviseQuotation } from "@/features/quotations/utils";
import { SANDBOX_IDS } from "@/features/sandbox/ids";
import type { StaffRole } from "@/lib/auth/permissions";
import { buildRevenueTrend, buildTrendBuckets } from "@/features/reports/utils";
import { customerName, vehicleLabel } from "@/features/sandbox/records";
import type { SandboxSnapshot } from "@/features/sandbox/types";

const ZONE = "Asia/Manila";
const ACTIVE_JOB_STATUSES = new Set([
  "pending",
  "in_progress",
  "waiting_for_parts",
  "waiting_for_customer_approval",
  "ready_for_billing",
]);

export function toCustomerListItem(customer: SandboxSnapshot["customers"][number]): CustomerListItem {
  return {
    id: customer.id,
    customerCode: customer.customerCode,
    customerType: customer.customerType,
    displayName: customer.displayName,
    contactNumber: customer.contactNumber,
    email: customer.email,
    status: customer.status,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

export function toCustomerDetail(snapshot: SandboxSnapshot, customerId: string): CustomerDetail | null {
  const customer = snapshot.customers.find((item) => item.id === customerId);
  if (!customer) return null;

  const vehicles = snapshot.vehicles.filter((item) => item.customerId === customerId);
  return {
    ...toCustomerListItem(customer),
    firstName: customer.firstName,
    lastName: customer.lastName,
    companyName: customer.companyName,
    address: customer.address,
    notes: customer.notes,
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      plateNumber: vehicle.plateNumber,
      vin: vehicle.vin,
      status: vehicle.status,
    })),
    documentHistory: documentHistory(snapshot, customerId),
  };
}

export function toDashboardData(snapshot: SandboxSnapshot): DashboardData {
  const now = DateTime.now().setZone(ZONE);
  const buckets = buildTrendBuckets({
    from: now.minus({ months: 5 }).startOf("month").toISODate() ?? now.toISODate() ?? "",
    to: now.endOf("month").toISODate() ?? "",
    groupBy: "monthly",
  });
  const trend = buildRevenueTrend({
    buckets,
    approvedQuotations: snapshot.quotations.filter((item) => item.status === "approved" && item.approvedAt),
    releases: snapshot.jobOrders.filter((item) => item.releasedAt),
    getApprovedDate: (row) => row.approvedAt ?? row.createdAt,
    getApprovedAmount: (row) => row.totalAmount,
    getReleaseDate: (row) => row.releasedAt ?? row.createdAt,
  });
  const invoiceTrend = buildRevenueTrend({
    buckets,
    approvedQuotations: snapshot.invoices.filter((item) => item.status !== "cancelled"),
    releases: snapshot.jobOrders.filter((item) => item.releasedAt),
    getApprovedDate: (row) => row.createdAt,
    getApprovedAmount: (row) => row.totalAmount,
    getReleaseDate: (row) => row.releasedAt ?? row.createdAt,
  });

  return {
    metrics: {
      totalCustomers: snapshot.customers.filter((item) => item.status === "active").length,
      totalVehicles: snapshot.vehicles.filter((item) => item.status === "active").length,
      pendingQuotations: snapshot.quotations.filter((item) => item.status === "draft" || item.status === "pending_approval").length,
      activeJobOrders: snapshot.jobOrders.filter((item) => ACTIVE_JOB_STATUSES.has(item.status)).length,
      lowStockItems: snapshot.products.filter((item) => item.availableQuantity <= item.reorderLevel).length,
      unpaidInvoices: snapshot.invoices.filter((item) => item.balance > 0 && item.status !== "cancelled").length,
    },
    recentQuotations: [...snapshot.quotations]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        quotationNumber: item.quotationNumber,
        customerName: customerName(snapshot, item.customerId),
        totalAmount: item.totalAmount,
        status: item.status,
        createdAt: item.createdAt,
      })),
    recentJobOrders: [...snapshot.jobOrders]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        jobOrderNumber: item.jobOrderNumber,
        customerName: customerName(snapshot, item.customerId),
        vehicleLabel: vehicleLabel(snapshot, item.vehicleId),
        status: item.status,
        createdAt: item.createdAt,
      })),
    inventoryAlerts: snapshot.products
      .filter((item) => item.availableQuantity <= item.reorderLevel)
      .map((item) => ({
        productId: item.id,
        productName: item.name,
        sku: item.sku,
        availableQuantity: item.availableQuantity,
        reorderLevel: item.reorderLevel,
      })),
    unpaidInvoices: snapshot.invoices
      .filter((item) => item.balance > 0 && item.status !== "cancelled")
      .map((item) => ({
        id: item.id,
        invoiceNumber: item.invoiceNumber,
        customerName: customerName(snapshot, item.customerId),
        status: item.status,
        balance: item.balance,
      })),
    quotationAndServiceTrend: trend,
    invoiceAndServiceTrend: invoiceTrend,
    requireInvoiceBeforeVehicleRelease: snapshot.business.requireInvoiceBeforeVehicleRelease,
    serviceTrend: buckets.map((bucket) => ({
      label: bucket.label,
      value: snapshot.jobOrders.filter((item) => {
        const stamp = item.completedAt ?? item.createdAt;
        return stamp >= bucket.fromIso && stamp <= bucket.toIso && item.status !== "cancelled";
      }).length,
    })),
  };
}

function documentHistory(snapshot: SandboxSnapshot, customerId: string): CustomerDocumentHistoryItem[] {
  const quotations = snapshot.quotations
    .filter((item) => item.customerId === customerId)
    .map((item) => ({
      id: item.id,
      documentType: "quotation" as const,
      documentLabel: item.quotationNumber,
      documentHref: `/quotations/${item.id}`,
      vehicleLabel: vehicleLabel(snapshot, item.vehicleId),
      occurredAt: item.createdAt,
      amount: item.totalAmount,
      status: item.status,
      linkedRecords: [],
    }));
  const jobOrders = snapshot.jobOrders
    .filter((item) => item.customerId === customerId)
    .map((item) => ({
      id: item.id,
      documentType: "job_order" as const,
      documentLabel: item.jobOrderNumber,
      documentHref: `/job-orders/${item.id}`,
      vehicleLabel: vehicleLabel(snapshot, item.vehicleId),
      occurredAt: item.createdAt,
      amount: null,
      status: item.status,
      linkedRecords: [],
    }));
  const invoices = snapshot.invoices
    .filter((item) => item.customerId === customerId)
    .map((item) => ({
      id: item.id,
      documentType: "invoice" as const,
      documentLabel: item.invoiceNumber,
      documentHref: `/invoices/${item.id}`,
      vehicleLabel: vehicleLabel(snapshot, item.vehicleId),
      occurredAt: item.createdAt,
      amount: item.totalAmount,
      status: item.status,
      linkedRecords: [],
    }));
  const payments = snapshot.payments
    .filter((item) => snapshot.invoices.some((invoice) => invoice.id === item.invoiceId && invoice.customerId === customerId))
    .map((item) => ({
      id: item.id,
      documentType: "payment" as const,
      documentLabel: item.paymentNumber,
      documentHref: `/payments/${item.id}`,
      vehicleLabel: null,
      occurredAt: item.paidAt,
      amount: item.amount,
      paymentMethod: item.paymentMethod,
      linkedRecords: [],
    }));

  return [...quotations, ...jobOrders, ...invoices, ...payments].sort((left, right) =>
    right.occurredAt.localeCompare(left.occurredAt),
  );
}

export function toAttendancePageData(
  snapshot: SandboxSnapshot,
  searchParams: URLSearchParams,
): AttendancePageData {
  const requestedMonth = searchParams.get("month") ?? undefined;
  const alignedDate = alignAttendanceDateToMonth(searchParams.get("date") ?? undefined, requestedMonth);
  const rosterFilters = resolveAttendancePageFilters({
    date: alignedDate,
    search: searchParams.get("rosterSearch") ?? "",
    role: searchParams.get("rosterRole") ?? "",
    rosterStatus: searchParams.get("rosterStatus") ?? "",
    status: "",
  });
  const attendanceFilters = resolveAttendancePageFilters({
    date: alignedDate,
    search: searchParams.get("attendanceSearch") ?? "",
    role: searchParams.get("attendanceRole") ?? "",
    status: searchParams.get("attendanceStatus") ?? "",
  });

  return {
    rosterData: buildSandboxRoster(snapshot, rosterFilters),
    attendanceData: buildSandboxRoster(snapshot, attendanceFilters, ["admin", "owner"]),
    attendanceCalendar: buildSandboxAttendanceCalendar(snapshot, alignedDate, requestedMonth),
    amendmentsReview: { pendingCount: 0, totalCount: 0, amendments: [] },
    leaveManagement: {
      activeStaff: snapshot.staff
        .filter((member) => member.status === "active")
        .map((member) => ({
          id: member.id,
          fullName: `${member.firstName} ${member.lastName}`.trim(),
          role: member.role,
          status: member.status,
        })),
      leaveEntries: [],
    },
  };
}

function buildSandboxRoster(
  snapshot: SandboxSnapshot,
  filters: AttendancePageFilters,
  excludeRoles: StaffRole[] = [],
): AttendanceRosterData {
  const branchHoliday = holidayOnDate(snapshot, filters.date);
  const needle = filters.search.toLowerCase();
  const rosterBase = snapshot.staff
    .filter((member) => member.status === "active")
    .filter((member) => !excludeRoles.includes(member.role))
    .filter((member) => !filters.role || member.role === filters.role)
    .filter((member) => {
      if (!needle) return true;
      return `${member.firstName} ${member.lastName} ${member.contactNumber ?? ""}`.toLowerCase().includes(needle);
    })
    .sort((left, right) => left.lastName.localeCompare(right.lastName) || left.firstName.localeCompare(right.firstName))
    .map<AttendanceRosterItem>((member) => {
      const attendance = toAttendanceRecord(
        snapshot.attendance.find(
          (item) => item.staffId === member.id && item.attendanceDate === filters.date,
        ) ?? null,
      );
      return {
        staffId: member.id,
        fullName: `${member.firstName} ${member.lastName}`.trim(),
        role: member.role,
        contactNumber: member.contactNumber,
        schedule: member.schedule,
        leaveEntry: null,
        attendance,
        hasMissingTimeout: hasMissingTimeout(attendance),
        isApproved: isAttendanceApproved(attendance),
      };
    });
  const filteredRoster = rosterBase.filter((item) => {
    if (filters.rosterStatus && !matchesRosterStatusFilter(item, filters.rosterStatus, { branchHoliday })) {
      return false;
    }
    if (filters.status && !matchesAttendanceStatusFilter(item, filters.status, { branchHoliday })) {
      return false;
    }
    return true;
  });
  const lockedPeriod = snapshot.payrollPeriods.find(
    (period) =>
      (period.status === "processing" || period.status === "finalized") &&
      filters.date >= period.periodStartDate &&
      filters.date <= period.periodEndDate,
  );

  return {
    branchName: snapshot.branch.name,
    filters,
    branchHoliday,
    summary: buildAttendanceSummary(rosterBase, { branchHoliday }),
    roster: filteredRoster,
    totalMatchingStaff: rosterBase.length,
    visibleCount: filteredRoster.length,
    lockedPeriod: lockedPeriod
      ? {
          payrollPeriodId: lockedPeriod.id,
          payrollPeriodLabel: lockedPeriod.label,
          payrollPeriodStatus: lockedPeriod.status,
        }
      : null,
  };
}

function buildSandboxAttendanceCalendar(
  snapshot: SandboxSnapshot,
  selectedDate: string,
  requestedMonth?: string,
): AttendancePageData["attendanceCalendar"] {
  const targetMonth = resolveCalendarMonth(selectedDate, requestedMonth);
  const monthStartDate = targetMonth.startOf("month").toFormat("yyyy-LL-dd");
  const monthEndDate = targetMonth.endOf("month").toFormat("yyyy-LL-dd");
  const todayDate = getDefaultAttendanceDate();
  const activeStaff = snapshot.staff.filter(
    (member) => member.status === "active" && member.role !== "admin" && member.role !== "owner",
  );
  const days: AttendanceCalendarDaySummary[] = [];
  let cursor = targetMonth.startOf("month");
  const monthEnd = targetMonth.endOf("month").startOf("day");

  while (cursor <= monthEnd) {
    const date = cursor.toFormat("yyyy-LL-dd");
    const isFuture = date > todayDate;
    const branchHoliday = holidayOnDate(snapshot, date);
    let staffCount = 0;
    let recordedCount = 0;
    let approvedCount = 0;
    let attentionCount = 0;
    let absentCount = 0;

    for (const member of activeStaff) {
      const attendance = toAttendanceRecord(
        snapshot.attendance.find((item) => item.staffId === member.id && item.attendanceDate === date) ?? null,
      );
      const isScheduledWorkday =
        !isFuture &&
        !branchHoliday &&
        isScheduledWorkdayForDate(member.schedule, date);
      const isIncomplete = Boolean(attendance?.timeOut === null && attendance?.timeIn);
      const isAbsent = isScheduledWorkday && (!attendance || attendance.status === "absent");
      if (!isScheduledWorkday && !attendance) continue;

      staffCount += 1;
      if (attendance && attendance.status !== "absent") {
        recordedCount += 1;
        if (isAttendanceApproved(attendance)) approvedCount += 1;
      }
      if (isIncomplete) {
        attentionCount += 1;
        continue;
      }
      if (isAbsent) absentCount += 1;
    }

    days.push({
      date,
      status: branchHoliday
        ? "holiday"
        : isFuture
          ? "none"
          : attentionCount > 0
            ? "attention"
            : absentCount > 0
              ? "absent"
              : recordedCount > 0
                ? "complete"
                : "none",
      branchHoliday,
      staffCount,
      recordedCount,
      approvedCount,
      attentionCount,
      absentCount,
    });
    cursor = cursor.plus({ days: 1 });
  }

  const normalizedSelectedDate = DateTime.fromISO(selectedDate);
  return {
    month: targetMonth.toFormat("yyyy-LL"),
    monthLabel: targetMonth.toFormat("LLLL yyyy"),
    monthStartDate,
    monthEndDate,
    selectedDate:
      normalizedSelectedDate.isValid && normalizedSelectedDate.hasSame(targetMonth, "month")
        ? normalizedSelectedDate.toFormat("yyyy-LL-dd")
        : monthStartDate,
    days,
  };
}

function holidayOnDate(snapshot: SandboxSnapshot, date: string): BranchHolidaySummary | null {
  const holiday = snapshot.holidays.find((item) => item.holidayDate === date);
  if (!holiday) return null;
  return {
    id: holiday.id,
    branchId: snapshot.branch.id,
    holidayDate: holiday.holidayDate,
    label: holiday.label,
    holidayKind: holiday.holidayKind,
    payTreatment: holiday.payTreatment,
    notes: null,
  };
}

function toAttendanceRecord(
  record: SandboxSnapshot["attendance"][number] | null,
): AttendanceRecordSummary | null {
  if (!record) return null;
  return {
    id: record.id,
    attendanceDate: record.attendanceDate,
    timeIn: record.timeIn,
    timeOut: record.timeOut,
    status: record.status,
    notes: record.notes,
    approvedByStaffId: null,
    approvedAt: record.approvedAt,
  };
}

export function toQuotationListItem(snapshot: SandboxSnapshot, quotation: SandboxSnapshot["quotations"][number]): QuotationListItem {
  return {
    id: quotation.id,
    quotationNumber: quotation.quotationNumber,
    branchId: snapshot.branch.id,
    customerId: quotation.customerId,
    customerName: customerName(snapshot, quotation.customerId),
    vehicleId: quotation.vehicleId,
    vehicleLabel: vehicleLabel(snapshot, quotation.vehicleId),
    status: quotation.status,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    tax: quotation.tax,
    totalAmount: quotation.totalAmount,
    createdAt: quotation.createdAt,
    approvedAt: quotation.approvedAt,
  };
}

export function toQuotationDetail(snapshot: SandboxSnapshot, quotationId: string): QuotationDetail | null {
  const quotation = snapshot.quotations.find((item) => item.id === quotationId);
  if (!quotation) return null;

  const customer = snapshot.customers.find((item) => item.id === quotation.customerId);
  const vehicle = snapshot.vehicles.find((item) => item.id === quotation.vehicleId);
  const jobOrder = snapshot.jobOrders.find((item) => item.quotationId === quotation.id);
  const owner = snapshot.staff.find((item) => item.role === "owner");

  return {
    ...toQuotationListItem(snapshot, quotation),
    customerContactNumber: customer?.contactNumber ?? null,
    customerAddress: customer?.address ?? null,
    vehicleMake: vehicle?.make ?? null,
    vehicleModel: vehicle?.model ?? null,
    vehicleYear: vehicle?.year ?? null,
    vehiclePlateNumber: vehicle?.plateNumber ?? null,
    vehicleVin: vehicle?.vin ?? null,
    natureOfRepair: quotation.natureOfRepair ?? quotation.notes,
    inspectionNotes: quotation.inspectionNotes ?? null,
    preparedByName: owner ? `${owner.firstName} ${owner.lastName}` : null,
    preparedByTitle: owner?.documentTitle ?? null,
    items: snapshot.quotationLines
      .filter((item) => item.parentId === quotation.id)
      .map((item, index) => ({
        id: item.id,
        lineNumber: index + 1,
        itemType: item.itemType,
        productId: item.productId,
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unitLabel: item.productId
          ? snapshot.products.find((product) => product.id === item.productId)?.unitLabel ?? null
          : null,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    jobOrderId: jobOrder?.id ?? null,
    jobOrderNumber: jobOrder?.jobOrderNumber ?? null,
  };
}

export function filterSandboxQuotations(
  snapshot: SandboxSnapshot,
  search: string,
  status: string,
) {
  const query = search.trim().toLowerCase();
  return snapshot.quotations
    .filter((item) => {
      if (status === "pending") return item.status === "draft" || item.status === "pending_approval";
      if (status) return item.status === status;
      return true;
    })
    .filter((item) => !query || item.quotationNumber.toLowerCase().includes(query))
    .map((item) => toQuotationListItem(snapshot, item));
}

export function toQuotationFormOptions(snapshot: SandboxSnapshot): QuotationFormOptions {
  return {
    customers: snapshot.customers
      .filter((item) => item.status === "active")
      .map((item) => ({ id: item.id, label: item.displayName })),
    vehicles: snapshot.vehicles
      .filter((item) => item.status === "active")
      .map((item) => ({
        id: item.id,
        customerId: item.customerId,
        label: vehicleLabel(snapshot, item.id),
      })),
    products: snapshot.products
      .filter((item) => item.status === "active")
      .map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        oemNumber: null,
        unitLabel: item.unitLabel,
        unitPrice: item.sellingPrice,
        availableQuantity: item.availableQuantity,
        hasStockRecord: true,
      })),
    services: snapshot.services
      .filter((item) => item.status === "active")
      .map((item) => ({
        id: item.id,
        label: item.name,
        category: item.category,
        unitPrice: item.laborPrice,
      })),
    productFormOptions: {
      categories: snapshot.products
        .map((item) => item.categoryName)
        .filter((name): name is string => Boolean(name))
        .filter((name, index, names) => names.indexOf(name) === index)
        .map((name) => ({ id: name, label: name })),
      brands: snapshot.products
        .map((item) => item.brandName)
        .filter((name): name is string => Boolean(name))
        .filter((name, index, names) => names.indexOf(name) === index)
        .map((name) => ({ id: name, label: name })),
      suppliers: snapshot.suppliers.map((item) => ({ id: item.id, label: item.supplierName })),
      units: [{ id: SANDBOX_IDS.unit, label: "pc" }],
      branches: [{ id: snapshot.branch.id, label: snapshot.branch.name }],
      permissions: { canMarkGlobal: true, canSelectOwningBranch: false },
      defaultBranchId: snapshot.branch.id,
    },
    permissions: { canCreateProducts: true, canCreateServices: true },
  };
}

export function toQuotationCreateFlowOptions(snapshot: SandboxSnapshot): QuotationCreateFlowOptions {
  return {
    ...toQuotationFormOptions(snapshot),
    vehicleLookups: {
      makes: snapshot.vehicleMakes.map((item) => ({ id: item.id, name: item.name })),
      models: snapshot.vehicleModels.map((item) => ({
        id: item.id,
        makeId: item.makeId,
        makeName: snapshot.vehicleMakes.find((make) => make.id === item.makeId)?.name ?? "",
        name: item.name,
      })),
      transmissions: snapshot.lookupOptions.filter((item) => item.lookupType === "transmission").map((item) => item.label),
      fuelTypes: snapshot.lookupOptions.filter((item) => item.lookupType === "fuel_type").map((item) => item.label),
      colors: snapshot.lookupOptions.filter((item) => item.lookupType === "color").map((item) => item.label),
    },
  };
}

export function toQuotationReviseState(snapshot: SandboxSnapshot, quotationId: string) {
  const quotation = toQuotationDetail(snapshot, quotationId);
  if (!quotation) return null;

  const jobOrder = snapshot.jobOrders.find((item) => item.id === quotation.jobOrderId);
  const hasActiveInvoice = snapshot.invoices.some(
    (item) => item.jobOrderId === jobOrder?.id && item.status !== "cancelled",
  );
  const canRevise = canReviseQuotation({
    status: quotation.status,
    jobOrderId: quotation.jobOrderId,
    jobOrderStatus: jobOrder?.status,
    hasActiveInvoice,
  });

  let blockReason: string | null = null;
  if (!canRevise) {
    if (quotation.status !== "approved") blockReason = "Only approved quotations can be revised.";
    else if (!quotation.jobOrderId) blockReason = "This quotation is not linked to a job order.";
    else if (hasActiveInvoice) blockReason = "This quotation cannot be revised after an active invoice has been created.";
    else blockReason = "This quotation cannot be revised while the linked job order is completed, billed, or released.";
  }

  return {
    quotation,
    canRevise,
    blockReason,
    canDelete: canDeleteQuotation(quotation.status) && !quotation.jobOrderId,
    initialValues: mapQuotationDetailToFormValues(quotation),
  };
}

export function isQuotationStatusFilter(value: string): value is "" | QuotationStatus | "pending" {
  return (
    value === "" ||
    value === "pending" ||
    value === "draft" ||
    value === "pending_approval" ||
    value === "approved" ||
    value === "rejected" ||
    value === "expired"
  );
}

function alignAttendanceDateToMonth(date: string | undefined, requestedMonth?: string) {
  const resolvedDate = date ? DateTime.fromISO(date) : DateTime.invalid("missing");
  const requestedMonthValue = requestedMonth ? DateTime.fromFormat(requestedMonth, "yyyy-LL") : null;
  if (
    resolvedDate.isValid &&
    requestedMonthValue?.isValid &&
    !resolvedDate.hasSame(requestedMonthValue, "month")
  ) {
    return requestedMonthValue.startOf("month").toFormat("yyyy-LL-dd");
  }
  return resolvedDate.isValid ? resolvedDate.toFormat("yyyy-LL-dd") : getDefaultAttendanceDate();
}

function resolveCalendarMonth(selectedDate: string, requestedMonth?: string) {
  const selected = DateTime.fromISO(selectedDate);
  const selectedMonth = selected.isValid ? selected.startOf("month") : DateTime.now().setZone(ZONE).startOf("month");
  const requested = requestedMonth ? DateTime.fromFormat(requestedMonth, "yyyy-LL") : selectedMonth;
  return requested.isValid ? requested.startOf("month") : selectedMonth;
}
