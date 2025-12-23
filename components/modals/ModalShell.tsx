'use client'

import { motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";


export function ModalShell({children, onClose, size = 'lg'}: {children: React.ReactNode, onClose: () => void, size?: 'md' | 'lg' | 'xl'}) {
    const sizes = {
        md: 'max-w-3xl',
        lg: 'max-w-5xl',
        xl: 'max-w-6xl'
    }


    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
        >
            <motion.div 
                initial={{scale: 0.96, y: 20}}
                animate={{scale: 1, y: 0}}
                exit={{scale: 0.96, y: 20}}
                transition={{type: 'spring', stiffness: 160, damping: 18}}
                className={`relative w-full ${sizes[size]} bg-[#0f0f1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden`}
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]" />
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition">
                    <X size={22} />
                </button>

                {children}
            </motion.div>
        </motion.div>
    )
}