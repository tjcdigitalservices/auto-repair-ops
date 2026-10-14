import { DateTime } from "luxon";

import type { SandboxSnapshot } from "@/features/sandbox/types";
import { SANDBOX_IDS as ID } from "@/features/sandbox/ids";

const ZONE = "Asia/Manila";

export function createSandboxSeed(now = new Date()): SandboxSnapshot {
  const clock = DateTime.fromJSDate(now).setZone(ZONE);
  const createdAt = clock.minus({ days: 12 }).toUTC().toISO() ?? now.toISOString();
  const approvedAt = clock.minus({ days: 2 }).toUTC().toISO() ?? now.toISOString();
  const today = clock.toISODate() ?? "2026-10-14";
  const monthStart = clock.startOf("month").toISODate() ?? today;
  const monthEnd = clock.endOf("month").toISODate() ?? today;
  const payout = clock.endOf("month").toISODate() ?? today;
  const weekdays = recentWeekdays(clock, 4);

  return {
    version: 1,
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
    },
    sequences: {
      customer: 5,
      quotation: 3,
      jobOrder: 2,
      invoice: 3,
      payment: 3,
      staff: 4,
      document: 2,
      pos: 2,
      payroll: 2,
    },
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
    ],
    jobOrderLines: [
      line(ID.jobItem, ID.jobOrder, "service", null, ID.serviceOil, "Oil Change", 1, 650),
      line("10000000-0000-4000-8000-000000000083", ID.jobOrder, "product", ID.productFilter, null, "Oil Filter", 1, 320),
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
        jobOrderId: null,
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
        overtimeRate: null,
        allowancePerPeriod: 0,
        effectiveStartDate: monthStart,
        exemptFromAttendance: false,
      }),
      staffMember(ID.advisor, "STF-0003", "Liza", "Navarro", "Service Advisor", "service_advisor", true, createdAt, {
        payBasis: "monthly",
        baseRate: 22000,
        overtimeRate: null,
        allowancePerPeriod: 1000,
        effectiveStartDate: monthStart,
        exemptFromAttendance: false,
      }),
    ],
    attendance: weekdays.map((date, index) => ({
      id: `10000000-0000-4000-8000-0000000001${index}1`,
      staffId: ID.mechanic,
      attendanceDate: date,
      status: "present" as const,
      timeIn: `${date}T00:00:00.000Z`,
      timeOut: `${date}T08:00:00.000Z`,
      notes: null,
      approvedAt: `${date}T09:00:00.000Z`,
    })),
    payrollPeriods: [
      {
        id: ID.payroll,
        label: `${clock.toFormat("LLLL yyyy")} cut`,
        periodStartDate: monthStart,
        periodEndDate: monthEnd,
        payoutDate: payout,
        notes: "Sample payroll cut for the current month.",
        status: "draft",
        applyGovernmentDeductions: false,
        createdAt,
      },
    ],
    payrollItems: [
      {
        id: ID.payrollItem,
        periodId: ID.payroll,
        staffId: ID.mechanic,
        fullName: "Carlo Dela Cruz",
        role: "mechanic",
        netPay: 800 * weekdays.length,
        grossPay: 800 * weekdays.length,
        basePay: 800 * weekdays.length,
        presentCount: weekdays.length,
        warningCodes: [],
      },
    ],
    documents: [
      {
        id: ID.document,
        title: "Bay release checklist",
        body: "Confirm invoice balance, keys, and customer signature before the vehicle leaves the bay.",
        status: "saved",
        updatedAt: createdAt,
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
    holidays: [
      {
        id: "10000000-0000-4000-8000-0000000000aa",
        holidayDate: clock.set({ month: 12, day: 25 }).toISODate() ?? "2026-12-25",
        label: "Christmas Day",
        holidayKind: "public_holiday",
        payTreatment: "paid_regular_day",
      },
    ],
  };
}

function recentWeekdays(clock: DateTime, count: number) {
  const dates: string[] = [];
  let cursor = clock.startOf("day");
  while (dates.length < count) {
    if (cursor.weekday <= 5) {
      dates.push(cursor.toISODate() ?? cursor.toFormat("yyyy-LL-dd"));
    }
    cursor = cursor.minus({ days: 1 });
  }
  return dates.reverse();
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
    sssNumber: null,
    philhealthNumber: null,
    tinNumber: null,
    pagibigNumber: null,
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
