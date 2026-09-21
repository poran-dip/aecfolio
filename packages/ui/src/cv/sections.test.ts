import { describe, expect, it } from "vitest";
import { defaultSectionsConfig, parseTemplateOptions } from "./manifest";
import { arrangeEntries, orderEntries, resolveSections } from "./sections";
import { standardManifest } from "./templates/standard/manifest";

const entry = (id: string) => ({ id });

describe("orderEntries", () => {
  it("leaves entries alone when nothing is saved", () => {
    const entries = [entry("a"), entry("b")];
    expect(orderEntries(entries, []).map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("applies the saved order", () => {
    const entries = [entry("a"), entry("b"), entry("c")];
    expect(orderEntries(entries, ["c", "a", "b"]).map((e) => e.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("keeps an entry the saved order has never seen, at the end", () => {
    const entries = [entry("a"), entry("new"), entry("b")];
    expect(orderEntries(entries, ["b", "a"]).map((e) => e.id)).toEqual([
      "b",
      "a",
      "new",
    ]);
  });

  it("ignores ids in the saved order that no longer exist", () => {
    const entries = [entry("a")];
    expect(orderEntries(entries, ["deleted", "a"]).map((e) => e.id)).toEqual([
      "a",
    ]);
  });

  it("does not mutate its input", () => {
    const entries = [entry("a"), entry("b")];
    orderEntries(entries, ["b", "a"]);
    expect(entries.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("arrangeEntries", () => {
  const entries = [entry("a"), entry("b"), entry("c")];
  const ids = (list: { id: string }[]) => list.map((e) => e.id);

  it("shows everything, in the original order, when nothing is saved", () => {
    expect(
      ids(arrangeEntries(entries, { entryOrder: [], hiddenEntries: [] })),
    ).toEqual(["a", "b", "c"]);
  });

  it("drops the entries switched off", () => {
    expect(
      ids(arrangeEntries(entries, { entryOrder: [], hiddenEntries: ["b"] })),
    ).toEqual(["a", "c"]);
  });

  it("orders what is left by the saved order", () => {
    expect(
      ids(
        arrangeEntries(entries, {
          entryOrder: ["c", "b", "a"],
          hiddenEntries: ["b"],
        }),
      ),
    ).toEqual(["c", "a"]);
  });

  it("shows an entry created after the student last saved", () => {
    expect(
      ids(
        arrangeEntries([...entries, entry("new")], {
          entryOrder: ["a", "b", "c"],
          hiddenEntries: ["b"],
        }),
      ),
    ).toEqual(["a", "c", "new"]);
  });

  it("is empty when every entry is switched off", () => {
    expect(
      arrangeEntries(entries, {
        entryOrder: [],
        hiddenEntries: ["a", "b", "c"],
      }),
    ).toEqual([]);
  });

  it("ignores ids that no longer exist", () => {
    expect(
      ids(arrangeEntries(entries, { entryOrder: [], hiddenEntries: ["gone"] })),
    ).toEqual(["a", "b", "c"]);
  });

  it("treats a section saved before hiddenEntries existed as showing everything", () => {
    const old = { entryOrder: [], hiddenEntries: [] } as {
      entryOrder: string[];
    };
    expect(ids(arrangeEntries(entries, old))).toEqual(["a", "b", "c"]);
  });

  it("does not mutate its input", () => {
    arrangeEntries(entries, { entryOrder: ["c"], hiddenEntries: ["a"] });
    expect(ids(entries)).toEqual(["a", "b", "c"]);
  });
});

describe("resolveSections", () => {
  it("drops excluded sections and sorts by order", () => {
    const resolved = resolveSections(standardManifest, [
      {
        type: "projects",
        include: true,
        order: 2,
        entryOrder: [],
        hiddenEntries: [],
      },
      {
        type: "experiences",
        include: false,
        order: 1,
        entryOrder: [],
        hiddenEntries: [],
      },
      {
        type: "achievements",
        include: true,
        order: 0,
        entryOrder: [],
        hiddenEntries: [],
      },
    ]);
    expect(resolved.map((s) => s.kind)).toEqual(["achievements", "projects"]);
  });

  it("drops a section this template cannot draw", () => {
    const resolved = resolveSections(
      { ...standardManifest, supportedSections: ["projects"] },
      [
        {
          type: "projects",
          include: true,
          order: 0,
          entryOrder: [],
          hiddenEntries: [],
        },
        {
          type: "achievements",
          include: true,
          order: 1,
          entryOrder: [],
          hiddenEntries: [],
        },
      ],
    );
    expect(resolved.map((s) => s.kind)).toEqual(["projects"]);
  });

  it("carries the custom section id through", () => {
    const [section] = resolveSections(standardManifest, [
      {
        type: "custom",
        customSectionId: "cs1",
        include: true,
        order: 0,
        entryOrder: ["x"],
        hiddenEntries: [],
      },
    ]);
    expect(section).toEqual({
      kind: "custom",
      customSectionId: "cs1",
      entryOrder: ["x"],
      hiddenEntries: [],
    });
  });

  it("carries the switched-off entries through", () => {
    const [section] = resolveSections(standardManifest, [
      {
        type: "projects",
        include: true,
        order: 0,
        entryOrder: [],
        hiddenEntries: ["p1"],
      },
    ]);
    expect(section.hiddenEntries).toEqual(["p1"]);
  });

  it("reads a section saved before hiddenEntries existed as hiding nothing", () => {
    const legacy = [
      {
        type: "projects",
        include: true,
        order: 0,
        entryOrder: [],
        hiddenEntries: [],
      },
    ] as unknown as Parameters<typeof resolveSections>[1];
    expect(resolveSections(standardManifest, legacy)[0].hiddenEntries).toEqual(
      [],
    );
  });
});

describe("defaultSectionsConfig", () => {
  it("includes the manifest's built-ins in order", () => {
    const config = defaultSectionsConfig(standardManifest);
    expect(config.map((s) => s.type)).toEqual([
      ...standardManifest.defaultSections,
    ]);
    expect(config.every((s) => s.include)).toBe(true);
    expect(config.map((s) => s.order)).toEqual(config.map((_, i) => i));
  });

  it("includes every custom section the student has, after the built-ins", () => {
    const config = defaultSectionsConfig(standardManifest, [
      // biome-ignore lint/suspicious/noExplicitAny: only the id is read here
      { id: "cs1", name: "Publications", entries: [] } as any,
    ]);
    const last = config.at(-1);
    expect(last).toMatchObject({ type: "custom", customSectionId: "cs1" });
    expect(last?.include).toBe(true);
  });
});

describe("parseTemplateOptions", () => {
  it("fills every default from an empty bag", () => {
    expect(parseTemplateOptions(standardManifest, {})).toMatchObject({
      accent: "turquoise",
      density: "comfortable",
      showLanguages: true,
      contactColumns: 3,
    });
  });

  it("keeps valid values", () => {
    expect(
      parseTemplateOptions(standardManifest, { accent: "red" }).accent,
    ).toBe("red");
  });

  it("falls back to defaults rather than throwing on rubbish", () => {
    expect(
      parseTemplateOptions(standardManifest, { accent: "chartreuse" }).accent,
    ).toBe("turquoise");
    expect(parseTemplateOptions(standardManifest, undefined).density).toBe(
      "comfortable",
    );
  });

  it("drops options the manifest does not know about", () => {
    const parsed = parseTemplateOptions(standardManifest, {
      accent: "ink",
      leftoverFromAnotherTemplate: true,
    });
    expect(parsed).not.toHaveProperty("leftoverFromAnotherTemplate");
    expect(parsed.accent).toBe("ink");
  });
});
