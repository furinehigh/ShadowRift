import { useEffect, useRef, useState } from "react";


export function useCountUp(target: number, duration = 600) {
    const [value, setValue] = useState(0)
    const raf = useRef<number | null>(null)

    useEffect(() => {
        const start = performance.now()
        const from = 0

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration)
            const eased = 1 - Math.pow(1 - t, 3)
            setValue(Math.floor(from + (target - from) * eased))

            if (t < 1) raf.current = requestAnimationFrame(tick)
        }

        setValue(0)
        raf.current = requestAnimationFrame(tick)

        return () => {
            if (raf.current) cancelAnimationFrame(raf.current)
        }
    }, [target, duration])

    return value
}