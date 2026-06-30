import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import FormField from "@client/shared/interface/components/molecules/FormField.vue";
import BaseInput from "@client/shared/interface/components/atoms/BaseInput.vue";

describe("FormField", () => {
  it("renders the label text", () => {
    const wrapper = mount(FormField, {
      props: { label: "Email" },
      slots: { default: BaseInput },
    });
    expect(wrapper.text()).toContain("Email");
  });

  it("shows a required marker when required is true", () => {
    const wrapper = mount(FormField, {
      props: { label: "Email", required: true },
      slots: { default: BaseInput },
    });
    expect(wrapper.text()).toContain("*");
  });

  it("does not show a required marker when required is false", () => {
    const wrapper = mount(FormField, {
      props: { label: "Email" },
      slots: { default: BaseInput },
    });
    expect(wrapper.text()).not.toContain("*");
  });

  it("renders the error message when error is provided", () => {
    const wrapper = mount(FormField, {
      props: { label: "Email", error: "Required" },
      slots: { default: BaseInput },
    });
    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toBe("Required");
  });

  it("does not render an error element when error is null", () => {
    const wrapper = mount(FormField, {
      props: { label: "Email" },
      slots: { default: BaseInput },
    });
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("associates the label with the input via html-for", () => {
    const wrapper = mount(FormField, {
      props: { label: "Email", htmlFor: "email" },
      slots: { default: BaseInput },
    });
    const label = wrapper.find("label");
    expect(label.attributes("for")).toBe("email");
  });
});
