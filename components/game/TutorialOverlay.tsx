import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle2, Skull, Zap } from "lucide-react"



export type TutorialStep = 'ASK' | 'MOVE' | 'JUMP' | 'HIGH_JUMP' | 'RIFT' | 'COMBAT' | 'COMPLETE' | 'NONE'

interface TutorialOverlayProps {
    step: TutorialStep
    onAccept: () => void
    onDecline: () => void
}

export default function TutorialOverlay({step, onAccept, onDecline}: TutorialOverlayProps) {
    if (step === 'NONE') return null

    return (
        <AnimatePresence mode="wait">
            {step === 'ASK' && (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    className="absolute inset-0 z-100 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <div className="max-w-md w-full bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 text-center shadow-2xl shadow-purple-900/20">
                        <h2 className="text-2xl font-black italic tracking-wider text-white mb-2 font-custom">
                            WELCOME FIGHTER
                        </h2>
                        <p className="text-zinc-400 mb-6 text-sm">
                            New to the Shadow Rift? I strongly recommend running the combat simulation before entering the arena.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={onDecline} className="px-6 py-2 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-bold text-sm transition-colors">
                                SKIP
                            </button>
                            <button onClick={onAccept} className="px-6 py-2 rounded bg-purple-600 text-white hover:bg-purple-500 font-bold text-sm shadow-lg shadow-purple-600/20 transition-all hover:scale-105">
                                START TUTORIAL
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {step !== 'ASK' && step !== 'COMPLETE' && (
                <motion.div
                    key={step}
                    initial={{y: 50, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    exit={{y: -20, opacity: 0}}
                    className="absolute top-[20%] left-0 right-0 z-50 flex justify-center pointer-events-none"
                >
                    <div className="bg-black/60 backdrop-blur-sm border border-white/10 px-8 py-4 rounded-xl flex items-center gap-4 shadow-xl">
                        {getStepContent(step)}
                    </div>
                </motion.div>
            )}

            {step === 'COMPLETE' && (
                <motion.div
                    initial={{scale: 0.8, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    exit={{opacity: 0}}
                    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                >
                    <div className="bg-green-500/20 backdrop-blur-md border border-green-500/50 px-8 py-6 rounded-2xl flex flex-col items-center gap-2">
                        <CheckCircle2 size={48} className="text-green-400 mb-2" />
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">Training Complete</h2>
                        <p className="text-green-200 font-mono text-sm">Initializing Enemy Wave...</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function getStepContent(step: TutorialStep) {
    switch(step) {
        case 'MOVE':
            return <>
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20"><ArrowLeft size={16} className="text-white"/></div>
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20"><ArrowRight size={16} className="text-white" /></div>
                </div>
                <span className="text-white font-bold tracking-wide">MOVE LEFT & RIGHT</span>
            </>
        case 'JUMP':
            return <>
                <div className="w-16 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="text-xs text-white font-mono">SPACE</span>

                </div>
                <span className="text-white font-bold tracking-wide">JUMP</span>
            </>

        case 'HIGH_JUMP':
            return <>
                <div className="w-16 h-8 rounded bg-purple-500/20 flex items-center justify-center border border-purple-500/50 animate-pulse">
                    <span className="text-xs text-purple-200 font-mono">HOLD</span>
                </div>
                <span className="text-white font-bold tracking-wide">HOLD JUMP FOR HEIGHT</span>
            </>

        case 'RIFT':
            return <>
                <div className="w-8 h-8 rounded bg-purple-900/50 flex items-center justify-center border border-purple-500">
                    <Zap size={16} className="text-purple-300" />
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-bold tracking-wide">PRESS 'R' TO SWITCH REALMS</span>
                    <span className="text-[10px] text-zinc-400">Enemies hide in other dimensions</span>
                </div>
            </>

        case 'COMBAT':
            return <>
                <div className="w-8 h-8 rounded bg-red-900/50 flex items-center justify-center border border-red-500"><Skull size={16} className="text-red-300" /></div>
                <div>
                    <span className="text-white font-bold tracking-wide">DEFEAT THE ENEMY</span>
                    <span className="text-[10px] text-zinc-400">Use 'Z' (Punch) and 'X' (Kick)</span>
                </div>
            </>

        default: return null
    }
}