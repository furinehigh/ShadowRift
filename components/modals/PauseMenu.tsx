'use client'

import { motion } from "framer-motion"
import { AlertTriangle, LogOut, Play, Settings } from "lucide-react"
import { useState } from "react"


interface PauseMenuProps {
    onResume: () => void
    onSettings: () => void
    onExit: () => void
    isOnline: boolean
}


export default function PauseMenu({onResume, onSettings, onExit, isOnline}: PauseMenuProps) {
    const [showExitConfirm, setShowExitConfirm] = useState(false)

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            {!showExitConfirm ? (
                <motion.div 
                    initial={{scale: 0.9, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    className="w-full max-w-sm bg-[#0f0f1a] border border-white/10 rounded-xl p-8 shadow-2xl"
                >
                    <h2 className="text-3xl font-custom text-center text-white mb-8 tracking-widest">PAUSED</h2>

                    <div className="space-y-4">
                        <MenuButton icon={<Play size={20} />} label='RESUME GAME' primary onClick={onResume}/>
                        <MenuButton icon={<Settings size={20} />} label='SETTINGS' onClick={onSettings} />

                        <div className="h-px bg-white/10 my-4" />

                        <MenuButton icon={<LogOut size={20} />} label='EXIT TO MENU' onClick={() => setShowExitConfirm(true)} danger />
                        
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    initial={{scale: 0.9, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    className="w-full max-w-md bg-[#1a0b0b] border border-red-500/30 rounded-xl p-8 shadow-[0_0_40px_rgba(239,68,68,0.2)] text-center"
                >
                    <div className="flex justify-center mb-6">
                        <AlertTriangle size={48} className="text-red-500 animate-pulse"/>
                    </div>
                    <h3 className="text-xl text-white font-bold mb-2">ABANDON RIFT?</h3>

                    {isOnline ? (
                        <p className="text-red-300 text-sm font-mono mb-8 leading">
                            WARNING: Disconnecting from a live match will lower your <span className="font-bold text-white">AFK SCORE</span>
                        </p>
                    ) : (
                        <p className="text-gray-400 text-sm font-mono mb-8">
                            Progress will be saved locally. You can resume later.
                        </p>
                    )}

                    <div className="flex gap-4">
                        <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-sm rounded transition-colors">
                            CANCEL
                        </button>
                        <button onClick={onExit} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-sm rounded shadow-lg transition-colors">
                            CONFIRM EXIT
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

function MenuButton({icon, label, onClick, primary, danger}: any) {
    return (
        <button onClick={onClick} className={`w-full flex items-center justify-center gap-3 py-4 rounded-lg tracking-wider transition-all active:scale-95 ${primary ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' : ''}
        ${danger ? 'bg-transparent border border-red-500/20 text-red-400 hover:bg-red-500/10' : ''}
        ${!primary && !danger ? 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white' : ''}
        `}>
            {icon}
            {label}
        </button>
    )
}