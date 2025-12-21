'use client'

import { useEffect, useRef } from "react"

export function useGameLoop(cb: (dt: number) => void) {
    const last = useRef(performance.now())

    useEffect(() => {
        let frame: number

        const loop = (now: number) => {
            const dt = (now-last.current) / 1000

            last.current = now

            cb(dt)

            frame = requestAnimationFrame(loop)

        }

        frame = requestAnimationFrame(loop)

        return () => cancelAnimationFrame(frame)
    }, [cb])
}