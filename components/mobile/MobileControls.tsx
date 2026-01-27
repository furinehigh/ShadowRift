'use client'

import { useSettings } from "@/context/SettingsContext"
import { ControlProps } from "@/types/types"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, ArrowUp, Check, GripHorizontal, HandFist, Pause, Radio, Zap } from "lucide-react"
import { useEffect, useState } from "react"

export default function MobileControls({ onJump, onLeft, onRight, onRift, onAttack, onPause }: ControlProps) {
    const { mobileLayout, setMobileLayout, isEditingHud, setEditingHud } = useSettings()

    const [isMobile, setIsMobile] = useState(false)

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

    if (!isMobile) return null

    const btnClass = "w-16 h-16 rounded-full flex items-center justify-center text-white select-none active:scale-95 transition-transform backdrop-blur-sm border-2 border-[#4b4c9d] touch-none pointer-events-auto"

    const bg = { background: 'rgba(0,0,0,0.5)' }

    const holdHandlers = (handler: (p: boolean) => void) => !isEditingHud ? {
        onPointerDown: () => handler(true),
        onPointerUp: () => handler(false),
        onPointerLeave: () => handler(false)
    } : {}

    return (
        <div className="absolute inset-0 z-49 pointer-events-none flex flex-col justify-end pb-8 px-4">
            <div className="fixed top-24 right-4 pointer-events-auto flex gap-3">
                {isEditingHud ? (
                    <button onClick={() => setEditingHud(false)} className="p-2 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-md">
                        <Check size={20} className="mr-1" /> Save
                    </button>
                ) : (
                    <button onClick={onPause} className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                        <Pause size={20} />
                    </button>
                )}
            </div>

            {isEditingHud && (
                <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center pointer-events-none">
                    <div className="text-white font-mono text-sm bg-black/80 px-4 py-2 rounded-full border border-white/10" >
                        DRAG CONTROLS TO REPOSITION
                    </div>
                </div>
            )}

            <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end pb-8 px-4 overflow-hidden">
                <div className="flex justify-between items-end w-full">
                    <motion.div
                        drag={isEditingHud}
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                            setMobileLayout({
                                ...mobileLayout,
                                dpadX: mobileLayout.dpadX + info.offset.x,
                                dpadY: mobileLayout.dpadY + info.offset.y
                            })
                        }}
                        style={{x: mobileLayout.dpadX, y: mobileLayout.dpadY}}
                        className={`flex gap-4 pointer-events-none ${isEditingHud ? 'border border-yellow-400/50 p-2 rounded-xl bg-yellow-400/10' : ''}`}
                    >

                        <div className="relative">
                            {isEditingHud && <div className="absolute -top-6 left-0 text-[10px] text-yellow-400 w-full text-center font-bold">MOVE</div>}
                            <div className="flex gap-4">
                                <button className={btnClass} style={bg} onPointerDown={() => !isEditingHud && onLeft(true)} onPointerUp={() => !isEditingHud && onLeft(false)} onPointerLeave={() => !isEditingHud && onLeft(false)}>
                                    {isEditingHud ? <GripHorizontal /> : <ArrowLeft />}
                                </button >

                                <button className={btnClass} style={bg} onPointerDown={() => !isEditingHud && onRight(true)} onPointerUp={() => !isEditingHud && onRight(false)} onPointerLeave={() => !isEditingHud && onRight(false)}>
                                    {isEditingHud ? <GripHorizontal /> : <ArrowRight />}
                                </button>
                            </div>

                        </div>
                    </motion.div>

                    <motion.div
                        drag={isEditingHud}
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                            setMobileLayout({
                                ...mobileLayout,
                                actionX: mobileLayout.actionX + info.offset.x,
                                actionY: mobileLayout.actionY + info.offset.y
                            })
                        }}
                    className={`flex gap-4 items-end pointer-events-auto ${isEditingHud ? 'border border-yellow-400/50 p-2 rounded-xl bg-yellow-400/10' : ''}`}>
                        <button className={btnClass} style={{ ...bg, borderColor: 'white' }} onClick={!isEditingHud ? onRift : undefined}>
                            <Radio />
                        </button>

                        <button className={btnClass} style={bg} {...holdHandlers((p) => onAttack('KICK', p))}>
                            <Zap />

                        </button>

                        <button className={btnClass} style={bg} {...holdHandlers((p) => onAttack('PUNCH', p))}>
                            <HandFist />

                        </button>

                        <button className={`${btnClass} w-20 h-20 mb-2`} style={{ backgroundColor: '#4b4c9d' }} {...holdHandlers(onJump)}>
                            {isEditingHud ? <GripHorizontal /> : <ArrowUp size={32} />}
                        </button>
                    </motion.div>
                </div>

            </div>
        </div>
    )
}