import { ref, onUnmounted } from "vue";

export function usePolling(callback: () => Promise<void>, intervalMs: number) {
  const isPolling = ref(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  function start(): void {
    if (isPolling.value) return;
    isPolling.value = true;
    timer = setInterval(callback, intervalMs);
    callback();
  }

  function stop(): void {
    isPolling.value = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  onUnmounted(stop);

  return { isPolling, start, stop };
}
