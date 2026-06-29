import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import LoginView from "@client/auth/interface/components/pages/LoginView.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
