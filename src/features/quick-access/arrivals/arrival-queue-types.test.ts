import { describe, expect, it } from "vitest";

import {
  matchesArrivalQueueFilter,
  summarizeArrivalQueue,
  type ArrivalQueueItem,
} from "@/features/quick-access/arrivals/arrival-queue-types";

function item(status: ArrivalQueueItem["queueStatus"]): ArrivalQueueItem {
  return {
    id: "1",
    customerId: "c1",
    vehicleId: "v1",
    customerName: "Customer",
    vehicleLabel: "Car",
    plateNumber: "ABC1234",
    arrivedAt: new Date().toISOString(),
    intakeStartedAt: null,
    lastActivityAt: new Date().toISOString(),
    arrivalSource: "manual",
    queueStatus: status,
    queueStatusLabel: status,
    primaryAction: { label: "New Quotation", href: "/quotations/new", state: "new_quotation" },
    intakeActionLabel: "Start Intake",
  };
}

describe("arrival queue helpers", () => {
  it("summarizes queue buckets", () => {
    const summary = summarizeArrivalQueue([
      item("waiting_intake"),
      item("current_intake"),
      item("job_order_in_progress"),
      item("ready_for_billing"),
      item("completed"),
    ]);

    expect(summary).toEqual({
      waiting: 1,
      currentIntake: 1,
      inService: 1,
      ready: 1,
      released: 1,
    });
  });

  it("filters in-progress arrivals", () => {
    expect(matchesArrivalQueueFilter("draft_quotation", "in_progress")).toBe(true);
    expect(matchesArrivalQueueFilter("waiting_intake", "in_progress")).toBe(false);
  });
});
