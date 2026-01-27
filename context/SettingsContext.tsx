'use client'

import { audioController } from "@/lib/audioController"
import { AudioSettings, Keybinds, MobileLayout, SettingsContextType } from "@/types/types"
import { createContext, useContext, useEffect, useState } from "react"


const defaultKeybinds: Keybinds = {
    left: 'a',
    right: 'd',
    jump: ' ',
    punch: 'z',
    rift: 'r',
    kick: 'x',
    dodge: 'shift'
}

const defaultMobileLayout: MobileLayout = {
    dpadX: 0,
    dpadY: 0,
    actionX: 0,
    actionY: 0
}

const defaultAudio: AudioSettings = {
    masterVolume: 75,
    musicVolume: 60,
    sfxVolume: 90,
    muteOnBlur: true,
    musicTrack: 'city-city.mp3'
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({children} : {children: React.ReactNode}) {
    const [keybinds, setKeybinds] = useState<Keybinds>(defaultKeybinds)
    const [mobileLayout, setMobileLayoutState] = useState<MobileLayout>(defaultMobileLayout)
    const [audio, setAudio] = useState<AudioSettings>(defaultAudio)

    const [savedKeybinds, setSavedKeybinds] = useState<Keybinds>(defaultKeybinds)
    const [savedLayout, setSavedLayout] = useState<MobileLayout>(defaultMobileLayout)
    const [savedAudio, setSavedAudio] = useState<AudioSettings>(defaultAudio)

    const [isEditingHud, setEditingHud] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        const load = () => {
            const sKeys = localStorage.getItem('sr_keybinds')
            const sLayout = localStorage.getItem('sr_mobile_layout')
            const sAudio = localStorage.getItem('sr_audio')

            
    
            if (sKeys){
                const parsed = JSON.parse(sKeys)
                setKeybinds(parsed)
                setSavedKeybinds(parsed)
            }
            if (sLayout) {
                const parsed = JSON.parse(sLayout)
                setMobileLayoutState(parsed)
                setSavedLayout(parsed)
            }
            if (sAudio) {
                const parsed = JSON.parse(sAudio)
                const merged = {...defaultAudio, ...parsed}
                setAudio(merged)
                setSavedAudio(merged)
            }
            setLoaded(true)

        }
        load()
    }, [])

    useEffect(() => {
        audioController.updateVolumeSettings(
            audio.masterVolume,
            audio.musicVolume,
            audio.sfxVolume,
            audio.muteOnBlur
        )
        if (loaded) {
            audioController.playMusic(audio.musicTrack)
        }
    }, [audio, loaded])

    useEffect(() => {
        if (!loaded) return

        const keysChanged = JSON.stringify(keybinds) !== JSON.stringify(savedKeybinds)
        const layoutChanged = JSON.stringify(mobileLayout) !== JSON.stringify(savedLayout)
        const audioChanged = JSON.stringify(audio) !== JSON.stringify(savedAudio)

        setHasUnsavedChanges(keysChanged || layoutChanged || audioChanged)


    }, [keybinds, mobileLayout, loaded, audio, savedKeybinds, savedLayout, savedAudio])

    const setKeybind = (action: keyof Keybinds, key: string) => {
        setKeybinds(prev => ({...prev, [action]: key.toLocaleLowerCase()}))

    }

    const setMobileLayout = (layout: MobileLayout) => {
        setMobileLayoutState(layout)
    }

    const setAudioSetting = <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
        setAudio(prev => ({...prev, [key]: value}))
    }

    const resetDefaults = () => {
        setKeybinds(defaultKeybinds)
        setMobileLayoutState(defaultMobileLayout)
        setAudio(defaultAudio)
        setHasUnsavedChanges(false)
    }

    const saveSettings = () => {

        localStorage.setItem('sr_keybinds', JSON.stringify(keybinds))
        localStorage.setItem('sr_mobile_layout', JSON.stringify(mobileLayout))
        localStorage.setItem('sr_audio', JSON.stringify(audio))

        setSavedKeybinds(keybinds)
        setSavedLayout(mobileLayout)
        setSavedAudio(audio)
        setHasUnsavedChanges(false)
    }
 
    return (
        <SettingsContext.Provider value={{
            keybinds, setKeybind, mobileLayout, setMobileLayout, audio, setAudioSetting, isEditingHud, setEditingHud, resetDefaults, saveSettings, hasUnsavedChanges
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