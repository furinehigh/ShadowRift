import { useCountUp } from "@/hooks/useCountUp"
import { animate, AnimatePresence, motion, useMotionValue } from "framer-motion"
import { useEffect } from "react"


const pad2 = (n: number) => String(n).padStart(2, '0')

export default function GameOverModal({
    isGameOver,
    wave,
    score,
    kills,
    highScores,
    respawnTimer
}: any) {
    const scoreAnimated = useCountUp(isGameOver ? score : 0, 700)

    const timerPulse = useMotionValue(1)
    useEffect(() => {
        if (!isGameOver) return
        animate(timerPulse, [1, 1.15, 1], { duration: 0.25 })

    }, [respawnTimer, isGameOver])

    return (
        <AnimatePresence>
            {isGameOver && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-100 bg-black/70 backdrop-blur-sm flex items-center justify-center"
                >
                    <motion.div
                        initial={{ scale: 0.96, y: 12, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.98, y: 10, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className="w-full max-w-[360px] rounded-xl border border-white/10 bg-zinc-950/80 px-5 py-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg tracking-[0.3rem] font-semibold font-custom uppercase text-white/80">
                                Game Over
                            </h2>

                            <div className="text-[10px] font-mono text-white/40 border border-white/10 rounded px-2 py-0.5">
                                WAVE {wave}
                            </div>
                        </div>

                        <div className="flex items-end justify-between mb-4">
                            <div>
                                <div className="text-[11px] uppercase tracking-widest text-white/40">
                                    Score
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl font-extrabold text-white leading-none tabular-nums"
                                >
                                    {scoreAnimated}
                                </motion.div>
                            </div>

                            <div className="text-right">
                                <div className="text-[11px] uppercase tracking-widest text-white/40">
                                    Kills
                                </div>
                                <div className="text-sm font-semibold text-white/70 tabular-nums ">
                                    {kills}
                                </div>
                            </div>
                        </div>


                        <div className="mt-2">
                            <div className="text-[11px] uppercase tracking-widest text-white/40 mb-2">
                                High Scores
                            </div>

                            <div className="spacy-y-1">
                                {highScores.length > 0 ? (
                                    highScores.slice(0, 5).map((hs: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs font-mono px-2 py-1 rounded bg-white/3 border border-white/6 text-white/70">
                                            <span className="text-white/80">
                                                #{idx + 1} · {hs.date} 
                                            </span>
                                            <span className="tabular-nums text-white/80">
                                                {hs.score}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-white/30 text-xs font-mono px-2 py-2 text-center border border-white/10 rounded bg-white/2">
                                        no records yet
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center">
                            <span className="text-[11px] uppercase tracking-widest text-white/40">
                                Respawning in{" "}
                                <motion.span style={{scale: timerPulse}} className="text-white/80 font-semibold tabular-nums inline-block">
                                    {pad2(respawnTimer)}
                                </motion.span>
                                {" "}s
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}