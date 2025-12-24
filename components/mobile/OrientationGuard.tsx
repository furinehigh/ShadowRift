'use client'

import { RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"

export default function OrientationGuard() {
    const [isPortrait, setIsPortrait] = useState(false)

    useEffect(() => {
        const check = () => {
            const isMobile = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0

            if (isMobile && window.innerHeight > window.innerHeight) {
                setIsPortrait(true)
            } else {
                setIsPortrait(false)
            }
        }

        check()

        window.addEventListener('resize', check)

        return () => window.removeEventListener('resize', check)
    })

    if (!isPortrait) return null

    return (
        <div className="fixed inset-0 z-100 bg-black flex flex-col items-center justify-center text-white p-8 text-center">
            <RotateCcw size={64} className="mb-6 animate-spin-slow text-purple-500 " />

            <h2 className="text-2xl font-bold mb-4 font-custom">ROTATE DEVICE</h2>
            <p className="text-gray-400 font-mono text-sm">
                Shadow Rift requires landscape mode for optimal neural linking.
            </p>
        </div>
    )
}