export type RealmConfig = {
    id: 'shadow' | 'rift'
    direction: 1 | -1
    baseSpeed: number
    tint: string
    layers: {
        src: string
        depth: number
    }[]
}

export type RealmState = {
    riftOpen: boolean
    toggleRift: () => void
    openRift: () => void
    closeRift: () => void
}