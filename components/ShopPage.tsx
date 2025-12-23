'use client'

import { motion } from "framer-motion"
import { Bell, Lock, ShoppingBag, TriangleAlert, X } from "lucide-react"
import { ModalShell } from "./modals/ModalShell"


export default function ShopPage({onClose} : {onClose: () => void}) {
    return (
        <ModalShell onClose={onClose} size="lg" >

            <div
                className="flex min-h-[500px]"
            >
                <div className="w-full md:w-1/2 bg-gradient-to-br from-black/40 to-purple-900/20 flex flex-col items-center justify-center p-12 border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px] opacity-50" />

                    <motion.div 
                        animate={{y: [0, -20, 0]}}
                        transition={{duration: 4, repeat: Infinity, ease: 'easeInOut'}}
                        className="relative z-10 "
                    >
                        <div className="w-48 h-48 bg-black/80 border-2 border-purple-500/50 rounded-2xl flex items-center justify-center relative shadow-[0_0_50px_rgba(168,85,247,0.2)]">
                            <ShoppingBag size={64} className="text-purple-400 opacity-50" />

                            <div className="absolute inset-0 border border-white/10 rounded-2xl" />

                            <div className="absolute -bottom-6 -right-6 bg-[#0f0f1a] border border-red-500/50 p-4 rounded-full shadow-lg">
                                <Lock size={24} className="text-red-400" />
                            </div>
                        </div>
                    </motion.div>

                    <div className="mt-12 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-bold tracking-widest mb-4">
                            <TriangleAlert size={12} />
                            CONNECTION SEVERED
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-1/2 p-12 flex flex-col justify-center items-start text-left bg-[#0f0f1a]">
                    <h2 className="text-2xl md:text-4xl font-custom text-white mb-4 tracking-wide text-shadow-glow">
                        VENDOR<br />OFFLINE
                    </h2>

                    <div className="w-16 h-1 bg-purple-600 mb-6" />

                    <p className="text-gray-400 font-mono leading-relaxed mb-8">
                        The inter dimensional merchants are currently traversing the Shadow Rift. They are gathering rare artifacts and skins from the other side
                    </p>

                    <div className="space-y-4 w-full">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-lg">
                            <h4 className="text-purple-300 font-mono text-sm font-bold mb-1">
                                INCOMING SHIPMENTS
                            </h4>
                            <ul className="text-gray-500 text-xs space-y-1 font-mono">
                                <li>Shadow Walker Skin Bundle</li>
                                <li>Neon Rift Weapon Camos</li>
                                <li>Premium Currency Packs</li>
                            </ul>
                        </div>

                        <button className="w-full group mt-4 flex items-center justify-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 text-white font-mono tracking-wider transition-all">
                            <Bell size={18} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                            <span>NOTIFY WHEN AVAILABLE</span>
                        </button>
                    </div>

                    <div className="mt-auto pt-8 w-full text-center">
                        <span className="text-[10px] text-gray-600 font-mono tracking-[0.2em]">
                            ETA: UNKNOWN // RIFT UNSTABLE
                        </span>
                    </div>
                </div>
            </div>
        </ModalShell>
    )
}