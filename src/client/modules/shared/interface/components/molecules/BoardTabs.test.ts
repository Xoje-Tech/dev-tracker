import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import BoardTabs from "@client/shared/interface/components/molecules/BoardTabs.vue";

interface TabSpec {
  label: string;
  to: string;
}

function mountBoardTabs(tabs: TabSpec[], currentPath = "/projects/p1/board") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      { path: "/:pathMatch(.*)*", component: { template: "<div />" } },
    ],
  });
  router.push(currentPath);
  return router.isReady().then(() =>
    mount(BoardTabs, {
      props: { tabs },
      global: { plugins: [router] },
    }),
  );
}

describe("BoardTabs", () => {
  it("renders one anchor per tab in order", async () => {
    const wrapper = await mountBoardTabs([
      { label: "Board", to: "/projects/p1/board" },
      { label: "Milestones", to: "/projects/p1/milestones" },
    ]);
    const links = wrapper.findAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]?.text()).toBe("Board");
    expect(links[1]?.text()).toBe("Milestones");
    expect(links[0]?.attributes("href")).toBe("/projects/p1/board");
    expect(links[1]?.attributes("href")).toBe("/projects/p1/milestones");
  });

  it("applies active styling to the tab matching the current route", async () => {
    const wrapper = await mountBoardTabs(
      [
        { label: "Board", to: "/projects/p1/board" },
        { label: "Milestones", to: "/projects/p1/milestones" },
      ],
      "/projects/p1/milestones",
    );
    const links = wrapper.findAll("a");
    const activeClasses = links[1]?.classes() ?? [];
    const otherClasses = links[0]?.classes() ?? [];
    expect(activeClasses).toContain("border-sky-500");
    expect(activeClasses).toContain("text-sky-700");
    expect(otherClasses).not.toContain("border-sky-500");
    expect(otherClasses).not.toContain("text-sky-700");
  });
});
