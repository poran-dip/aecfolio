import { describe, expect, it } from "vitest";
import { ownerPrefix, sniffContentType } from "./uploads";

const bytes = (...values: (number | string)[]) =>
  new Uint8Array(
    values.flatMap((v) =>
      typeof v === "string" ? [...v].map((ch) => ch.charCodeAt(0)) : [v],
    ),
  );

describe("sniffContentType", () => {
  it("recognises every allowed type from its leading bytes", () => {
    expect(sniffContentType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(
      sniffContentType(bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a, 0, 0)),
    ).toBe("image/png");
    expect(sniffContentType(bytes("RIFF", 0, 0, 0, 0, "WEBP"))).toBe(
      "image/webp",
    );
    expect(sniffContentType(bytes("%PDF-1.7"))).toBe("application/pdf");
  });

  it("returns null for anything else, including HTML and SVG", () => {
    expect(sniffContentType(bytes("<html><body>"))).toBeNull();
    expect(sniffContentType(bytes("<svg xmlns="))).toBeNull();
    expect(sniffContentType(bytes("GIF89a"))).toBeNull();
    expect(sniffContentType(new Uint8Array())).toBeNull();
  });
});

describe("ownerPrefix", () => {
  it("keeps proofs and avatars in separate namespaces", () => {
    expect(ownerPrefix("proof", "abc")).toBe("proofs/abc/");
    expect(ownerPrefix("avatar", "abc")).toBe("avatars/abc/");
  });
});
