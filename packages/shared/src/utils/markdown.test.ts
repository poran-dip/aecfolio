import { describe, expect, it } from "vitest";
import { stripInlineMarkdown } from "./markdown";

describe("stripInlineMarkdown", () => {
  it("strips bold", () => {
    expect(stripInlineMarkdown("Ananya **Borah**")).toBe("Ananya Borah");
  });

  it("strips italic, with either delimiter", () => {
    expect(stripInlineMarkdown("*Poran* Boruah")).toBe("Poran Boruah");
    expect(stripInlineMarkdown("_Poran_ Boruah")).toBe("Poran Boruah");
  });

  it("strips strikethrough, code, and links", () => {
    expect(stripInlineMarkdown("~~Old~~ Name")).toBe("Old Name");
    expect(stripInlineMarkdown("`Rita` Devi")).toBe("Rita Devi");
    expect(stripInlineMarkdown("[Rita Devi](https://example.com)")).toBe(
      "Rita Devi",
    );
  });

  it("leaves plain text untouched", () => {
    expect(stripInlineMarkdown("Poran Boruah")).toBe("Poran Boruah");
  });

  it("trims surrounding whitespace", () => {
    expect(stripInlineMarkdown("  Poran Boruah  ")).toBe("Poran Boruah");
  });
});
