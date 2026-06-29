import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";

describe("BaseButton", () => {
  it("renders slot content", () => {
    const wrapper = mount(BaseButton, { slots: { default: "Click me" } });
    expect(wrapper.text()).toBe("Click me");
  });

  it("does not emit click when disabled", async () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true },
      slots: { default: "X" },
    });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("click")).toBeUndefined();
  });

  it("is disabled when the disabled prop is true", () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true },
      slots: { default: "X" },
    });
    expect(wrapper.attributes("disabled")).toBeDefined();
  });

  it("is disabled while loading even without the disabled prop", () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true },
      slots: { default: "X" },
    });
    expect(wrapper.attributes("disabled")).toBeDefined();
  });

  it("applies block layout when the block prop is true", () => {
    const wrapper = mount(BaseButton, {
      props: { block: true },
      slots: { default: "X" },
    });
    expect(wrapper.classes()).toContain("w-full");
  });

  it("shows a spinner while loading", () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true },
      slots: { default: "Save" },
    });
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true);
  });

  it("defaults to variant=primary", () => {
    const wrapper = mount(BaseButton, { slots: { default: "X" } });
    expect(wrapper.classes().join(" ")).toContain("bg-blue-600");
  });

  it("uses the danger variant colors when variant=danger", () => {
    const wrapper = mount(BaseButton, {
      props: { variant: "danger" },
      slots: { default: "X" },
    });
    expect(wrapper.classes().join(" ")).toContain("bg-red-600");
  });

  it("uses the secondary variant colors when variant=secondary", () => {
    const wrapper = mount(BaseButton, {
      props: { variant: "secondary" },
      slots: { default: "X" },
    });
    expect(wrapper.classes().join(" ")).toContain("border-gray-300");
  });
});
