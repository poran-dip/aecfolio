import { Role } from "@aecfolio/shared";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { describe, expect, it } from "vitest";
import routes from "../routes";
import {
  accountPathFor,
  activeNavPath,
  homeFor,
  navItemsFor,
  ROLE_LABELS,
} from "./nav";

function pathsOf(role: Role): string[] {
  return navItemsFor(role).map((item) => item.to);
}

function collectRoutePaths(
  entries: readonly RouteConfigEntry[],
  prefix = "",
): string[] {
  const found: string[] = [];

  for (const entry of entries) {
    const path = entry.path
      ? `${prefix}/${entry.path}`.replace(/\/+/g, "/")
      : prefix;
    if (entry.path) found.push(path);
    if (entry.children) found.push(...collectRoutePaths(entry.children, path));
  }

  return found;
}

describe("nav is filtered by capability", () => {
  it("gives a student their own three screens and nothing staff", () => {
    expect(pathsOf(Role.STUDENT)).toEqual(["/app", "/export", "/history"]);
  });

  it("gives faculty reading and exporting only", () => {
    expect(pathsOf(Role.FACULTY)).toEqual(["/students", "/students/exports"]);
  });

  it("gives a mod the review surface but not cohort promotion", () => {
    const paths = pathsOf(Role.MOD);
    expect(paths).toContain("/verifications");
    expect(paths).toContain("/import");
    expect(paths).toContain("/faculty");
    expect(paths).toContain("/audit");
    expect(paths).not.toContain("/cohort");
  });

  it("gives an admin everything a mod has, plus cohort promotion", () => {
    const mod = pathsOf(Role.MOD);
    const admin = pathsOf(Role.ADMIN);
    for (const path of mod) expect(admin).toContain(path);
    expect(admin).toContain("/cohort");
  });

  it("never shows a student a staff screen or a staff member /app", () => {
    for (const path of pathsOf(Role.STUDENT)) {
      expect(pathsOf(Role.ADMIN)).not.toContain(path);
    }
    for (const path of pathsOf(Role.ADMIN)) {
      expect(pathsOf(Role.STUDENT)).not.toContain(path);
    }
  });
});

describe("every nav destination is a real route", () => {
  const declared = new Set(collectRoutePaths(routes));

  for (const role of Object.values(Role)) {
    it(`${role}`, () => {
      for (const path of pathsOf(role)) {
        expect(declared.has(path)).toBe(true);
      }
    });
  }

  it("covers the /dashboard target of every role", () => {
    for (const role of Object.values(Role)) {
      expect(declared.has(homeFor(role))).toBe(true);
    }
  });
});

describe("home and account paths", () => {
  it("sends each role somewhere it can actually open", () => {
    expect(homeFor(Role.STUDENT)).toBe("/app");
    expect(homeFor(Role.FACULTY)).toBe("/students");
    expect(homeFor(Role.MOD)).toBe("/verifications");
    expect(homeFor(Role.ADMIN)).toBe("/verifications");

    for (const role of Object.values(Role)) {
      const home = homeFor(role);
      const reachable = pathsOf(role);
      expect(reachable).toContain(home);
    }
  });

  it("puts a student's account at the top of /app, not a /profile page", () => {
    expect(accountPathFor(Role.STUDENT)).toBe("/app");
    expect(accountPathFor(Role.FACULTY)).toBe("/profile");
    expect(accountPathFor(Role.ADMIN)).toBe("/profile");
  });

  it("labels every role", () => {
    for (const role of Object.values(Role)) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });
});

describe("the highlighted nav item is the longest match", () => {
  const items = navItemsFor(Role.ADMIN);

  it("prefers Bulk exports over Students on /students/exports", () => {
    expect(activeNavPath("/students/exports", items)).toBe("/students/exports");
  });

  it("highlights Students on a student detail page", () => {
    expect(activeNavPath("/students/abc123", items)).toBe("/students");
  });

  it("highlights Faculty on a faculty detail page", () => {
    expect(activeNavPath("/faculty/abc123", items)).toBe("/faculty");
  });

  it("does not highlight a non-nested item from a child path", () => {
    expect(activeNavPath("/import/anything", items)).toBeNull();
  });

  it("returns null for a path the role cannot open", () => {
    expect(activeNavPath("/cohort", navItemsFor(Role.MOD))).toBeNull();
  });
});
