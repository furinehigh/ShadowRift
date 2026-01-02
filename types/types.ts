import { ReactNode } from "react"

export type GameState = 'initializing' | 'auth' | 'loading' | 'menu' | 'playing' | 'training'

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

export type GameStoreState = {
    gameState: GameState
    setGameState: (s: GameState) => void
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
    isClimbing: boolean
    climbTargetY: number | null
    climbLockX: number | null
    attackUntil: number
    attackAnim: string | null
    stunUntil: number
    hitAnim: string | null
    isDying: boolean
    lastHitTime:  number
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
    onAttack: (a: string) => undefined
}

export interface Keybinds {
    left: string
    right: string
    jump: string
    punch: string
    kick: string
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

export interface FighterProps {
    x: number,
    y: number,
    width: number,
    height: number,
    facingRight: boolean,
    anim: string
    variant?: 'player' | 'grunt' | 'elite' | 'boss'
}

export interface BotInputs {
    left: boolean
    right: boolean
    jump: boolean
    punch: boolean
    kick: boolean
    rift: boolean
}

export interface Enemy {
    id: string
    hp: number
    variant: 'grunt' | 'elite' | 'boss'
    isDead: boolean
    isDying: boolean
}

export interface TrainingHUDProps {
    wave: number
    enemies: Enemy[]
    player: {
        hp: number
        lastRiftSwitch: number
    }
}

export interface GameViewProps {
    cameraX: number
    player: PlayerState
    otherPlayer: PlayerState | null
    buildings: Building[]
    isRift: boolean
    active: boolean
    screenWidthDivider: number
    windowWidth: number
    currentRealm: string
    children?: ReactNode
}