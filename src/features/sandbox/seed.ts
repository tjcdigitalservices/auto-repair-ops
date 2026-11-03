import { DateTime } from "luxon";

import { createDefaultDocumentJson } from "@/components/document-engine/persistence/document-content";
import { SETTINGS_DOCUMENT_SEQUENCE_DEFAULTS } from "@/features/settings/document-sequence-defaults";
import { mapStoreHoursToFormValues } from "@/features/settings/store-hours.shared";
import type {
  SandboxAllowedIp,
  SandboxAttendanceAccess,
  SandboxJobOrder,
  SandboxLine,
  SandboxShopSettings,
  SandboxSnapshot,
  SandboxStaffDevice,
  SandboxStockMovement,
} from "@/features/sandbox/types";
import { SANDBOX_IDS as ID } from "@/features/sandbox/ids";
import { DEFAULT_BRAND_PACK } from "@/lib/branding/types";

const ZONE = "Asia/Manila";

export const SANDBOX_SEED_REVISION = 7;

export const SANDBOX_SHOP_PUBLIC_IP = "203.177.14.22";

export function createSandboxStockMovements(createdAt: string, approvedAt: string): SandboxStockMovement[] {
  return [
    {
      id: ID.movementPads,
      productId: ID.productPads,
      movementType: "stock_in",
      quantity: 6,
      previousQuantity: 0,
      newQuantity: 6,
      referenceType: "stock_in",
      notes: "Opening delivery from Metro Parts.",
      createdAt,
    },
    {
      id: ID.movementFilter,
      productId: ID.productFilter,
      movementType: "service_usage",
      quantity: 1,
      previousQuantity: 25,
      newQuantity: 24,
      referenceType: "job_order",
      notes: "Used on JO-0001.",
      createdAt: approvedAt,
    },
    {
      id: ID.movementOil,
      productId: ID.productOil,
      movementType: "pos_sale",
      quantity: 1,
      previousQuantity: 4,
      newQuantity: 3,
      referenceType: "pos_sale",
      notes: "POS-0001 counter sale.",
      createdAt,
    },
  ];
}

