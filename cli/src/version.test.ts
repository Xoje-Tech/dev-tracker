import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getCliVersion,
  resetCliVersionCache,
  getCliPackageJsonPath,
} from "./version";

describe("getCliVersion", () => {
  const originalEnv = process.env.DT_CLI_VERSION;

  beforeEach(() => {
    delete process.env.DT_CLI_VERSION;
    resetCliVersionCache();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DT_CLI_VERSION;
    } else {
      process.env.DT_CLI_VERSION = originalEnv;
    }
    resetCliVersionCache();
  });

  it("reads version from the CLI's package.json by walking up from the source tree", () => {
    const version = getCliVersion();
    // We're inside the CLI's source tree, so the package.json must
    // resolve to something truthy. We don't assert an exact value because
    // the dev workspace may differ, but the dev-tracker-cli name match
    // guarantees it's the right file.
    expect(version).toBeTruthy();
    expect(version).not.toBe("unknown");
    // Should match a semver-ish pattern.
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("returns the DT_CLI_VERSION env var when set, regardless of package.json", () => {
    process.env.DT_CLI_VERSION = "9.9.9-custom";
    resetCliVersionCache();
    expect(getCliVersion()).toBe("9.9.9-custom");
  });

  it("treats an empty DT_CLI_VERSION as not set and falls back to package.json", () => {
    process.env.DT_CLI_VERSION = "   ";
    resetCliVersionCache();
    expect(getCliVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("caches the result across calls within the same process", () => {
    const first = getCliVersion();
    // Mutate the env to simulate a change after the first call.
    process.env.DT_CLI_VERSION = "9.9.9-should-be-ignored";
    // Without resetCliVersionCache, the cached value is returned.
    expect(getCliVersion()).toBe(first);
  });

  it("resetCliVersionCache clears the cache so env changes take effect", () => {
    getCliVersion();
    process.env.DT_CLI_VERSION = "9.9.9-reset";
    resetCliVersionCache();
    expect(getCliVersion()).toBe("9.9.9-reset");
  });
});

describe("getCliPackageJsonPath", () => {
  beforeEach(() => {
    resetCliVersionCache();
  });

  it("resolves to a real path on disk", () => {
    const path = getCliPackageJsonPath();
    expect(path).toBeTruthy();
    expect(path).toMatch(/package\.json$/);
  });
});