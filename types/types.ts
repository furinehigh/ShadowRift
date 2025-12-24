export type GameState = 'initializing' | 'auth' | 'loading' | 'menu' | 'playing'

export type RealmConfig = {
    id: 'normal' | 'rift'
    direction: 1 | -1
    baseSpeed: number
    tint: string
    layers: {
        src: string
        depth: number
    }[]
}

export type RealmStoreState = {
    p1Realm: 'normal' | 'rift'
    p2Realm: 'normal' | 'rift'
    setP1Realm: (r: 'normal' | 'rift') => void
    setP2Realm: (r: 'normal' | 'rift') => void
}

export type PlayerState = {
    x: number
    y: number
    vx: number
    vy: number
    width: number
    height: number
    isGrounded: boolean
    isDead: boolean
    facingRight: boolean
    realm: 'normal' | 'rift'
    lastRiftSwitch: number
    hp: number
}

export type Building = {
    id: string
    x: number
    y: number
    width: number
    height: number
    type: 'normal' | 'rift'
    color: string
    shakeUntil?: number
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

export interface Keybinds {
    left: string
    right: string
    jump: string
    attack: string
    rift: string
}

export interface MobileLayout {
    dpadX: number
    dpadY: number
    actionX: number
    actionY: number
}

export interface SettingsContextType {
    keybinds: Keybinds
    setKeybind: (action: keyof Keybinds, key: string) => void
    mobileLayout: MobileLayout
    setMobileLayout: (layout: MobileLayout) => void
    isEditingHud: boolean
    setEditingHud: (v: boolean) => void
    resetDefaults: () => void
}