import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import BaseBadge from "@client/shared/interface/components/atoms/BaseBadge.vue";

describe("BaseBadge", () => {
  it("renders the slot text", () => {
    const wrapper = mount(BaseBadge, { slots: { default: "Active" } });
    expect(wrapper.text()).toBe("Active");
  });

  it("uses default slate classes for variant=default", () => {
    const wrapper = mount(BaseBadge, { slots: { default: "X" } });
    expect(wrapper.classes().join(" ")).toContain("bg-slate-100");
  });

  it("uses success colors for variant=success", () => {
    const wrapper = mount(BaseBadge, {
      props: { variant: "success" },
      slots: { default: "X" },
    });
    expect(wrapper.classes().join(" ")).toContain("bg-emerald-100");
  });

  it("uses danger colors for variant=danger", () => {
    const wrapper = mount(BaseBadge, {
      props: { variant: "danger" },
      slots: { default: "X" },
    });
    expect(wrapper.classes().join(" ")).toContain("bg-red-100");
  });
});
