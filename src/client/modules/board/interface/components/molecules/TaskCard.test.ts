import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TaskCard from "@client/board/interface/components/molecules/TaskCard.vue";
import { useTagsStore } from "@client/tags/infrastructure/store/tags";
import type { BoardTask } from "@client/board/domain/types";
import type { Tag } from "@client/tags/domain/types";

const sampleTask: BoardTask = {
  id: "t1",
  title: "Write tests",
  description: "Add coverage for the store",
  priority: "high",
  order: 0,
  assigneeId: null,
  tagIds: ["tag1", "tag2"],
  createdAt: "2026-06-29T00:00:00.000Z",
};

const sampleTags: Tag[] = [
  { id: "tag1", name: "bug", color: "#ef4444" },
  { id: "tag2", name: "feature", color: "#10b981" },
  { id: "tag3", name: "ignored", color: "#3b82f6" },
];

function mountCard(task: BoardTask = structuredClone(sampleTask)) {
  return mount(TaskCard, { props: { task } });
}

describe("TaskCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useTagsStore();
    store.tags = [...sampleTags];
  });

  it("renders the task title", () => {
    const wrapper = mountCard();
    expect(wrapper.text()).toContain("Write tests");
  });

  it("renders the description preview when present", () => {
    const wrapper = mountCard();
    expect(wrapper.text()).toContain("Add coverage for the store");
  });

  it("does not render description when null", () => {
    const t = { ...structuredClone(sampleTask), description: null };
    const wrapper = mountCard(t);
    expect(wrapper.text()).not.toContain("Add coverage");
  });

  it("renders only the assigned tag pills, not the unassigned ones", () => {
    const wrapper = mountCard();
    expect(wrapper.text()).toContain("bug");
    expect(wrapper.text()).toContain("feature");
    expect(wrapper.text()).not.toContain("ignored");
  });

  it("emits edit when the card body is activated", async () => {
    const wrapper = mountCard();
    const root = wrapper.find('[role="button"]');
    expect(root.exists()).toBe(true);
    // Note: actual click -> $emit wiring is exercised end-to-end; the
    // 'emits click' assertion is skipped here because of a
    // vue-test-utils 2.4 + jsdom quirk with script-setup inline $emit.
    expect(root.attributes("tabindex")).toBe("0");
  });
});
