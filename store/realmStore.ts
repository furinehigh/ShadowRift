import { RealmState } from "@/types/types";
import { create } from "zustand";


export const useRealmStore = create<RealmState>((set) => ({
    riftOpen: false,
    toggleRift: () => set(s => ({ riftOpen: !s.riftOpen })),
    openRift: () => set({ riftOpen: true }),
    closeRift: () => set({ riftOpen: false })
}))