'use client'

import RealmScene from "./RealmScene"
import { realms } from "@/lib/realms"

export default function SplitWorld() {
    return (
        <div className="flex w-full h-full bg-black">
            <RealmScene realm={realms[0]} />
            <RealmScene realm={realms[1]} />
        </div>
    )
}