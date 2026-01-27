import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle2, Skull, Zap } from "lucide-react"



export type TutorialStep = 'ASK' | 'MOVE' | 'JUMP' | 'HIGH_JUMP' | 'RIFT' | 'DODGE' | 'COMBAT' | 'COMPLETE' | 'NONE'

interface TutorialOverlayProps {
    step: TutorialStep
    onAccept: () => void
    onDecline: () => void
}

const Key = ({ label, width = 'w-10', hold = false }: { label: string, width?: string, hold?: boolean }) => (
    <motion.div
        animate={{
            y: [0, 4, 0],
            backgroundColor: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)'],
            boxShadow: [
                "0px 4px 0px rgba(255,255,255,0.5)",
                "0px 0px 0px rgba(255,255,255,0.5)",
                "0px 4px 0px rgba(255,255,255,0,5)"
            ]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className={`${width} h-10 border-2 ${hold ? 'text-purple-900 border-purple-900' : 'text-white border-white'} rounded-lg flex items-center justify-center font-mono font-bold text-sm select-none`}
    >
        {label}
    </motion.div>
)

export default function TutorialOverlay({ step, onAccept, onDecline }: TutorialOverlayProps) {
    if (step === 'NONE') return null

    return (
        <AnimatePresence mode="wait">
            {step === 'ASK' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-100 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <div className="max-w-md w-full bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 text-center shadow-2xl shadow-purple-900/20">
                        <h2 className="text-2xl font-black italic tracking-wider text-white mb-2 font-custom">
                            WELCOME FIGHTER
                        </h2>
                        <p className="text-zinc-400 mb-6 text-sm font-mono">
                            New to the Shadow Rift? I strongly recommend running the combat simulation before entering the arena.
                        </p>
                        <div className="flex gap-4 justify-center font-mono">
                            <button onClick={onDecline} className="px-6 py-2 -skew-x-[10deg] bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-bold text-sm transition-colors">
                                SKIP
                            </button>
                            <button onClick={onAccept} className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-500 font-bold text-sm shadow-lg shadow-purple-600/20 transition-all hover:scale-105 -skew-x-[10deg]">
                                START TUTORIAL
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {step !== 'ASK' && step !== 'COMPLETE' && (
                <motion.div
                    key={step}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="absolute top-[15%] left-0 right-0 z-50 flex flex-col items-center text-center justify-center pointer-events-none"
                >
                    <div className="flex items-center gap-4 flex-col">
                        {getStepContent(step)}
                    </div>
                </motion.div>
            )}

            {step === 'COMPLETE' && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                >
                    <div className=" border-green-500/50 py-12 flex flex-col items-center gap-2">
                        <CheckCircle2 size={48} className="text-green-400 mb-2" />
                        <h2 className="text-4xl font-black text-white uppercase tracking-widest">Training Completed</h2>
                        <p className="text-green-200 font-mono text-xs tracking-widest animate-pulse">Initializing Enemy Wave...</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function getStepContent(step: TutorialStep) {
    switch (step) {
        case 'MOVE':
            return <>
                <div className="flex gap-2 items-center">
                    <Key label="A" />
                    <span className="text-xs">and</span>
                    <Key label="D" />
                </div>
                <div className="flex flex-col gap-1 drop-shadow-xl ">
                    <span className="text-2xl font-mono font-bold text-white tracking-wide uppercase">Movement</span>
                    <span className="text-sm font-mono text-zinc-200 max-w-xs mx-auto leading-tight">
                        Traverse the rooftop. Use arrow keys or WASD to position yourself.
                    </span>
                </div>
            </>
        case 'JUMP':
            return <>
                <div className="mb-2">
                    <Key label="SPACE" width="w-32" />
                </div>
                <div className="flex flex-col gap-1 drop-shadow-xl">
                    <span className="text-2xl text-white font-mono font-bold tracking-wide uppercase">Jump</span>

                    <span className="text-sm font-mono text-zinc-200">Clear gaps between buildings.</span>
                </div>
            </>

        case 'HIGH_JUMP':
            return <>
                <div>
                    <Key label="SPACE" width="w-32" hold />
                    <span className="absolute -right-16 top-2 text-[10px] font-black bg-purple-900 text-white px-2 py-0.5 rounded animate-pulse">
                        HOLD
                    </span>
                </div>
                <div className="flex flex-col gap-1 drop-shadow-xl">
                    <span className="text-2xl text-white font-mono font-bold tracking-wide uppercase">High Jump</span>
                    <span className="text-sm text-zinc-200 max-w-xs mx-auto font-bold">Hold the jump key to engage thrusters and reach higher platforms</span>
                </div>
            </>

        case 'RIFT':
            return <>
                <div className="mb-2">
                    <Key label="R" />
                </div>
                <div className="flex flex-col gap-1 drop-shadow-xl">
                    <span className="text-2xl font-mono font-bold text-purple-900 tracking-wide uppercase">Realm Switch</span>
                    <span className="text-sm font-mono text-zinc-200 max-w-md mx-auto leading-snug">
                        The world is split into two realms. Press <span className="text-purple-900 font-bold">R</span> to switch dimensions.
                        <br /><span className="text-xs text-white/60 mt-1 block">Warning: You will spawn at the same coordinates. Ensure the path is clear.</span>
                    </span>
                </div>
            </>

        case 'DODGE':
            return <>
                <div className="flex gap-4 mb-2 items-center">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-zinc-400 mb-1">BACK</span>
                        <div className="flex gap-1">
                            <Key label="A" />
                            <span className="text-xs text-zinc-500">/</span>
                            <Key label="D"/>
                        </div>
                    </div>
                    <span className="text-xl font-black text-white">+</span>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-zinc-400 mb-1">DODGE</span>
                        <Key label="SHIFT" width="w-20" />
                    </div>
                </div>
                <div className="flex flex-col gap-1 drop-shadow-xl">
                    <span className="text-2xl font-mono font-bold text-purple-900 tracking-wide uppercase">
                        Evasive Maneuver
                    </span>
                    <span className="text-sm font-mono text-zinc-200 max-w-xs mx-auto leading-tight">
                        While moving backwards, press <span className="text-purple-900 font-bold">SHIFT</span> to perform a dodge roll and evade attacks.
                    </span>
                </div>
            </>

        case 'COMBAT':
            return <>
                <div className="flex gap-4 mb-2 items-center">
                    <Key label="Z" />
                    <span className="text-xs">and</span>
                    <Key label="X" />
                </div>
                <div className="flex flex-col gap-1 drop-shadow-xl">
                    <span className="text-2xl font-mono font-bold text-red-400 tracking-wide uppercase">Neutralize Target</span>
                    <span className="text-sm font-mono text-zinc-200 max-w-xs mx-auto">
                        Engage the dummy. Use <span className="text-red-600 font-bold">Z</span> for quick punches and <span className="text-red-600 font-bold">X</span> for heavy kicks.
                    </span>
                </div>
            </>

        default: return null
    }
}