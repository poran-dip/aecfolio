import { describe, expect, it } from "vitest";
import { pageBox } from "./page";

describe("pageBox", () => {
  it("is an A4 sheet in CSS pixels", () => {
    const box = pageBox({ blockMm: 10, inlineMm: 12 });
    expect(box.width).toBeCloseTo(793.7, 1);
    expect(box.height).toBeCloseTo(1122.52, 1);
  });

  it("gives the content width as the sheet minus both inline margins", () => {
    expect(pageBox({ blockMm: 10, inlineMm: 12 }).contentWidth).toBeCloseTo(
      702.99,
      1,
    );
    expect(pageBox({ blockMm: 8, inlineMm: 10 }).contentWidth).toBeCloseTo(
      718.11,
      1,
    );
  });

  it.each([
    [{ blockMm: 10, inlineMm: 12 }, 1047],
    [{ blockMm: 8, inlineMm: 10 }, 1063],
    [{ blockMm: 10.5, inlineMm: 12 }, 1044],
    [{ blockMm: 9, inlineMm: 11 }, 1055],
    [{ blockMm: 7.5, inlineMm: 9 }, 1066],
    [{ blockMm: 13, inlineMm: 15 }, 1025],
  ])(
    "rounds the printable height up to a whole pixel (%j -> %d)",
    (margins, height) => {
      expect(pageBox(margins).contentHeight).toBe(height);
    },
  );

  it("leaves less room the larger the margin", () => {
    expect(pageBox({ blockMm: 12, inlineMm: 12 }).contentHeight).toBeLessThan(
      pageBox({ blockMm: 8, inlineMm: 12 }).contentHeight,
    );
  });
});
