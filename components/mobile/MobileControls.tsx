'use client'

import { useRealmStore } from "@/store/realmStore"
import { ControlProps } from "@/types/types"
import { ArrowLeft, ArrowRight, ArrowUp, Radio, Zap } from "lucide-react"

export default function MobileControls({onJump, onLeft, onRight, onRift, onAttack}: ControlProps) {
    const show = useRealmStore(s => s.showMobileControls)

    if (!show) return null

    const btnClass = "w-16 h-16 rounded-full flex items-center justify-center text-white select-none active:scale-95 transition-transform backdrop-blur-sm border-2 border-[#4b4c9d]"

    const bg = {background: 'rgba(0,0,0,0.5)'}

    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-end pb-8 px-4">
            <div className="absolute top-4 right-4 pointer-events-auto">

            </div>


            <div className="flex justify-between items-end w-full pointer-events-auto">
                <div className="flex gap-4">
                    <button className={btnClass} style={bg} onPointerDown={() => onLeft(true)} onPointerUp={() => onLeft(false)} onPointerLeave={() => onLeft(false)}>
                        <ArrowLeft />
                    </button > 

                    <button className={btnClass} style={bg} onPointerDown={() => onRight(true)} onPointerUp={() => onRight(false)} onPointerLeave={() => onRight(false)}>
                        <ArrowRight />
                    </button>
                </div>

                <div className="flex gap-4 items-end">
                    <button className={btnClass} style={{...bg, borderColor: 'white'}} onClick={onRift}>
                        <Radio />
                    </button>

                    <button className={btnClass} style={bg} onClick={onAttack}>
                        <Zap />

                    </button>

                    <button className={`${btnClass} w-20 h-20 mb-2`} style={{backgroundColor: '#4b4c9d'}} onClick={onJump}>
                        <ArrowUp size={32} />
                    </button>
                </div>
            </div>
        </div>
    )
}