export function createSandboxTimekeepingDefaults(createdAt: string) {
  const attendanceAccess: SandboxAttendanceAccess = {
    requireShopIpForMechanicAttendance: true,
    requireShopLocationForMechanicAttendance: false,
    allowDtrAmendments: true,
    allowAttendanceAdminOverride: true,
    geofenceLatitude: "14.6760",
    geofenceLongitude: "121.0437",
    geofenceRadiusMeters: "150",
  };
  const allowedIps: SandboxAllowedIp[] = [
    {
      id: ID.allowedIp,
      ipAddress: SANDBOX_SHOP_PUBLIC_IP,
      label: "Workshop fiber",
      createdAt,
      updatedAt: createdAt,
    },
  ];
  const staffDevices: SandboxStaffDevice[] = [
    {
      id: ID.deviceMechanic,
      staffId: ID.mechanic,
      deviceName: "Carlo's phone",
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
      firstSeenAt: createdAt,
      lastSeenAt: createdAt,
      lastIp: SANDBOX_SHOP_PUBLIC_IP,
      status: "approved",
      approvedAt: createdAt,
      revokedAt: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: ID.deviceAdvisor,
      staffId: ID.advisor,
      deviceName: "Front desk laptop",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      firstSeenAt: createdAt,
      lastSeenAt: createdAt,
      lastIp: SANDBOX_SHOP_PUBLIC_IP,
      status: "approved",
      approvedAt: createdAt,
      revokedAt: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: ID.deviceTablet,
      staffId: ID.mechanic,
      deviceName: "Bay tablet",
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; SM-X210) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      firstSeenAt: createdAt,
      lastSeenAt: createdAt,
      lastIp: SANDBOX_SHOP_PUBLIC_IP,
      status: "pending",
      approvedAt: null,
      revokedAt: null,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  return { attendanceAccess, allowedIps, staffDevices };
}

export function createSandboxServiceHistoryRecords(clock: DateTime, createdAt: string) {
  const viosDoneAt = clock.minus({ days: 40 }).toUTC().toISO() ?? createdAt;
  const l300DoneAt = clock.minus({ days: 18 }).toUTC().toISO() ?? createdAt;
  const civicDoneAt = clock.minus({ days: 28 }).toUTC().toISO() ?? createdAt;
  const innovaDoneAt = clock.minus({ days: 55 }).toUTC().toISO() ?? createdAt;
  const viosServiceDate = clock.minus({ days: 40 }).toISODate() ?? "2026-09-05";
  const l300ServiceDate = clock.minus({ days: 18 }).toISODate() ?? "2026-09-27";
  const civicServiceDate = clock.minus({ days: 28 }).toISODate() ?? "2026-09-17";
  const innovaServiceDate = clock.minus({ days: 55 }).toISODate() ?? "2026-08-21";

  const jobOrders: SandboxJobOrder[] = [
    {
      id: ID.jobOrderHistoryVios,
      jobOrderNumber: "JO-0002",
      quotationId: null,
      customerId: ID.customerMaria,
      vehicleId: ID.vehicleVios,
      status: "released",
      customerConcern: "Brake pedal feels soft when parking.",
      inspectionNotes: "Front pads near end of life.",
      diagnosis: "Replace front brake pads and road-test.",
      workPerformed: "Replaced front brake pads and bled the system.",
      mileageIn: 46880,
      mileageOut: 46882,
      assignedStaffId: ID.mechanic,
      isHistorical: true,
      serviceDate: viosServiceDate,
      createdAt: viosDoneAt,
      startedAt: viosDoneAt,
      completedAt: viosDoneAt,
      releasedAt: viosDoneAt,
    },
    {
      id: ID.jobOrderHistoryL300,
      jobOrderNumber: "JO-0003",
      quotationId: null,
      customerId: ID.customerSantos,
      vehicleId: ID.vehicleL300,
      status: "released",
      customerConcern: "Fleet van squeaks when braking.",
      inspectionNotes: "Front pads worn unevenly.",
      diagnosis: "Brake service with pad replacement.",
      workPerformed: "Installed new front brake pads and cleaned calipers.",
      mileageIn: 119900,
      mileageOut: 119905,
      assignedStaffId: ID.mechanic,
      isHistorical: false,
      serviceDate: l300ServiceDate,
      createdAt: l300DoneAt,
      startedAt: l300DoneAt,
      completedAt: l300DoneAt,
      releasedAt: l300DoneAt,
    },
    {
      id: ID.jobOrderHistoryCivic,
      jobOrderNumber: "JO-0004",
      quotationId: null,
      customerId: ID.customerReyes,
      vehicleId: ID.vehicleCivic,
      status: "released",
      customerConcern: "Due for periodic oil service.",
      inspectionNotes: "Oil dark; filter due for replacement.",
      diagnosis: "Scheduled maintenance oil change.",
      workPerformed: "Completed oil and filter service.",
      mileageIn: 21450,
      mileageOut: 21452,
      assignedStaffId: ID.mechanic,
      isHistorical: true,
      serviceDate: civicServiceDate,
      createdAt: civicDoneAt,
      startedAt: civicDoneAt,
      completedAt: civicDoneAt,
      releasedAt: civicDoneAt,
    },
    {
      id: ID.jobOrderHistoryInnova,
      jobOrderNumber: "JO-0005",
      quotationId: null,
      customerId: ID.customerMaria,
      vehicleId: ID.vehicleInnova,
      status: "released",
      customerConcern: "Oil change and general inspection before a long trip.",
      inspectionNotes: "Filter due; fluids topped up.",
      diagnosis: "Routine oil service before travel.",
      workPerformed: "Oil change completed and fluids checked.",
      mileageIn: 79120,
      mileageOut: 79124,
      assignedStaffId: ID.mechanic,
      isHistorical: true,
      serviceDate: innovaServiceDate,
      createdAt: innovaDoneAt,
      startedAt: innovaDoneAt,
      completedAt: innovaDoneAt,
      releasedAt: innovaDoneAt,
    },
  ];

  const jobOrderLines: SandboxLine[] = [
    line(ID.jobItemHistoryVios, ID.jobOrderHistoryVios, "service", null, ID.serviceBrake, "Brake Service", 1, 1200),
    line(ID.jobItemHistoryL300, ID.jobOrderHistoryL300, "service", null, ID.serviceBrake, "Brake Service", 1, 1200),
    line("10000000-0000-4000-8000-00000000008d", ID.jobOrderHistoryL300, "product", ID.productPads, null, "Front Brake Pads", 1, 1450),
    line(ID.jobItemHistoryCivic, ID.jobOrderHistoryCivic, "service", null, ID.serviceOil, "Oil Change", 1, 650),
    line(ID.jobItemHistoryInnova, ID.jobOrderHistoryInnova, "service", null, ID.serviceOil, "Oil Change", 1, 650),
    line(ID.jobItemHistoryInnovaParts, ID.jobOrderHistoryInnova, "product", ID.productFilter, null, "Oil Filter", 1, 320),
  ];

  return { jobOrders, jobOrderLines };
}

export function createSandboxSeed(now = new Date()): SandboxSnapshot {
  const clock = DateTime.fromJSDate(now).setZone(ZONE);
  const createdAt = clock.minus({ days: 12 }).toUTC().toISO() ?? now.toISOString();
  const approvedAt = clock.minus({ days: 2 }).toUTC().toISO() ?? now.toISOString();
  const today = clock.toISODate() ?? "2026-10-14";
  const monthStart = clock.startOf("month").toISODate() ?? today;
  const closedThrough = clock.minus({ days: 1 }).startOf("day");
  const currentPeriodEnd =
    (closedThrough < clock.startOf("month") ? clock.startOf("month") : closedThrough).toISODate() ?? today;
  const monthEnd = clock.endOf("month").toISODate() ?? today;
  const payout = clock.endOf("month").toISODate() ?? today;

  const previousMonth = clock.minus({ months: 1 });
  const nextMonth = clock.plus({ months: 1 });
  const previousStart = previousMonth.startOf("month").toISODate() ?? monthStart;
  const previousEnd = previousMonth.endOf("month").toISODate() ?? monthEnd;
  const nextStart = nextMonth.startOf("month").toISODate() ?? monthStart;
  const nextEnd = nextMonth.endOf("month").toISODate() ?? monthEnd;
  const correctionDate = clock.plus({ days: 1 }).toISODate() ?? today;
  const holidayOnTwelfth = clock.startOf("month").set({ day: 12 });
  const shopHoliday =
    holidayOnTwelfth.weekday <= 6 && holidayOnTwelfth.startOf("day") <= clock.startOf("day")
      ? holidayOnTwelfth.toISODate()
      : null;
  const attendance = buildSeedAttendance(clock, shopHoliday);
  const serviceHistory = createSandboxServiceHistoryRecords(clock, createdAt);

  return {
    version: 1,
    seedRevision: SANDBOX_SEED_REVISION,
    branch: {
      id: ID.branch,
      code: "MAIN",
      name: "Sample Auto Care",
      address: "18 Workshop Avenue, Quezon City",
      contactNumber: "0917 555 0142",
      email: "hello@sampleautocare.test",
      isMain: true,
    },
    business: {
      name: "Sample Auto Care",
      address: "18 Workshop Avenue, Quezon City",
      contact: "0917 555 0142",
      email: "hello@sampleautocare.test",
      vatRegistrationNo: "000-000-000-000",
      receiptFooter: "Thank you for trusting Sample Auto Care.",
      defaultTaxRate: "12",
      logoDataUrl: null,
      markDataUrl: null,
      allowGlobalProductCatalog: true,
      allowGlobalServiceCatalog: true,
      allowPartialPayments: true,
      requireInvoiceBeforeJobCompletion: false,
      requireInvoiceBeforeVehicleRelease: true,
      allowReleaseWithBalance: false,
      requireFullPaymentBeforeRelease: true,
      requireAdditionalItemPreApproval: true,
      enableBarcodeSupport: true,
      enableShelfLocation: true,
      payrollStandardDailyHours: "8",
      payrollHolidayPremiumRate: "0.3",
      payrollDefaultSssAmount: "580",
      payrollDefaultPhilhealthAmount: "250",
      payrollDefaultPagibigAmount: "200",
    },
    sequences: {
      customer: 5,
      quotation: 3,
      jobOrder: 6,
      invoice: 3,
      payment: 3,
      staff: 4,
      document: 2,
      pos: 2,
      payroll: 4,
    },
    shopSettings: createSandboxShopSettings(),
    customers: [
      customer(ID.customerMaria, "CUS-0001", "individual", "Maria Santos", "Maria", "Santos", null, "0917 100 2201", "maria.santos@example.com", createdAt),
      customer(ID.customerSantos, "CUS-0002", "company", "Santos Logistics", null, null, "Santos Logistics", "0918 200 3302", "fleet@santoslogistics.example", createdAt),
      customer(ID.customerWalkIn, "CUS-0003", "individual", "Walk-in Counter", "Walk-in", "Counter", null, null, null, createdAt),
      customer(ID.customerReyes, "CUS-0004", "individual", "Paolo Reyes", "Paolo", "Reyes", null, "0919 300 4403", "paolo.reyes@example.com", createdAt),
    ],
    vehicles: [
      vehicle(ID.vehicleVios, ID.customerMaria, "Toyota", "Vios", 2019, "ABC 1234", 48210, "Automatic", "Gasoline", "Silver", createdAt),
      vehicle(ID.vehicleL300, ID.customerSantos, "Mitsubishi", "L300", 2016, "XYZ 8901", 120440, "Manual", "Diesel", "White", createdAt),
      vehicle(ID.vehicleCivic, ID.customerReyes, "Honda", "Civic", 2021, "DEF 4567", 22110, "Automatic", "Gasoline", "Black", createdAt),
      vehicle(ID.vehicleInnova, ID.customerMaria, "Toyota", "Innova", 2018, "GHI 2468", 80330, "Automatic", "Diesel", "Gray", createdAt),
    ],
    suppliers: [
      {
        id: ID.supplier,
        supplierName: "Metro Parts Supply",
        contactPerson: "Elena Cruz",
        contactNumber: "028 555 0199",
        email: "orders@metroparts.example",
        address: "Pasig City",
        paymentTerms: "30 days",
        notes: "Primary filters and fluids supplier.",
        status: "active",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    products: [
      product(ID.productFilter, "Oil Filter", "OF-1040", "part", "Filters", "Sample", 180, 320, 8, 24, "A-12", createdAt, ID.supplier),
      product(ID.productPads, "Front Brake Pads", "BP-220", "part", "Brakes", "Sample", 900, 1450, 4, 6, "B-04", createdAt, ID.supplier),
      product(ID.productOil, "Engine Oil 5W-30", "EO-5W30", "fluid", "Fluids", "Sample", 250, 480, 12, 3, "C-01", createdAt, ID.supplier),
    ],
    services: [
      {
        id: ID.serviceOil,
        name: "Oil Change",
        category: "Maintenance",
        description: "Drain and refill engine oil, replace filter.",
        laborPrice: 650,
        estimatedDurationMinutes: 45,
        status: "active",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: ID.serviceBrake,
        name: "Brake Service",
        category: "Brakes",
        description: "Inspect pads, rotors, and brake fluid.",
        laborPrice: 1200,
        estimatedDurationMinutes: 90,
        status: "active",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    quotations: [
      {
        id: ID.quotationDraft,
        quotationNumber: "Q-0001",
        customerId: ID.customerReyes,
        vehicleId: ID.vehicleCivic,
        status: "draft",
        discount: 0,
        tax: 0,
        subtotal: 1450,
        totalAmount: 1450,
        notes: "Customer asked for a pad replacement estimate.",
        createdAt,
        approvedAt: null,
      },
      {
        id: ID.quotationApproved,
        quotationNumber: "Q-0002",
        customerId: ID.customerMaria,
        vehicleId: ID.vehicleVios,
        status: "approved",
        discount: 0,
        tax: 0,
        subtotal: 970,
        totalAmount: 970,
        notes: "Approved oil change.",
        createdAt,
        approvedAt,
      },
    ],
    quotationLines: [
      line(ID.quotationItemDraft, ID.quotationDraft, "product", ID.productPads, null, "Front Brake Pads", 1, 1450),
      line(ID.quotationItemApproved, ID.quotationApproved, "service", null, ID.serviceOil, "Oil Change", 1, 650),
      line("10000000-0000-4000-8000-000000000074", ID.quotationApproved, "product", ID.productFilter, null, "Oil Filter", 1, 320),
    ],
    jobOrders: [
      {
        id: ID.jobOrder,
        jobOrderNumber: "JO-0001",
        quotationId: ID.quotationApproved,
        customerId: ID.customerMaria,
        vehicleId: ID.vehicleVios,
        status: "in_progress",
        customerConcern: "Engine noise after long drives.",
        inspectionNotes: "Oil level low. Filter due.",
        diagnosis: "Due for scheduled oil service.",
        workPerformed: "Oil change in progress.",
        mileageIn: 48210,
        mileageOut: null,
        assignedStaffId: ID.mechanic,
        createdAt: approvedAt,
        startedAt: approvedAt,
        completedAt: null,
        releasedAt: null,
      },
      ...serviceHistory.jobOrders,
    ],
    jobOrderLines: [
      line(ID.jobItem, ID.jobOrder, "service", null, ID.serviceOil, "Oil Change", 1, 650),
      line("10000000-0000-4000-8000-000000000083", ID.jobOrder, "product", ID.productFilter, null, "Oil Filter", 1, 320),
      ...serviceHistory.jobOrderLines,
    ],
    partUsage: [
      {
        id: "10000000-0000-4000-8000-000000000082",
        jobOrderId: ID.jobOrder,
        productId: ID.productFilter,
        quantity: 1,
        createdAt: approvedAt,
      },
    ],
    invoices: [
      {
        id: ID.invoice,
        invoiceNumber: "INV-0001",
        jobOrderId: ID.jobOrderHistoryL300,
        customerId: ID.customerSantos,
        vehicleId: ID.vehicleL300,
        source: "job_order",
        subtotal: 1450,
        discount: 0,
        tax: 0,
        totalAmount: 1450,
        paidAmount: 500,
        balance: 950,
        status: "partially_paid",
        invoiceDate: clock.minus({ days: 1 }).toISODate() ?? today,
        createdAt: clock.minus({ days: 1 }).toUTC().toISO() ?? createdAt,
        cancellationReason: null,
      },
      {
        id: ID.posInvoice,
        invoiceNumber: "INV-0002",
        jobOrderId: null,
        customerId: ID.customerWalkIn,
        vehicleId: null,
        source: "pos",
        subtotal: 480,
        discount: 0,
        tax: 0,
        totalAmount: 480,
        paidAmount: 480,
        balance: 0,
        status: "paid",
        invoiceDate: today,
        createdAt,
        cancellationReason: null,
      },
    ],
    invoiceLines: [
      line("10000000-0000-4000-8000-000000000096", ID.invoice, "product", ID.productPads, null, "Front Brake Pads", 1, 1450),
      line("10000000-0000-4000-8000-000000000097", ID.posInvoice, "product", ID.productOil, null, "Engine Oil 5W-30", 1, 480),
    ],
    payments: [
      {
        id: ID.payment,
        paymentNumber: "PAY-0001",
        invoiceId: ID.invoice,
        amount: 500,
        paymentMethod: "cash",
        referenceNumber: null,
        notes: "Partial collection at the counter.",
        paidAt: clock.minus({ days: 1 }).toUTC().toISO() ?? createdAt,
      },
      {
        id: ID.posPayment,
        paymentNumber: "PAY-0002",
        invoiceId: ID.posInvoice,
        amount: 480,
        paymentMethod: "gcash",
        referenceNumber: "GC-10442",
        notes: "Counter sale.",
        paidAt: createdAt,
      },
    ],
    posSales: [
      {
        id: ID.posSale,
        saleNumber: "POS-0001",
        invoiceId: ID.posInvoice,
        customerId: ID.customerWalkIn,
        totalAmount: 480,
        createdAt,
      },
    ],
    staff: [
      staffMember(ID.owner, "STF-0001", "Amina", "Cruz", "Owner", "owner", false, createdAt, null),
      staffMember(ID.mechanic, "STF-0002", "Carlo", "Dela Cruz", "Mechanic", "mechanic", true, createdAt, {
        payBasis: "daily",
        baseRate: 800,
        overtimeRate: 150,
        allowancePerPeriod: 0,
        effectiveStartDate: previousStart,
        exemptFromAttendance: false,
        useShopDefaultContributions: true,
        sssAmount: null,
        philhealthAmount: null,
        pagibigAmount: null,
        notes: null,
      }, {
        sssNumber: "34-1234567-8",
        philhealthNumber: "12-345678901-2",
        tinNumber: "123-456-789-000",
        pagibigNumber: "1212-3456-7890",
      }),
      staffMember(ID.advisor, "STF-0003", "Liza", "Navarro", "Service Advisor", "service_advisor", true, createdAt, {
        payBasis: "monthly",
        baseRate: 22000,
        overtimeRate: null,
        allowancePerPeriod: 1000,
        effectiveStartDate: previousStart,
        exemptFromAttendance: false,
        useShopDefaultContributions: true,
        sssAmount: null,
        philhealthAmount: null,
        pagibigAmount: null,
        notes: null,
      }, {
        sssNumber: "34-7654321-9",
        philhealthNumber: "12-109876543-2",
        tinNumber: "321-654-987-000",
        pagibigNumber: "1098-7654-3210",
      }),
    ],
    attendance,
    dtrAmendments: [
      {
        id: ID.dtrAmendment,
        staffId: ID.mechanic,
        attendanceDate: correctionDate,
        targetLogType: "time_in",
        amendmentType: "missed_time_in",
        requestedTimestamp: manilaTime(correctionDate, "08:05"),
        reason: "Forgot to punch in at the start of the shift.",
        status: "pending",
        requestedIp: SANDBOX_SHOP_PUBLIC_IP,
        approvedTimestamp: null,
        approvedByStaffId: null,
        rejectedAt: null,
        rejectedByStaffId: null,
        finalTimestamp: null,
        adminNote: null,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    payrollPeriods: [
      {
        id: ID.payrollPrevious,
        label: `${previousMonth.toFormat("LLLL yyyy")} payroll`,
        periodStartDate: previousStart,
        periodEndDate: previousEnd,
        payoutDate: previousEnd,
        notes: "Closed payroll for the previous month.",
        status: "finalized",
        applyGovernmentDeductions: true,
        generatedAt: previousMonth.endOf("month").toUTC().toISO(),
        finalizedAt: previousMonth.endOf("month").toUTC().toISO(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: ID.payroll,
        label: `${clock.toFormat("LLLL yyyy")} payroll`,
        periodStartDate: monthStart,
        periodEndDate: currentPeriodEnd,
        payoutDate: payout,
        notes: "Current payroll cut, ready for payslips and remittance.",
        status: "finalized",
        applyGovernmentDeductions: true,
        generatedAt: createdAt,
        finalizedAt: createdAt,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: ID.payrollNext,
        label: `${nextMonth.toFormat("LLLL yyyy")} payroll`,
        periodStartDate: nextStart,
        periodEndDate: nextEnd,
        payoutDate: nextEnd,
        notes: "Draft period. Generate the cut after attendance is complete.",
        status: "draft",
        applyGovernmentDeductions: true,
        generatedAt: null,
        finalizedAt: null,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    payrollItems: [
      payrollItem(ID.payrollItem, ID.payroll, ID.mechanic, "Carlo Dela Cruz", "mechanic"),
      payrollItem(ID.payrollItemAdvisor, ID.payroll, ID.advisor, "Liza Navarro", "service_advisor"),
      payrollItem(ID.payrollItemPreviousMechanic, ID.payrollPrevious, ID.mechanic, "Carlo Dela Cruz", "mechanic"),
      payrollItem(ID.payrollItemPreviousAdvisor, ID.payrollPrevious, ID.advisor, "Liza Navarro", "service_advisor"),
    ],
    payrollAdjustments: [
      ...governmentAdjustments(ID.payroll, ID.mechanic, createdAt, "b6"),
      ...governmentAdjustments(ID.payroll, ID.advisor, createdAt, "c6"),
      ...governmentAdjustments(ID.payrollPrevious, ID.mechanic, createdAt, "d6"),
      ...governmentAdjustments(ID.payrollPrevious, ID.advisor, createdAt, "e6"),
      {
        id: ID.payrollBonus,
        periodId: ID.payroll,
        staffId: ID.mechanic,
        adjustmentType: "addition",
        label: "Shop performance bonus",
        amount: 1500,
        notes: "October bay target.",
        source: "manual",
        systemKey: null,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    documents: [
      {
        id: ID.document,
        title: "Bay release checklist",
        template: "blank",
        contentJson: createDefaultDocumentJson(
          "Confirm invoice balance, keys, and customer signature before the vehicle leaves the bay.",
        ),
        status: "published",
        createdBy: ID.owner,
        createdAt,
        updatedAt: createdAt,
        rootDocumentId: ID.document,
        parentDocumentId: null,
        revisionNumber: 1,
        isCurrentRevision: true,
        publishedAt: createdAt,
      },
    ],
    websitePosts: [
      {
        id: ID.post,
        title: "Rainy season brake check",
        excerpt: "A short note for customers before the wet months.",
        body: "Book a brake inspection before long trips. Sample Auto Care can usually fit same-week appointments.",
        status: "published",
        createdAt,
      },
    ],
    quoteRequests: [
      {
        id: ID.quoteRequest,
        customerName: "Jonas Uy",
        email: "jonas.uy@example.com",
        vehicle: "2020 Toyota Hilux",
        concern: "Air conditioning is weak at idle.",
        status: "new",
        createdAt,
      },
    ],
    vehicleMakes: [
      { id: ID.makeToyota, name: "Toyota", status: "active", sortOrder: 1 },
      { id: ID.makeMitsubishi, name: "Mitsubishi", status: "active", sortOrder: 2 },
      { id: ID.makeHonda, name: "Honda", status: "active", sortOrder: 3 },
    ],
    vehicleModels: [
      { id: ID.modelVios, makeId: ID.makeToyota, name: "Vios", status: "active", sortOrder: 1 },
      { id: ID.modelInnova, makeId: ID.makeToyota, name: "Innova", status: "active", sortOrder: 2 },
      { id: ID.modelL300, makeId: ID.makeMitsubishi, name: "L300", status: "active", sortOrder: 1 },
      { id: ID.modelCivic, makeId: ID.makeHonda, name: "Civic", status: "active", sortOrder: 1 },
    ],
    lookupOptions: [
      lookup("10000000-0000-4000-8000-0000000000f1", "transmission", "Automatic", 1),
      lookup("10000000-0000-4000-8000-0000000000f2", "transmission", "Manual", 2),
      lookup("10000000-0000-4000-8000-0000000000f3", "fuel_type", "Gasoline", 1),
      lookup("10000000-0000-4000-8000-0000000000f4", "fuel_type", "Diesel", 2),
      lookup("10000000-0000-4000-8000-0000000000f5", "color", "Silver", 1),
      lookup("10000000-0000-4000-8000-0000000000f6", "color", "White", 2),
      lookup("10000000-0000-4000-8000-0000000000f7", "color", "Black", 3),
      lookup("10000000-0000-4000-8000-0000000000f8", "color", "Gray", 4),
    ],
    stockMovements: createSandboxStockMovements(createdAt, approvedAt),
    holidays: [
      ...(shopHoliday
        ? [
            {
              id: "10000000-0000-4000-8000-0000000000ab",
              holidayDate: shopHoliday,
              label: "Shop anniversary",
              holidayKind: "company_holiday" as const,
              payTreatment: "paid_regular_day" as const,
              notes: null,
            },
          ]
        : []),
      {
        id: "10000000-0000-4000-8000-0000000000aa",
        holidayDate: clock.set({ month: 12, day: 25 }).toISODate() ?? "2026-12-25",
        label: "Christmas Day",
        holidayKind: "public_holiday",
        payTreatment: "paid_regular_day",
        notes: null,
      },
    ],
    ...createSandboxTimekeepingDefaults(createdAt),
  };
}

function buildSeedAttendance(clock: DateTime, shopHoliday: string | null) {
  const ranges = [
    {
      start: clock.minus({ months: 1 }).startOf("month"),
      end: clock.minus({ months: 1 }).endOf("month"),
    },
    {
      start: clock.startOf("month"),
      end: clock.minus({ days: 1 }).startOf("day"),
    },
  ];
  const currentDates = scheduledDates(ranges[1].start, ranges[1].end);
  const lateDate = currentDates.at(-2) ?? null;
  const overtimeDate =
    [...currentDates]
      .reverse()
      .find((date) => date !== lateDate && date !== shopHoliday && date !== currentDates.at(-1)) ?? null;
  const records: SandboxSnapshot["attendance"] = [];

  for (const range of ranges) {
    for (const date of scheduledDates(range.start, range.end)) {
      for (const staffId of [ID.mechanic, ID.advisor]) {
        const isMechanic = staffId === ID.mechanic;
        const late = isMechanic && date === lateDate;
        const overtime = isMechanic && date === overtimeDate && date !== shopHoliday;
        records.push({
          id: `10000000-0000-4000-8000-${String(records.length + 512).padStart(12, "0")}`,
          staffId,
          attendanceDate: date,
          status: late ? "late" : "present",
          timeIn: manilaTime(date, late ? "08:45" : "08:00"),
          timeOut: manilaTime(date, overtime ? "19:00" : "17:00"),
          notes: null,
          approvedAt: manilaTime(date, "17:05"),
        });
      }
    }
  }

  return records;
}

function scheduledDates(start: DateTime, end: DateTime) {
  const dates: string[] = [];
  let cursor = start.startOf("day");
  const last = end.startOf("day");
  while (cursor <= last) {
    if (cursor.weekday <= 6) {
      dates.push(cursor.toISODate() ?? cursor.toFormat("yyyy-LL-dd"));
    }
    cursor = cursor.plus({ days: 1 });
  }
  return dates;
}

function manilaTime(date: string, time: string) {
  return DateTime.fromISO(`${date}T${time}`, { zone: ZONE }).toUTC().toISO() ?? `${date}T00:00:00.000Z`;
}

function payrollItem(
  id: string,
  periodId: string,
  staffId: string,
  fullName: string,
  role: SandboxSnapshot["payrollItems"][number]["role"],
): SandboxSnapshot["payrollItems"][number] {
  return {
    id,
    periodId,
    staffId,
    fullName,
    role,
    netPay: 0,
    grossPay: 0,
    basePay: 0,
    presentCount: 0,
    warningCodes: [],
  };
}

function governmentAdjustments(
  periodId: string,
  staffId: string,
  createdAt: string,
  suffix: string,
): SandboxSnapshot["payrollAdjustments"] {
  return [
    ["sss", "SSS", 580],
    ["philhealth", "PhilHealth", 250],
    ["pagibig", "Pag-IBIG", 200],
  ].map(([systemKey, label, amount], index) => ({
    id: `10000000-0000-4000-8000-000000000${suffix}${index}`,
    periodId,
    staffId,
    adjustmentType: "deduction" as const,
    label: String(label),
    amount: Number(amount),
    notes: null,
    source: "system_government" as const,
    systemKey: systemKey as "sss" | "philhealth" | "pagibig",
    createdAt,
    updatedAt: createdAt,
  }));
}

function customer(
  id: string,
  customerCode: string,
  customerType: SandboxSnapshot["customers"][number]["customerType"],
  displayName: string,
  firstName: string | null,
  lastName: string | null,
  companyName: string | null,
  contactNumber: string | null,
  email: string | null,
  createdAt: string,
): SandboxSnapshot["customers"][number] {
  return {
    id,
    customerCode,
    customerType,
    displayName,
    firstName,
    lastName,
    companyName,
    contactNumber,
    email,
    address: "Quezon City",
    notes: null,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };
}

function vehicle(
  id: string,
  customerId: string,
  make: string,
  model: string,
  year: number,
  plateNumber: string,
  mileage: number,
  transmission: string,
  fuelType: string,
  color: string,
  createdAt: string,
): SandboxSnapshot["vehicles"][number] {
  return {
    id,
    customerId,
    make,
    model,
    year,
    plateNumber,
    vin: null,
    mileage,
    transmission,
    engineSize: null,
    variant: null,
    fuelType,
    color,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };
}

function product(
  id: string,
  name: string,
  sku: string,
  productType: SandboxSnapshot["products"][number]["productType"],
  categoryName: string,
  brandName: string,
  costPrice: number,
  sellingPrice: number,
  reorderLevel: number,
  availableQuantity: number,
  shelfLocation: string,
  createdAt: string,
  supplierId: string,
): SandboxSnapshot["products"][number] {
  return {
    id,
    name,
    sku,
    barcode: null,
    productType,
    categoryName,
    brandName,
    unitId: ID.unit,
    unitLabel: "pc",
    supplierId,
    costPrice,
    sellingPrice,
    reorderLevel,
    availableQuantity,
    shelfLocation,
    description: null,
    productImageUrl: null,
    websiteVisible: true,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };
}

function line(
  id: string,
  parentId: string,
  itemType: SandboxSnapshot["quotationLines"][number]["itemType"],
  productId: string | null,
  serviceId: string | null,
  description: string,
  quantity: number,
  unitPrice: number,
): SandboxSnapshot["quotationLines"][number] {
  return {
    id,
    parentId,
    itemType,
    productId,
    serviceId,
    description,
    quantity,
    unitPrice,
    total: quantity * unitPrice,
  };
}

function staffMember(
  id: string,
  staffCode: string,
  firstName: string,
  lastName: string,
  documentTitle: string,
  role: SandboxSnapshot["staff"][number]["role"],
  isPayrollEligible: boolean,
  createdAt: string,
  compensation: SandboxSnapshot["staff"][number]["compensation"],
  governmentIds?: {
    sssNumber: string;
    philhealthNumber: string;
    tinNumber: string;
    pagibigNumber: string;
  },
): SandboxSnapshot["staff"][number] {
  return {
    id,
    staffCode,
    firstName,
    lastName,
    documentTitle,
    role,
    isPayrollEligible,
    contactNumber: "0917 000 0000",
    address: null,
    sssNumber: governmentIds?.sssNumber ?? null,
    philhealthNumber: governmentIds?.philhealthNumber ?? null,
    tinNumber: governmentIds?.tinNumber ?? null,
    pagibigNumber: governmentIds?.pagibigNumber ?? null,
    emergencyContactName: null,
    emergencyContactNumber: null,
    status: "active",
    createdAt,
    updatedAt: createdAt,
    schedule: isPayrollEligible
      ? {
          id: `${id}-schedule`,
          staffId: id,
          shiftStartTime: "08:00:00",
          shiftEndTime: "17:00:00",
          graceMinutes: 10,
          mondayIsWorkday: true,
          tuesdayIsWorkday: true,
          wednesdayIsWorkday: true,
          thursdayIsWorkday: true,
          fridayIsWorkday: true,
          saturdayIsWorkday: true,
          sundayIsWorkday: false,
          notes: null,
        }
      : null,
    compensation,
  };
}

function lookup(
  id: string,
  lookupType: SandboxSnapshot["lookupOptions"][number]["lookupType"],
  label: string,
  sortOrder: number,
): SandboxSnapshot["lookupOptions"][number] {
  return { id, lookupType, label, status: "active", sortOrder };
}

export function createSandboxShopSettings(): SandboxShopSettings {
  return {
    themePrimaryColor: DEFAULT_BRAND_PACK.primaryColor,
    themeAccentColor: DEFAULT_BRAND_PACK.accentColor,
    websiteUrl: "https://sampleautocare.test",
    facebookUrl: "https://facebook.com/sampleautocare",
    facebookLabel: "Sample Auto Care",
    storeHours: mapStoreHoursToFormValues([...DEFAULT_BRAND_PACK.storeHours]),
    documentSequences: SETTINGS_DOCUMENT_SEQUENCE_DEFAULTS.map((item) => ({
      key: item.key,
      prefix: item.prefix,
      padding: item.padding,
    })),
  };
}
