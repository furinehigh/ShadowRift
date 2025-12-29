'use client'

import { TrainingHUDProps } from "@/types/types"
import { AnimatePresence, motion } from "framer-motion"
import { Shield, Skull } from "lucide-react"


const MAX_HP = {
    grunt: 100,
    elite: 200,
    boss: 500
}

export default function TrainingHUD({wave, enemies, player}: TrainingHUDProps) {
    const aliveEnemies = enemies.filter(e => !e.isDead)
    const boss = aliveEnemies.find(e => e.variant === 'boss')

    const totalEnemies = enemies.length
    const progress = totalEnemies > 0 ? ((totalEnemies - aliveEnemies.length) / totalEnemies) * 100 : 0

    return (
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-40 flex flex-col justify-between h-full">
            <div className="w-full flex justify-between items-start">
                <div className="flex flex-col gap-1 w-64">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-widest text-lg">
                        <Shield size={20} />
                        <span>PLAYER 1</span>
                    </div>

                    <div className="w-full h-4 bg-black/60 border border-cyan-500/30 skew-x-[-10deg] relative overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-cyan-500 transition-all duration-200 shadow-[0_0_10px_#06b6d4]" style={{width: `${Math.max(0, player.hp)}%`}} />
                    </div>
                    <span className="text-[10px] text-cyan-300/50 font-mono text-right">{Math.floor(player.hp)} / 100 HP</span>
                </div>

                <div className="flex flex-col items-center">
                    <div className="bg-black/80 border-x border-b border-purple-500/30 px-6 pb-2 rounded-b-xl backdrop-blur-md ">
                        <div className="text-[10px] text-purple-400 font-bold tracking-[0.3em] text-center mb-1">
                            WAVE
                        </div>
                        <div className="text-4xl font-black text-white tracking-tighter text-shadow-glow">
                            {wave.toString().padStart(2, '0')}
                        </div>
                    </div>

                    <AnimatePresence>
                        {boss && (
                            <motion.div 
                                initial={{opacity: 0, y: -20, scaleX: 0}}
                                animate={{opacity: 1, y: 0, scaleX: 1}}
                                exit={{opacity: 0, y: -10, scaleY: 0}}
                                className="mt-4 w-[400px] md:w-[600px] flex flex-col items-center"
                            >
                                <div className="w-full flex justify-between text-xs font-bold text-red-400 mb-1 px-1 uppercase tracking-widest">
                                    <span>Sector Boss</span>
                                    <span>{Math.ceil(boss.hp)} / {MAX_HP.boss}</span>
                                </div>
                                <div className="w-full h-6 bg-black/80 border-2 border-red-900/80 relative overflow-hidden rounded-sm" >
                                    <div className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 transition-all duration-100" />
                                    <div className="absolute inset-0 bg-[url('/stripes.png')] opacity-20 mix-blend-overlay"></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex flex-col items-end gap-1 w-64">
                    <div className="flex items-center gap-2 text-red-400 font-bold tracking-widest text-lg">
                        <span>HOSTILES</span>
                        <Skull size={20} />
                    </div>

                    <div className="w-full h-2 bg-black/60 border border-red-500/30 skew-x-[10deg] relative overflow-hidden backdrop-blur-sm mb-1">
                        <div className="h-full bg-red-500/50 transition-all duration-500" style={{width: `${progress}%`}} />
                    </div>

                    <div>
                        {aliveEnemies.map((enemy, i) => i < 10 && (
                            <motion.div key={enemy.id} layoutId={enemy.id}
                                initial={{scale: 0}}
                                animate={{scale: 1}}
                                className={`w-3 h-3 rounded-full border border-black shadow-sm ${enemy.variant === 'boss' ? 'bg-purple-500 w-4 h-4 animate-pulse' : enemy.variant === 'elite' ? 'bg-yellow-400' : 'bg-red-500'}`}
                            />
                        ))}
                        {aliveEnemies.length > 10 && (
                            <span className="text-xs text-red-400 font-bold ">
                                +{aliveEnemies.length - 10}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-red-300/50 font-mono">
                        {aliveEnemies.length} REMAINING
                    </span>
                </div>
            </div>
            <div className="w-full flex justify-center pb-20">
                <AnimatePresence>
                    {aliveEnemies.length === 0 && (
                        <motion.div
                            initial={{scale: 0.5, opacity: 0}}
                            animate={{scale: 1.2, opacity: 1}}
                            exit={{scale: 2, opacity: 0}}
                            className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] italic"
                        >
                            WAVE CLEARED
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}