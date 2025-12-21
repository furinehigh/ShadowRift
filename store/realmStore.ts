import { RealmStoreState } from "@/types/types";
import { create } from "zustand";


export const useRealmStore = create<RealmStoreState>((set) => ({
    p1Realm: 'normal',
    p2Realm: 'normal',
    setP1Realm: (r) => set({p1Realm: r}),
    setP2Realm: (r) => set({p2Realm: r})
}))