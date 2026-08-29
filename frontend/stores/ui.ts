import { defineStore } from "pinia";

interface UiState {
  sidebarOpen: boolean;
}

export const useUiStore = defineStore("ui", {
  state: (): UiState => ({
    sidebarOpen: false,
  }),

  actions: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    closeSidebar() {
      this.sidebarOpen = false;
    },
    openSidebar() {
      this.sidebarOpen = true;
    },
  },
});
