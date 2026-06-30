import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router/index.js";
import { useAuthStore } from "@client/auth/infrastructure/store/auth";
import "./style.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");

// Rehydrate the session before any component reads auth state. The guard
// also calls fetchMe, but deep-links / refreshes on routes other than
// /login never go through the guard before mounting, so this guarantees
// `auth.user` is correct on first paint. Fire-and-forget — errors are
// recorded on `auth.lastErrorReason` and surfaced via the next guard run.
useAuthStore().fetchMe();
