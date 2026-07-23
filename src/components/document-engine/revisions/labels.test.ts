import { describe, expect, it } from "vitest";

import {
  buildRevisionDisplayNumber,
  formatRevisionLabel,
  formatRevisionMetadataLabel,
  stripRevisionSuffix,
} from "@/components/document-engine/revisions";

describe("document revision labels", () => {
  it("formats revision numbers for display", () => {
    expect(formatRevisionLabel(0)).toBe("Original Revision");
    expect(formatRevisionLabel(1)).toBe("Revision 1");
    expect(formatRevisionLabel(2)).toBe("Revision 2");
  });

  it("builds revision display numbers", () => {
    expect(buildRevisionDisplayNumber("QT-MAIN-0001", 0)).toBe("QT-MAIN-0001");
    expect(buildRevisionDisplayNumber("QT-MAIN-0001", 1)).toBe("QT-MAIN-0001 Rev.1");
    expect(buildRevisionDisplayNumber("QT-MAIN-0001", 2)).toBe("QT-MAIN-0001 Rev.2");
  });

  it("strips revision suffixes", () => {
    expect(stripRevisionSuffix("QT-MAIN-0001 Rev.2")).toBe("QT-MAIN-0001");
    expect(stripRevisionSuffix("Service Report Rev.1")).toBe("Service Report");
  });

  it("combines revision metadata labels", () => {
    expect(
      formatRevisionMetadataLabel({
        revisionNumber: 2,
        isCurrentRevision: true,
      }),
    ).toBe("Revision 2 · Current Revision");
  });
});
