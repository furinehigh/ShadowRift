'use client'

import { motion } from "framer-motion"
import { Gamepad2, Keyboard, Monitor, RotateCcw, Save, Smartphone, Volume2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { ModalShell } from "./modals/ModalShell"
import { useSettings } from "@/context/SettingsContext"

const MUSIC_TRACKS = [
    {id: 'city-drums.mp3', name: 'City Drums'},
    {id: 'neon-drift.mp3', name: 'Neon Drift'},
    {id: 'void-echo.mp3', name: 'Void Echo'}
]

type Tab = 'graphics' | 'audio' | 'controls' | 'gameplay'

export default function SettingsPage({ onClose }: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<Tab>('audio')
    const {resetDefaults, saveSettings, hasUnsavedChanges} = useSettings()

    return (
        <ModalShell onClose={onClose} size="xl">
            <div className="h-[80vh] flex ">
                <div className="w-64 bg-black/30 border-r border-white/5 flex flex-col">

                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-2xl font-custom text-white tracking-widest text-shadow-glow mb-3">
                            SETTINGS
                        </h2>

                        <div className="w-16 h-1 bg-purple-600" />
                    </div>

                    <div className="flex-1 py-4 space-y-1">
                        <SidebarItem
                            active={activeTab === 'graphics'}
                            onClick={() => setActiveTab('graphics')}
                            icon={<Monitor size={18} />}
                            label='GRAPHICS'
                            disabled
                        />
                        <SidebarItem
                            active={activeTab === 'audio'}
                            onClick={() => setActiveTab('audio')}
                            icon={<Volume2 size={18} />}
                            label='AUDIO'
                        />
                        <SidebarItem
                            active={activeTab === 'controls'}
                            onClick={() => setActiveTab('controls')}
                            icon={<Keyboard size={18} />}
                            label='CONTROLS'
                        />
                        <SidebarItem
                            active={activeTab === 'gameplay'}
                            onClick={() => setActiveTab('gameplay')}
                            icon={<Gamepad2 size={18} />}
                            label='GAMEPLAY'
                            disabled
                        />
                    </div>

                    <div className="p-4 border-t border-white/5 text-xs text-gray-500 font-mono text-center">
                        VERSION 0.0.1 - BETA
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e]">
                    <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
                        <h3 className="text-xl text-purple-200 font-mono tracking-wider uppercase">
                            {activeTab}
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {activeTab === 'graphics' && <GraphicsSettings />}
                        {activeTab === 'audio' && <AudioSettings />}
                        {activeTab === 'controls' && <ControlsSettings onClose={onClose} />}
                        {activeTab === 'gameplay' && <GamePlaySettings />}
                    </div>

                    <div className="h-20 border-t border-white/5 bg-black/20 px-8 flex items-center justify-between">
                        <button onClick={resetDefaults} disabled={!hasUnsavedChanges} className={`${!hasUnsavedChanges ? 'opacity-70' : 'opacity-100'} flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors`}>
                            <RotateCcw size={16} /> RESET DEFAULTS
                        </button>
                        <button onClick={saveSettings} disabled={!hasUnsavedChanges} className={`${!hasUnsavedChanges ? 'opacity-70' : 'opacity-100'} px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-widest skew-x-[-10deg] shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all active:scale-95`}>
                            <span className="flex items-center gap-2 skew-x-[10deg]">
                                <Save size={18} /> APPLY CHANGES
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </ModalShell>
    )
}

