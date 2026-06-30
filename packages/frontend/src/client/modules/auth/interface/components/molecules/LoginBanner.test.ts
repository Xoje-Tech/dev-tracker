import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import LoginBanner from "@client/auth/interface/components/molecules/LoginBanner.vue";

describe("LoginBanner", () => {
  it("renders nothing when reason is null", () => {
    const wrapper = mount(LoginBanner, { props: { reason: null } });
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("renders nothing when reason is undefined", () => {
    const wrapper = mount(LoginBanner, { props: {} });
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("renders nothing for unknown reason values", () => {
    const wrapper = mount(LoginBanner, { props: { reason: "something-else" } });
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("renders the warning copy for 'session_expired'", () => {
    const wrapper = mount(LoginBanner, { props: { reason: "session_expired" } });
    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain("sesión expiró");
    expect(alert.classes().join(" ")).toContain("bg-amber-50");
  });

  it("renders the error copy for 'invalid_credentials'", () => {
    const wrapper = mount(LoginBanner, { props: { reason: "invalid_credentials" } });
    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain("Email o contraseña incorrectos");
    expect(alert.classes().join(" ")).toContain("bg-red-50");
  });
});