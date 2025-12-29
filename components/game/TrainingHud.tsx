'use client'

import { TrainingHUDProps } from "@/types/types"
import { AnimatePresence, motion } from "framer-motion"
import { Shield, Skull, UserIcon, Zap } from "lucide-react"
import { useEffect, useState } from "react"


const MAX_HP = {
    grunt: 100,
    elite: 200,
    boss: 500
}

export default function TrainingHUD({ wave, enemies, player }: TrainingHUDProps) {
    const [username, setUsername] = useState('Unknown_fr')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('shadow_rift_user')
            if (saved) setUsername(saved)

        }
    })


    const aliveEnemies = enemies.filter(e => !e.isDead)
    const boss = aliveEnemies.find(e => e.variant === 'boss')

    const totalEnemies = enemies.length
    const progress = totalEnemies > 0 ? ((totalEnemies - aliveEnemies.length) / totalEnemies) * 100 : 0

    const now = Date.now()
    const elapsed = now - player.lastRiftSwitch
    const cooldownPct = Math.min(elapsed / 5000, 1) * 100
    const isReady = cooldownPct >= 100

    const hpPct = player.hp || 100


    return (
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-40 flex flex-col justify-between h-full">
            <div className="w-full flex justify-between items-start">
                <div className={`flex items-center gap-3 flex-row text-right`}>
                    <div className={`relative w-18 h-18 rounded-xl border-2 border-purple-500/50 bg-black/60 overflow-hidden shadow-lg`}>

                        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black flex items-center justify-center">
                            <UserIcon className="text-purple-300" size={24} />
                        </div>

                        <div className="absolute bottom-0 w-full text-[9px] bg-black/90 text-white text-center font-bold">
                            LVL 1
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 w-48">
                        <div className={`text-sm font-bold tracking-wider flex items-center gap-2 justify-start`}>
                            {username}
                        </div>

                        <div className="w-full h-3 bg-black/50 border border-white/10 skew-x-[10deg] relative overflow-hidden">
                            <div className={`h-full transition-all duration-300 bg-green-500 float-left`} style={{ width: `${hpPct}%` }} />
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <Zap size={12} className={isReady ? 'text-purple-400' : 'text-gray-600'} />

                            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-100 ${isReady ? 'bg-purple-400 shadow-[0_0_8px_#22d3ee]' : 'bg-purple-900'}`} style={{ width: `${cooldownPct}%` }} />
                            </div>


                            <span className={`text-[9px] font-bold ${isReady ? 'text-white' : 'text-gray-500'}`}>
                                {isReady ? 'READY' : `${((5000 - elapsed) / 1000).toFixed(1)}s`}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="backdrop-blur-md ">
                        <div className="text-[10px] text-purple-400 font-bold tracking-[0.3em] text-center mb-1">
                            WAVE
                        </div>
                        <div className="text-2xl font-mono text-white tracking-tighter text-shadow-glow text-center">
                            {wave.toString().padStart(2, '0')}
                        </div>
                    </div>

                    <AnimatePresence>
                        {boss && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scaleX: 0 }}
                                animate={{ opacity: 1, y: 0, scaleX: 1 }}
                                exit={{ opacity: 0, y: -10, scaleY: 0 }}
                                className="mt-4 w-[400px] md:w-[600px] flex flex-col items-center"
                            >
                                <div className="w-full flex justify-between text-xs font-bold text-red-400 mb-1 px-1 uppercase tracking-widest">
                                    <span>Sector Boss</span>
                                    <span>{Math.ceil(boss.hp)} / {MAX_HP.boss}</span>
                                </div>
                                <div className="w-full h-6 bg-black/80 border-2 border-red-900/80 relative overflow-hidden rounded-sm" >
                                    <motion.div className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 transition-all duration-100" animate={{width: `${(boss.hp / MAX_HP.boss) * 100}%`}} />
                                    <div className="absolute inset-0 bg-[url('/stripes.png')] opacity-20 mix-blend-overlay"></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex flex-col items-end gap-1 w-64">
                    <div className="flex items-center gap-2 text-red-400 font-bold tracking-widest text-md">
                        <span>HOSTILES</span>
                    </div>

                    <div className="w-full h-3 bg-black/60 border border-red-500/30 skew-x-[10deg] relative overflow-hidden backdrop-blur-sm mb-1">
                        <div className="h-full bg-red-500/50 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="flex gap-2">
                        {aliveEnemies.map((enemy, i) => i < 10 && (
                            <motion.div key={enemy.id} layoutId={enemy.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`w-3 h-3 rounded-full shadow-sm ${enemy.variant === 'boss' ? 'bg-purple-500 w-4 h-4 animate-pulse' : enemy.variant === 'elite' ? 'bg-white' : 'bg-gray-500'}`}
                            />
                        ))}
                        {aliveEnemies.length > 10 && (
                            <span className="text-xs text-red-400 font-bold ">
                                +{aliveEnemies.length - 10}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-white font-mono">
                        {aliveEnemies.length} REMAINING
                    </span>
                </div>
            </div>
            <div className="absolute bottom-28 w-full flex justify-center">
                <AnimatePresence>
                    {aliveEnemies.length === 0 && (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 1 }}
                            exit={{ scale: 2, opacity: 0 }}
                            className="font-custom text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] italic"
                        >
                            WAVE CLEARED
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}