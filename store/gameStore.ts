import { GameStoreState } from "@/types/types";
import { create } from "zustand";


export const useGameStore = create<GameStoreState>((set) => ({
    gameState: 'initializing',
    setGameState: (s) => set({gameState: s})
}))