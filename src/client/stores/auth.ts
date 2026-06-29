import { defineStore } from "pinia";
import { ref } from "vue";
import type { UserDTO } from "../../shared/types/index.js";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<UserDTO | null>(null);
  const isAuthenticated = ref(false);

  function setUser(u: UserDTO | null) {
    user.value = u;
    isAuthenticated.value = u !== null;
  }

  return { user, isAuthenticated, setUser };
});
