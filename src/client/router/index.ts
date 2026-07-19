import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { authGuard } from "@client/auth/infrastructure/router/auth-guard";
import LoginView from "@client/auth/interface/components/pages/LoginView.vue";
import NotFoundView from "@client/shared/interface/components/pages/NotFoundView.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/projects",
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: "/projects",
    name: "projects",
    component: () => import("@client/projects/interface/components/pages/ProjectsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/:id",
    name: "project-detail",
    component: () => import("@client/projects/interface/components/pages/ProjectDetailView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/:id/board",
    name: "board",
    component: () => import("@client/board/interface/components/pages/BoardView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/:id/milestones",
    name: "milestones",
    component: () =>
      import(
        "@client/milestones/interface/components/pages/MilestonesView.vue"
      ),
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/:id/milestones/:milestoneId",
    name: "milestone-detail",
    component: () =>
      import(
        "@client/milestones/interface/components/pages/MilestonesView.vue"
      ),
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/:id/sprints",
    name: "sprints",
    component: () =>
      import("@client/sprints/interface/components/pages/SprintsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/:id/sprints/:sprintId",
    name: "sprint-detail",
    component: () =>
      import("@client/sprints/interface/components/pages/SprintsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/tags",
    name: "tags",
    component: () => import("@client/tags/interface/components/pages/TagsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(authGuard);
