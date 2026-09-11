import { create } from "zustand";

interface UIState {
  isSidebarCollapsed: boolean;
  sidebarExpandedItem: string | null;
  toggleSidebarCollapse: () => void;
  setSidebarExpandedItem: (item: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  sidebarExpandedItem: null,
  toggleSidebarCollapse: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarExpandedItem: (item) => set({ sidebarExpandedItem: item }),
}));

export const useSidebarCollapsed = () => useUIStore((s) => s.isSidebarCollapsed);
export const useSidebarExpandedItem = () => useUIStore((s) => s.sidebarExpandedItem);
export const useSidebarActions = () => ({
  toggleSidebarCollapse: useUIStore((s) => s.toggleSidebarCollapse),
  setSidebarExpandedItem: useUIStore((s) => s.setSidebarExpandedItem),
});
