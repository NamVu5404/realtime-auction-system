import { create } from "zustand";

interface UIStoreState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMaintenanceMode: boolean;
  setMaintenanceMode: (status: boolean) => void;

  // Kafka pipeline health (set by useHeartbeat, mounted once globally)
  isKafkaAlive: boolean;
  lastHeartbeatTime: number;
  setKafkaAlive: (alive: boolean) => void;
  setLastHeartbeatTime: (time: number) => void;
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

  // Kafka health defaults: assume alive until proven otherwise
  isKafkaAlive: true,
  lastHeartbeatTime: Date.now(),
  setKafkaAlive: (alive: boolean) => set({ isKafkaAlive: alive }),
  setLastHeartbeatTime: (time: number) => set({ lastHeartbeatTime: time }),
}));

