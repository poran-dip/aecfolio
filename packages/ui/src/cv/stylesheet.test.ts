import { describe, expect, it } from "vitest";
import { compileCvCss } from "../../scripts/build-css";
import { cvStylesheet } from "./generated/stylesheet";

describe("the committed stylesheet", () => {
  it("matches what src/styles/cv.css compiles to today", () => {
    expect(cvStylesheet).toBe(compileCvCss());
  });

  it("carries no Preflight", () => {
    expect(cvStylesheet).not.toContain("abbr:where([title])");
    expect(cvStylesheet).not.toContain("-moz-tab-size");
    expect(cvStylesheet).not.toContain('[type="button"]');
  });

  it("defines the college's colours at the exact hex given", () => {
    expect(cvStylesheet).toContain(
      "--color-turquoise-500: oklch(0.6365 0.1527 242.6)",
    );
    expect(cvStylesheet).toContain(
      "--color-red-500: oklch(0.609 0.1938 30.44)",
    );
  });

  it("puts the page margin on @page, where it repeats per page", () => {
    expect(cvStylesheet).toMatch(/@page\s*\{[^}]*margin:/);
  });

  it("leaves the .cv-page element itself with no page geometry", () => {
    const rule = /(^|\})\s*\.cv-page\s*\{([^}]*)\}/m.exec(cvStylesheet)?.[2];
    expect(rule).toBeTruthy();
    expect(rule).not.toMatch(/(^|;)\s*padding/);
    expect(rule).not.toMatch(/(^|;)\s*width/);
    expect(rule).not.toMatch(/(^|;)\s*min-height/);
  });

  it("draws the screen sheet from the same custom properties", () => {
    expect(cvStylesheet).toMatch(
      /\.cv-sheet \.cv-page\s*\{[^}]*var\(--cv-page-padding-block\)/,
    );
  });

  it("scopes its reset to .cv-page", () => {
    expect(cvStylesheet).toContain(".cv-page");
    expect(cvStylesheet).not.toMatch(/^\s*body\s*\{/m);
  });
});
