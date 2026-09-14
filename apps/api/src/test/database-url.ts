export function testDatabaseUrl() {
  const explicit = process.env.TEST_DATABASE_URL;
  const base = explicit ?? process.env.DATABASE_URL;

  if (!base)
    throw new Error(
      "Set DATABASE_URL (or TEST_DATABASE_URL) before running the apps/api suite.",
    );

  const url = new URL(base);
  const name = url.pathname.replace(/^\//, "");

  if (!name)
    throw new Error(
      `No database name in ${explicit ? "TEST_" : ""}DATABASE_URL`,
    );

  if (!name.endsWith("_test")) {
    if (explicit && process.env.ALLOW_UNSAFE_TEST_DB !== "1")
      throw new Error(
        `Refusing to run the suite against "${name}": it truncates every table. ` +
          "Name the test database with a _test suffix, or set ALLOW_UNSAFE_TEST_DB=1.",
      );
    url.pathname = `/${name}_test`;
  }

  return url.toString();
}

export function adminDatabaseUrl(testUrl: string) {
  const url = new URL(testUrl);
  url.pathname = "/postgres";
  return url.toString();
}

export function databaseNameOf(testUrl: string) {
  return new URL(testUrl).pathname.replace(/^\//, "");
}
