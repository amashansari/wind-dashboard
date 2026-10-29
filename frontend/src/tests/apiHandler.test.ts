import { describe, it, expect } from "vitest";
import { getQuery } from "../utils/apiHandler";

describe("apiHandler getQuery utility", () => {
  it("constructs correct query strings for non-empty parameters", () => {
    const payload = {
      startDate: "2026-01-01",
      endDate: "2026-01-07",
      cutoffPreset: "day_ahead_12",
    };
    const query = getQuery(payload);
    expect(query).toBe("?startDate=2026-01-01&endDate=2026-01-07&cutoffPreset=day_ahead_12");
  });

  it("filters out null, undefined, and empty string parameters", () => {
    const payload = {
      startDate: "2026-01-01",
      customCutoff: null,
      optionalParam: undefined,
      emptyString: "",
      count: 42,
    };
    const query = getQuery(payload);
    expect(query).toBe("?startDate=2026-01-01&count=42");
  });

  it("returns empty string if all parameters are null or empty", () => {
    const payload = {
      a: null,
      b: undefined,
      c: "",
    };
    expect(getQuery(payload)).toBe("");
  });
});
