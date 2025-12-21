'use client'

import { useRealmStore } from "@/store/realmStore"
import RealmScene from "./RealmScene"
import { realms } from "@/lib/realms"
import { useEffect } from "react"

export default function SplitWorld() {
    const riftOpen = useRealmStore(s => s.riftOpen)

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'r') {
                useRealmStore.getState().toggleRift()
            }
        }

        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    return (
        <div className="flex w-full h-full  relative overflow-hidden">
            <div className="relative h-full transition-all duration-500 ease-out"
                style={{ width: riftOpen ? '50%' : '100%' }}
            >
                <RealmScene realm={realms[0]} />
            </div>


            <div className="relative h-full transition-all duration-500 ease-out"
                style={{
                    width: riftOpen ? '50%' : '0%',
                    opacity: riftOpen ? 1 : 0
                }}
            >
                <RealmScene realm={realms[1]} />
            </div>

        </div>
    )
}