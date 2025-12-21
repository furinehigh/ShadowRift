'use client'

import { useRealmStore } from "@/store/realmStore"

export function RiftButton() {
    const {toggleRift, riftOpen} = useRealmStore()

    return (
        <button onClick={toggleRift} className="absolute bottom-6 right-6 px-4 py-2 bg-black/70 text-white rounded-md backdrop-blur">
            {riftOpen ? 'Close Rift' : 'Open Rift'}
        </button>
    )
}