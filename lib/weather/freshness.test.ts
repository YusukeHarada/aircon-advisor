import { describe, expect, it } from "vitest";
import { isCacheFresh } from "./freshness";

describe("isCacheFresh", () => {
  const now = new Date("2026-07-19T12:00:00+09:00");
  const maxAgeMs = 6 * 60 * 60 * 1000;

  it("6時間以内なら新鮮", () => {
    const fetchedAt = new Date("2026-07-19T09:00:00+09:00");
    expect(isCacheFresh(fetchedAt, maxAgeMs, now)).toBe(true);
  });

  it("ちょうど6時間は新鮮の境界内", () => {
    const fetchedAt = new Date("2026-07-19T06:00:00+09:00");
    expect(isCacheFresh(fetchedAt, maxAgeMs, now)).toBe(true);
  });

  it("6時間を超えたら古い", () => {
    const fetchedAt = new Date("2026-07-19T05:59:59+09:00");
    expect(isCacheFresh(fetchedAt, maxAgeMs, now)).toBe(false);
  });
});
