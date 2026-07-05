import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import ProjectCard from "@client/projects/interface/components/molecules/ProjectCard.vue";
import { useProjectsStore } from "@client/projects/infrastructure/store/projects";
import type { Project } from "@client/projects/domain/types";

const sampleProject: Project = {
  id: "p1",
  name: "Demo",
  description: "A demo project",
  archived: false,
  createdAt: "2026-06-29T00:00:00.000Z",
  updatedAt: "2026-06-29T00:00:00.000Z",
  role: "owner",
};

function mountCard() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "projects", component: { template: "<div/>" } },
      {
        path: "/projects/:id/board",
        name: "board",
        component: { template: "<div/>" },
      },
    ],
  });
  return mount(ProjectCard, {
    props: { project: structuredClone(sampleProject) },
    global: { plugins: [router] },
  });
}

describe("ProjectCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useProjectsStore();
  });

  it("renders the project name", () => {
    const wrapper = mountCard();
    expect(wrapper.text()).toContain("Demo");
  });

  it("renders the description when present", () => {
    const wrapper = mountCard();
    expect(wrapper.text()).toContain("A demo project");
  });

  it("shows 'No description' italic when description is null", async () => {
    const wrapper = mountCard();
    await wrapper.setProps({ project: { ...sampleProject, description: null } });
    expect(wrapper.text()).toContain("No description");
  });

  it("shows the archived badge when archived is true", async () => {
    const wrapper = mountCard();
    await wrapper.setProps({ project: { ...sampleProject, archived: true } });
    expect(wrapper.text()).toContain("Archived");
  });

  it("does not show the archived badge when archived is false", () => {
    const wrapper = mountCard();
    expect(wrapper.text()).not.toContain("Archived");
  });

  it("shows the role in uppercase", () => {
    const wrapper = mountCard();
    expect(wrapper.text()).toContain("owner");
  });

  it("renders a link if repoUrl is present", async () => {
    const wrapper = mountCard();
    await wrapper.setProps({ project: { ...sampleProject, repoUrl: "https://github.com/xoje-tech/dev-tracker" } });
    
    const link = wrapper.find("a");
    expect(link.exists()).toBe(true);
    expect(link.attributes("href")).toBe("https://github.com/xoje-tech/dev-tracker");
    expect(link.text()).toContain("github.com/xoje-tech/dev-tracker");
  });

  it("does not render a link if repoUrl is missing", () => {
    const wrapper = mountCard();
    const link = wrapper.find("a");
    expect(link.exists()).toBe(false);
  });
});
