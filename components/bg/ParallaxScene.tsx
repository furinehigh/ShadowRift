'use client'

import { useGameLoop } from "@/hooks/useGameLoop"
import { useState } from "react"
import ParallaxLayer from "./ParallaxLayer"


export default function ParallaxScene() {
    const [offset, setOffset] = useState(0)


    useGameLoop((dt) => {
        setOffset(o => o + 220 * dt)
        
    })

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            <ParallaxLayer src="/bg/layers/far.png" speed={0.1} offset={offset} />
            <ParallaxLayer src="/bg/layers/mid.png" speed={0.1} offset={offset} />
            <ParallaxLayer src="/bg/layers/near.png" speed={0.1} offset={offset} />
            <ParallaxLayer src="/bg/layers/foreground.png" speed={0.1} offset={offset} />
        </div>
    )
}