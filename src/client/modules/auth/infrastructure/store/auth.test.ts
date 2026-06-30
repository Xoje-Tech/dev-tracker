import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "@client/auth/infrastructure/store/auth";
import { mockFetch } from "../../../../../../tests/client-helpers";

describe("useAuthStore", () => {
  let fetch: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    setActivePinia(createPinia());
    fetch = mockFetch();
  });

  it("login sets user on success", async () => {
    const user = { id: "u1", email: "a@b.com", name: "Alice", apiKey: null };
    fetch.enqueue({ status: 200, body: user });

    const store = useAuthStore();
    await store.login({ email: "a@b.com", password: "pw123456" });
    await fetch.drain();

    expect(store.user).toEqual(user);
    expect(store.isAuthenticated).toBe(true);
    expect(store.error).toBeNull();
  });

  it("login sets error and rethrows on failure", async () => {
    fetch.enqueue({ status: 401, body: { message: "Invalid credentials" } });

    const store = useAuthStore();
    await expect(
      store.login({ email: "a@b.com", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials");
    await fetch.drain();

    expect(store.user).toBeNull();
    expect(store.error).toBe("Invalid credentials");
  });

  it("logout clears user even if the server call fails", async () => {
    const store = useAuthStore();
    store.user = { id: "u1", email: "a@b.com", name: "Alice", apiKey: null };
    fetch.enqueue({ status: 500, body: { message: "boom" } });

    await store.logout();
    await fetch.drain();

    expect(store.user).toBeNull();
  });

  it("fetchMe sets user on 200, clears on 401", async () => {
    const user = { id: "u2", email: "b@c.com", name: "Bob", apiKey: null };

    const store = useAuthStore();

    fetch.enqueue({ status: 200, body: user });
    await store.fetchMe();
    await fetch.drain();
    expect(store.user).toEqual(user);
    expect(store.lastErrorReason).toBeNull();

    fetch.enqueue({ status: 401, body: null });
    await store.fetchMe();
    await fetch.drain();
    expect(store.user).toBeNull();
  });

  it("fetchMe sets lastErrorReason='expired' on 401", async () => {
    const store = useAuthStore();
    fetch.enqueue({ status: 401, body: { message: "Unauthorized" } });

    await store.fetchMe();
    await fetch.drain();

    expect(store.user).toBeNull();
    expect(store.lastErrorReason).toBe("expired");
  });

  it("fetchMe sets lastErrorReason='network' on 5xx", async () => {
    const store = useAuthStore();
    fetch.enqueue({ status: 500, body: { message: "boom" } });

    await store.fetchMe();
    await fetch.drain();

    expect(store.user).toBeNull();
    expect(store.lastErrorReason).toBe("network");
  });

  it("fetchMe sets lastErrorReason='auth_error' on non-401 4xx", async () => {
    const store = useAuthStore();
    fetch.enqueue({ status: 403, body: { message: "Forbidden" } });

    await store.fetchMe();
    await fetch.drain();

    expect(store.user).toBeNull();
    expect(store.lastErrorReason).toBe("auth_error");
  });

  it("fetchMe sets lastErrorReason='network' when fetch itself throws", async () => {
    const store = useAuthStore();
    // Force the next mocked fetch to reject instead of returning a response.
    fetch.enqueue({ status: 200, body: null });
    // Replace the in-flight mock with a rejecting one for this call only.
    const spy = (globalThis.fetch as unknown as ReturnType<typeof import("vitest").vi.fn>);
    spy.mockImplementationOnce(async () => {
      throw new TypeError("NetworkError");
    });

    await store.fetchMe();
    await fetch.drain();

    expect(store.user).toBeNull();
    expect(store.lastErrorReason).toBe("network");
  });

  it("fetchMe clears lastErrorReason on subsequent success", async () => {
    const store = useAuthStore();
    const user = { id: "u3", email: "c@d.com", name: "Cara", apiKey: null };

    // First call fails with 401 → reason='expired'
    fetch.enqueue({ status: 401, body: null });
    await store.fetchMe();
    await fetch.drain();
    expect(store.lastErrorReason).toBe("expired");

    // Second call succeeds → reason should reset
    fetch.enqueue({ status: 200, body: user });
    await store.fetchMe();
    await fetch.drain();

    expect(store.user).toEqual(user);
    expect(store.lastErrorReason).toBeNull();
  });

  it("isAuthenticated reflects user state", () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    store.user = { id: "u1", email: "a@b.com", name: "Alice", apiKey: null };
    expect(store.isAuthenticated).toBe(true);
  });

  it("clearError resets the error field", async () => {
    fetch.enqueue({ status: 500, body: { message: "boom" } });
    const store = useAuthStore();
    await expect(
      store.login({ email: "a@b.com", password: "pw123456" }),
    ).rejects.toThrow();
    await fetch.drain();

    expect(store.error).not.toBeNull();
    store.clearError();
    expect(store.error).toBeNull();
  });
});