function SidebarItem({ active, icon, label, onClick, disabled = false }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${!hasUnsavedChanges ? 'opacity-70' : 'opacity-100'} w-full flex items-center gap-4 px-6 py-4 text-sm font-mono tracking-wider transition-all duration-200 text-gray-400`}
        >
            <span className={active ? 'text-purple-400' : ''}>{icon}</span>
            {label}
        </button>
    )
}

// all settings sections

function GraphicsSettings() {
    return (
        <div className="space-y-8 font-mono animate-slide-up duration-500">
            <SettingRow label='Resolution' description='Window resolution scale'>
                <select name="resolution" className="bg-black/40 border border-white/20 text-white px-4 py-2 rounded focus:border-purple-500 outline-none w-48">
                    <option value="">1920 x 1080</option>
                    <option value="">2560 x 1440</option>
                    <option value="">1280 x 720</option>
                </select>
            </SettingRow>

            <SettingRow lable='Display Mode' description='Fullscreen or Windowed'>
                <div className="flex bg-black/40 p-1 rounded border border-white/10 w-fit">
                    <button className="px-4 py-1.5 bg-purple-600 text-white rounded text-xs">
                        FULLSCREEN
                    </button>
                    <button className="px-4 py-1.5 text-gray-400 hover:text-white text-xs">
                        WINDOWED
                    </button>
                </div>
            </SettingRow>


            <div className="h-px bg-white/10 my-4" />

            <SettingRow label='Particle Quality' description='Visual effects density (Rifts)'>
                <RangeSlider value={80} onChange={() => {}} />
            </SettingRow>

            <SettingRow label='Background Parallax' description='Enable depth movement'>
                <ToggleSwitch checked={true} onChange={() => {}} />
            </SettingRow>

            <SettingRow label='Post Processing' description='Bloom, Chromatic Aberration'>
                <ToggleSwitch checked={true} onChange={() => {}} />
            </SettingRow>
        </div>
    )
}

function AudioSettings() {
    const {audio, setAudioSetting} = useSettings()
    return (
        <div className="space-y-8 font-mono animate-slide-up duration-500">
            <SettingRow label='Background Music' description='Select active soundtrack'>
                <select 
                    value={audio.musicTrack}
                    onChange={(e) => setAudioSetting('musicTrack', e.target.value)}
                    className="bg-black/40 border border-white/20 text-white px-4 py-2 rounded focus:border-purple-500 outline-none w-48 text-sm"
                >
                    {MUSIC_TRACKS.map(track => (
                        <option key={track.id} value={track.id}>{track.name}</option>
                    ))}
                </select>
            </SettingRow>
            <SettingRow label='Master Volume' description='Global sound level'>
                <RangeSlider value={audio.masterVolume} onChange={(v) => setAudioSetting('masterVolume', v)} />
            </SettingRow>
            <SettingRow label='Music Volume' description='Background ambiance & tracks'>
                <RangeSlider value={audio.musicVolume} onChange={(v) => setAudioSetting('musicVolume', v)} />
            </SettingRow>
            <SettingRow label='SFX Volume' description='Jumps, rifts, and attacks'>
                <RangeSlider value={audio.sfxVolume} onChange={(v) => setAudioSetting('sfxVolume', v)} />
            </SettingRow>

            <div className="h-px bg-white/10 my-4" />

            <SettingRow label='Mute in Background' description='Silence audio when tabbed out'>
                <ToggleSwitch checked={audio.muteOnBlur} onChange={(v) => setAudioSetting('muteOnBlur', v)} />
            </SettingRow>
        </div>
    )
}


function ControlsSettings({onClose}: {onClose: () => void}) {
    const {keybinds, setKeybind, setEditingHud} = useSettings()
    const [listening, setListening] = useState<string | null>(null)
    const [isMobille, setIsMobile ] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            const hasTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0
            const isSmall = window.innerWidth < 1024
            setIsMobile(hasTouch && isSmall)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleKeyBind = (action: string) => {
        setListening(action)

        const listener = (e: KeyboardEvent) => {
            e.preventDefault()
            setKeybind(action as any, e.key)
            setListening(null)
            window.removeEventListener('keydown', listener)
        }
        window.addEventListener('keydown', listener)
    }

    const handleEditHud = () => {
        setEditingHud(true)
        onClose()
    }

    return (
        <div className="space-y-6 font-mono animate-slide-up duration-500">
            {isMobille && <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-lg mb-8">
                <div className="flex items-center justify-between">
                    <div >
                        <h4 className="text-white font-bold flex items-center gap-2"><Smartphone size={16} /> MOBILE HUD</h4>
                        <p className="text-xs text-gray-400 mt-1">Customize touch control postitions</p>
                    </div>
                    <button onClick={handleEditHud} className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 text-white text-xs rounded border-purple-500/50 transition-colors">
                        EDIT LAYOUT
                    </button>
                </div>
            </div>}

            <div className="text-xs text-gray-500 mb-4 uppercase tracking-widest">
                Keyboard Bindings
            </div>

            {Object.entries(keybinds).map(([action, key]) => (
                <div key={action} className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-gray-300 capitalize">{action}</span>
                    <button onClick={() => handleKeyBind(action)} className={`min-w-[80px] px-4 py-2 rounded text-sm font-bold border transition-all ${listening === action ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500 animate-pulse' : 'bg-white/5 text-white border-white/10 hover:border-purple-500'}`}>
                        {listening === action ? 'PRESS KEY' : (key === " " ? 'SPACE' : key ? String(key).toUpperCase() : "NONE")}
                    </button>
                </div>
            ))}
        </div>
    )
}



function GamePlaySettings() {
    return (
        <div className="space-y-8 font-mono  animate-slide-up duration-500">
            <SettingRow label='Show FPS' description='Display frame counter'>
                <ToggleSwitch checked={true} onChange={() => {}} />
            </SettingRow>
            <SettingRow label='Screen Shake' description={'Camera impact on hits'}>
                <RangeSlider value={50} onChange={() => {}} />
            </SettingRow>
            <SettingRow label='Damage Number' description='Show floating damage text'>
                <ToggleSwitch checked={true} onChange={() => {}} />
            </SettingRow>
        </div>
    )
}

// some helpers

function SettingRow({ label, description, children }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div>
                <div className="text-white group-hover:text-purple-300 transition-colors">
                    {label}
                </div>
                <div className="text-xs text-gray-500 mt-1">{description}</div>
            </div>
            <div>{children}</div>
        </div>
    )
}

function RangeSlider({ value, onChange }: { value: number, onChange: (v: number) => void }) {
    return (
        <div className="w-48 flex items-center gap-3">
            <input type="range" defaultValue={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
            <span className="text-xs w-8 text-right text-gray-400">{value}</span>
        </div>
    )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <button onClick={() => onChange(!checked)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-purple-600' : 'bg-gray-700'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    )
}
