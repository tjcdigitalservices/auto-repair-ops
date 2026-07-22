import { describe, expect, it } from "vitest";

import { resolveSettingsPageTab } from "@/features/settings/utils";

describe("resolveSettingsPageTab", () => {
  it("defaults to profile for missing or unknown values", () => {
    expect(resolveSettingsPageTab(undefined)).toBe("profile");
    expect(resolveSettingsPageTab("")).toBe("profile");
    expect(resolveSettingsPageTab("general")).toBe("profile");
  });

  it("accepts each supported settings tab", () => {
    expect(resolveSettingsPageTab("profile")).toBe("profile");
    expect(resolveSettingsPageTab("branches")).toBe("branches");
    expect(resolveSettingsPageTab("operations")).toBe("operations");
    expect(resolveSettingsPageTab("theme")).toBe("theme");
    expect(resolveSettingsPageTab("presence")).toBe("presence");
    expect(resolveSettingsPageTab("documents")).toBe("documents");
  });
});
