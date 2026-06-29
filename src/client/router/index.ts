import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/projects",
    },
    {
      path: "/login",
      name: "login",
      component: () => import("./views/LoginView.vue"),
    },
    {
      path: "/projects",
      name: "projects",
      component: () => import("./views/ProjectsView.vue"),
    },
    {
      path: "/projects/:id/board",
      name: "board",
      component: () => import("./views/BoardView.vue"),
    },
  ],
});

export { router };
