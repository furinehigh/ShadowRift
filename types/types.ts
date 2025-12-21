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
    showMobileControls: boolean
    toggleRift: () => void
    openRift: () => void
    closeRift: () => void
    toggleControls: () => void
}

export type PlayerState = {
    x: number
    y: number
    vx: number
    vy: number
    isGrounded: boolean
    isDead: boolean
    facingRight: boolean
    realm: 'normal' | 'shadow'
    lastRiftSwitch: number
}

export type Platform = {
    id: string
    x: number
    y: number
    width: number
    height: number
}

export type ControlProps = {
    onJump: () => void
    onLeft: (active: boolean) => void
    onRight: (active: boolean) => void

    onRift: () => void
    onAttack: ()=> void
}