import { defineStore } from "pinia";
import { ref } from "vue";
import type { BoardDTO } from "../../shared/types/index.js";

export const useBoardStore = defineStore("board", () => {
  const board = ref<BoardDTO | null>(null);
  const loading = ref(false);

  function setBoard(b: BoardDTO | null) {
    board.value = b;
  }

  return { board, loading, setBoard };
});
