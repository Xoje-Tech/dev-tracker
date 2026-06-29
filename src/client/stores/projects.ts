import { defineStore } from "pinia";
import { ref } from "vue";
import type { ProjectDTO } from "../../shared/types/index.js";

export const useProjectsStore = defineStore("projects", () => {
  const projects = ref<ProjectDTO[]>([]);
  const loading = ref(false);

  function setProjects(p: ProjectDTO[]) {
    projects.value = p;
  }

  return { projects, loading, setProjects };
});
