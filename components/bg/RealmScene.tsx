'use client'

import { useGameLoop } from "@/hooks/useGameLoop"
import { useState } from "react"
import ParallaxLayer from "./ParallaxLayer"
import { RealmConfig } from "@/types/types"


export default function RealmScene({ realm, cameraOffset }: { realm: RealmConfig, cameraOffset: number }) {


    return (
        <div className="relative  h-full overflow-hidden">
            {realm.layers.map(l => (
                <ParallaxLayer
                    key={l.src}
                    src={l.src}
                    offset={cameraOffset}
                    speed={l.depth}
                />
            ))}

            <div style={{
                position: 'absolute',
                inset: 0,
                background: realm.tint,
                mixBlendMode: 'multiply',
                pointerEvents: 'none'
            }} />
        </div>
    )
}