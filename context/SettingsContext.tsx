'use client'

import { Keybinds, MobileLayout, SettingsContextType } from "@/types/types"
import { createContext, useContext, useEffect, useState } from "react"


const defaultKeybinds: Keybinds = {
    left: 'a',
    right: 'd',
    jump: ' ',
    attack: 'k',
    rift: 'r'
}

const defaultMobileLayout: MobileLayout = {
    dpadX: 0,
    dpadY: 0,
    actionX: 0,
    actionY: 0
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({children} : {children: React.ReactNode}) {
    const [keybinds, setKeybinds] = useState<Keybinds>(defaultKeybinds)
    const [mobileLayout, setMobileLayoutState] = useState<MobileLayout>(defaultMobileLayout)
    const [isEditingHud, setEditingHud] = useState(false)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        const savedKeys = localStorage.getItem('sr_keybinds')
        const savedLayout = localStorage.getItem('sr_mobile_layout')

        if (savedKeys) setKeybinds(JSON.parse(savedKeys))
        if (savedLayout) setMobileLayoutState(JSON.parse(savedLayout))
        setLoaded(true)
    }, [])

    useEffect(() => {
        if (!loaded) return

        localStorage.setItem('sr_keybinds', JSON.stringify(keybinds))
        localStorage.setItem('sr_mobile_layout', JSON.stringify(mobileLayout))

    }, [keybinds, mobileLayout, loaded])

    const setKeybind = (action: keyof Keybinds, key: string) => {
        setKeybinds(prev => ({...prev, [action]: key.toLocaleLowerCase()}))

    }

    const setMobileLayout = (layout: MobileLayout) => {
        setMobileLayoutState(layout)
    }

    const resetDefaults = () => {
        setKeybinds(defaultKeybinds)
        setMobileLayoutState(defaultMobileLayout)
    }

    return (
        <SettingsContext.Provider value={{
            keybinds, setKeybind, mobileLayout, setMobileLayout, isEditingHud, setEditingHud, resetDefaults
        }} >
            {children}
        </SettingsContext.Provider>
    )
}

export const useSettings = () => {
    const context = useContext(SettingsContext)
    if (!context) throw new Error('useSettings must be used within SettingsProvider')
    
    return context
}