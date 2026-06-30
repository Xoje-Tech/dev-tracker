import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import BaseAvatar from "@client/shared/interface/components/atoms/BaseAvatar.vue";

describe("BaseAvatar", () => {
  it("renders initials for a single name", () => {
    const wrapper = mount(BaseAvatar, { props: { name: "Alice" } });
    expect(wrapper.text()).toBe("AL");
  });

  it("renders first+last initials for a full name", () => {
    const wrapper = mount(BaseAvatar, { props: { name: "Alice Wong" } });
    expect(wrapper.text()).toBe("AW");
  });

  it("renders ? for an empty name", () => {
    const wrapper = mount(BaseAvatar, { props: { name: "" } });
    expect(wrapper.text()).toBe("?");
  });

  it("renders an img tag when src is provided", () => {
    const wrapper = mount(BaseAvatar, {
      props: { name: "Alice", src: "https://example.com/a.png" },
    });
    expect(wrapper.find("img").exists()).toBe(true);
    expect(wrapper.find("img").attributes("alt")).toBe("Alice");
  });

  it("caps initials to two characters", () => {
    const wrapper = mount(BaseAvatar, { props: { name: "Alexandros" } });
    expect(wrapper.text()).toBe("AL");
  });

  it("applies size classes for size=sm", () => {
    const wrapper = mount(BaseAvatar, { props: { name: "Alice", size: "sm" } });
    expect(wrapper.classes().join(" ")).toContain("h-8");
  });
});
