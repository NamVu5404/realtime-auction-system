import { create } from "zustand";

interface UIStoreState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMaintenanceMode: boolean;
  setMaintenanceMode: (status: boolean) => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  darkMode: true,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setDarkMode: (dark: boolean) => set({ darkMode: dark }),
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  isMaintenanceMode: false,
  setMaintenanceMode: (status: boolean) => set({ isMaintenanceMode: status }),
}));
