'use client'

import { useRealmStore } from "@/store/realmStore"
import RealmScene from "./RealmScene"
import { realms } from "@/lib/realms"
import { useEffect, useMemo, useRef, useState } from "react"
import { Building, GameViewProps, Platform, PlayerState } from "@/types/types"
import { useGameLoop } from "@/hooks/useGameLoop"
import MobileControls from "../mobile/MobileControls"
import { Skull, UserIcon, Wifi, Zap } from "lucide-react"
import { useSettings } from "@/context/SettingsContext"
import { AnimatePresence } from "framer-motion"
import PauseMenu from "../modals/PauseMenu"
import SettingsPage from "../SettingsPage"
import Fighter from "../game/Fighter"
import { generateSkyline, getAnim, playSound, updatePhysics, useWindowSize } from "@/lib/game-utils"

const JUMP_FORCE = -850
const MOVE_SPEED = 450
const RIFT_COOLDOWN = 5000
const PLAYER_W = 30
const PLAYER_H = 70

const ATTACK_DURATION = 500



export default function SplitWorld() {
    const { p1Realm, p2Realm, setP1Realm } = useRealmStore()
    const { width: windowWidth, height: windowHeight, isClient } = useWindowSize()
    const { keybinds, isEditingHud } = useSettings()
    const [, setTick] = useState(0)
    const [username, setUsername] = useState('Unknown')

    const [isPaused, setIsPaused] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [ping, setPing] = useState(0)
    const [isOnline, setIsOnline] = useState(true) // demo for now

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('shadow_rift_user')
            if (saved) setUsername(saved)

        }
    })

    // demo ping
    useEffect(() => {
        if (!isOnline) return
        const interval = setInterval(() => {
            setPing(Math.floor(20 + Math.random() * 40))
        }, 2000)
        return () => clearInterval(interval)
    }, [isOnline])

    
    // player refs
    const p1 = useRef<PlayerState>({
        x: 100, y: 300, vx: 0, vy: 0, width: PLAYER_W, height: PLAYER_H, isGrounded: false, isDead: false, facingRight: true, realm: 'normal', lastRiftSwitch: 0, hp: 100, isClimbing: false, climbTargetY: null, climbLockX: null, attackUntil: 0, attackAnim: null
    })

    const p2 = useRef<PlayerState>({
        x: 600, y: 300, vx: 0, vy: 0, width: PLAYER_W, height: PLAYER_H, isGrounded: false, isDead: false, facingRight: false, realm: 'normal', lastRiftSwitch: 0, hp: 100, isClimbing: false, climbTargetY: null, climbLockX: null, attackUntil: 0, attackAnim: null
    })

    const cameras = useRef({ normal: 100, rift: 600 })

    const normalBuildings = useRef<Building[]>(generateSkyline('normal'))
    const riftBuildings = useRef<Building[]>(generateSkyline('rift'))

    const inputs = useRef({ left: false, right: false, jump: false, punch: false, kick: false })




    useGameLoop((dt) => {

        if (!isClient || isPaused) return

        p1.current.vx = 0

        const now = Date.now()

        if (!p1.current.isClimbing) {

            if (inputs.current.left) {
                p1.current.vx = -MOVE_SPEED
                p1.current.facingRight = false
            }

            if (inputs.current.right) {
                p1.current.vx = MOVE_SPEED
                p1.current.facingRight = true
            }

            if (inputs.current.jump && p1.current.isGrounded) {
                p1.current.vy = JUMP_FORCE
                // p1.current.isGrounded = false
                playSound('jump')

                inputs.current.jump = false
            }
        } else {
            if (inputs.current.jump) {
                p1.current.isClimbing = false
                p1.current.vy = JUMP_FORCE
                inputs.current.jump = false
            }
        }


        if (now > p1.current.attackUntil) {
            if (inputs.current.punch) {
                p1.current.attackUntil = now + ATTACK_DURATION
                p1.current.attackAnim = 'PUNCH'
                inputs.current.punch = false
                checkAttackHit(p1.current, 'PUNCH')
            } else if (inputs.current.kick) {
                p1.current.attackUntil = now + ATTACK_DURATION
                p1.current.attackAnim = 'LEG_ATTACK_1'
                inputs.current.kick = false
                checkAttackHit(p1.current, 'KICK')
            }
        }

        updatePhysics(p1.current, dt, p1.current.realm === 'normal' ? normalBuildings.current : riftBuildings.current, windowHeight)
        updatePhysics(p2.current, dt, p2.current.realm === 'normal' ? normalBuildings.current : riftBuildings.current, windowHeight)

        if (p1.current.realm === 'normal') {
            cameras.current.normal = p1.current.x
        }
        if (p1.current.realm === 'rift') {
            cameras.current.rift = p1.current.x
        }


        setTick(t => t + 1)
    })

    const checkAttackHit = (attacker: PlayerState, type: string) => {
        const targetArray = attacker.realm === 'normal' ? normalBuildings.current : riftBuildings.current
        const range = type === 'KICK' ? 60 : 40
        const attackX = attacker.facingRight ? attacker.x + PLAYER_W + range : attacker.x - range

        const hit = targetArray.find(b => attackX > b.x && attackX < b.x + b.width && Math.abs((windowHeight - b.height) - attacker.y) < 100)

        if (hit) {
            hit.shakeUntil = Date.now() + 120
        }

    }

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase()

            if (k === 'escape') {
                setIsPaused(prev => !prev)
            }

            if (k === keybinds.left || k === 'arrowleft') inputs.current.left = true
            if (k === keybinds.right || k === 'arrowright') inputs.current.right = true
            if (k === keybinds.jump || k === 'arrowup') inputs.current.jump = true
            if (k === keybinds.kick) inputs.current.kick = true
            if (k === keybinds.punch) inputs.current.punch = true

            if (k === keybinds.rift) {
                handleRiftSwitch()
            }
        }

        const onKeyUp = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase()
            if (k === keybinds.left || k === 'arrowleft') inputs.current.left = false
            if (k === keybinds.right || k === 'arrowright') inputs.current.right = false
            if (k === keybinds.jump || k === 'arrowup') inputs.current.jump = false
            if (k === keybinds.kick) inputs.current.kick = false
            if (k === keybinds.punch) inputs.current.punch = false
        }




        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [keybinds])

    const handleRiftSwitch = () => {
        const now = Date.now()

        if (now - p1.current.lastRiftSwitch < RIFT_COOLDOWN) return

        p1.current.lastRiftSwitch = now
        playSound('rift')

        const newRealm = p1.current.realm === 'normal' ? 'rift' : 'normal'
        p1.current.realm = newRealm
        p1.current.isClimbing = false
        setP1Realm(newRealm)
    }

    const handleExit = () => {
        window.location.reload()
    }


    const isSplit = p1Realm !== p2Realm

    if (!isClient) return <div className="w-full h-full bg-black"></div>

    return (
        <div className="flex w-full h-full  relative overflow-hidden select-none font-mono bg-[white]">

            <AnimatePresence>
                {isPaused && !showSettings && !isEditingHud && (
                    <PauseMenu onResume={() => setIsPaused(false)} onSettings={() => setShowSettings(true)} onExit={handleExit} isOnline={isOnline} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSettings && (
                    <SettingsPage onClose={() => setShowSettings(false)} />
                )}
            </AnimatePresence>

            <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between items-start">
                <PlayerHud
                    player={p1.current}
                    name={username}
                    level={1}
                    color='text-purple-400'
                    align='left'
                    isMe={true}
                />

                <div className="flex flex-col items-center">
                    {isOnline && (
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${ping > 100 ? 'text-red-500' : 'text-white'}`}>
                            <Wifi size={10} />
                            {ping}ms
                        </div>
                    )}
                </div>

                <PlayerHud
                    player={p2.current}
                    name='Rival_Bot'
                    level={4}
                    color='text-red-400'
                    align='right'
                />
            </div>

            <div className="relative h-full overflow-hidden transition-all duration-300 border-r border-white/20"
                style={{ width: isSplit ? '50%' : (p1Realm === 'normal' ? '100%' : '0%') }}
            >
                <RealmScene realm={realms[0]} cameraOffset={cameras.current.normal} />

                <GameView
                    cameraX={cameras.current.normal}
                    player={p1Realm === 'normal' ? p1.current : p2.current}
                    otherPlayer={p1Realm === 'normal' ? p2.current : p2.current}
                    buildings={normalBuildings.current}
                    isRift={false}
                    active={true}
                    screenWidthDivider={isSplit ? 2 : 1}
                    windowWidth={windowWidth}
                    currentRealm='normal'
                />
            </div>


            <div className="relative h-full overflow-hidden transition-all duration-300"
                style={{
                    width: isSplit ? '50%' : (p1Realm === 'rift' ? '100%' : '0%'),
                    opacity: 1
                }}
            >
                <RealmScene realm={realms[1]} cameraOffset={cameras.current.rift} />
                <GameView
                    cameraX={cameras.current.rift}
                    player={p1Realm === 'rift' ? p1.current : p2.current}
                    otherPlayer={p1Realm === 'rift' ? p2.current : p1.current}
                    buildings={riftBuildings.current}
                    isRift={true}
                    active={true}
                    screenWidthDivider={isSplit ? 2 : 1}
                    windowWidth={windowWidth}
                    currentRealm='rift'
                />
            </div>

            <MobileControls
                onJump={() => inputs.current.jump = true}
                onLeft={(active) => inputs.current.left = active}
                onRight={(active) => inputs.current.right = active}
                onRift={handleRiftSwitch}
                onAttack={(a: string) => {
                    if (a === 'KICK') inputs.current.kick = true
                    if (a === 'PUNCH') inputs.current.punch = true
                }}
                onPause={() => setIsPaused(true)}
            />


        </div>
    )
}

// HUD
function PlayerHud({ player, name, level, color, align, isMe }: any) {
    const isRight = align === 'right'

    const now = Date.now()
    const elapsed = now - player.lastRiftSwitch
    const cooldownPct = Math.min(elapsed / RIFT_COOLDOWN, 1) * 100
    const isReady = cooldownPct >= 100

    const hpPct = player.hp || 100

    return (
        <div className={`flex items-center gap-3 ${isRight ? 'flex-row-reverse text-right' : 'flex-row text-right'}`}>

            <div className={`relative w-18 h-18 rounded-xl border-2 ${isRight ? 'border-red-500/50' : 'border-purple-500/50'} bg-black/60 overflow-hidden shadow-lg`}>
                {isMe ? (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black flex items-center justify-center">
                        <UserIcon className="text-purple-300" size={24} />
                    </div>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black flex items-center justify-center">
                        <Skull className="text-red-300" size={24} />
                    </div>
                )}

                <div className="absolute bottom-0 w-full text-[9px] bg-black/90 text-white text-center font-bold">
                    LVL {level}
                </div>
            </div>

            <div className="flex flex-col gap-1 w-48">
                <div className={`text-sm font-bold tracking-wider ${color} flex items-center gap-2 ${isRight ? 'justify-end' : 'justify-start'}`}>
                    {name}
                </div>

                <div className="w-full h-3 bg-black/50 border border-white/10 skew-x-[10deg] relative overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${isRight ? 'bg-red-500 float-right' : 'bg-green-500 float-left'}`} style={{ width: `${hpPct}%` }} />
                </div>

                <div className="flex items-center gap-2 mt-1">
                    {!isRight && <Zap size={12} className={isReady ? 'text-cyan-400' : 'text-gray-600'} />}

                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-100 ${isReady ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-cyan-900'}`} style={{ width: `${cooldownPct}%` }} />
                    </div>

                    {isRight && <Zap size={12} className={isReady ? 'text-red-400' : 'text-gray-600'} />}

                    <span className={`text-[9px] font-bold ${isReady ? 'text-cyan-300' : 'text-gray-500'}`}>
                        {isReady ? 'READY' : `${((RIFT_COOLDOWN - elapsed) / 1000).toFixed(1)}s`}
                    </span>
                </div>
            </div>
        </div>
    )
}

export function GameView({ cameraX, player, otherPlayer, buildings, isRift, active, screenWidthDivider, windowWidth, currentRealm, children }: GameViewProps) {
    if (!active) return null


    const offsetX = cameraX - (windowWidth / screenWidthDivider) / 2

    return (
        <div className="absolute inset-0 pointer-events-none">

            {buildings.map((b: Building) => {
                const shake = b.shakeUntil && b.shakeUntil > Date.now() ? Math.sin(Date.now() / 40) * 4 : 0
                const left = b.x - offsetX + shake
                if (left < -500 || left > windowWidth) return null

                return (
                    <div key={b.id} className="absolute bottom-0 flex flex-col justify-end" style={{
                        left,
                        width: b.width,
                        height: b.height,
                        backgroundColor: isRift ? '#1a0b2e' : '#0f0f1a',
                        borderTop: `4px solid ${b.color}`,
                        borderLeft: '1px solid rgba(255,255,255,0.1)',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: isRift ? `0 0 20px ${b.color}40` : 'none',
                    }} >
                        <div>
                            {Array.from({ length: Math.floor(b.height / 30) }).map((_, i) => (
                                <div key={i} className="w-2 h-3 bg-yellow-100/20" style={{
                                    visibility: Math.random() > 0.6 ? 'visible' : 'hidden'
                                }} />
                            ))}
                        </div>
                    </div>
                )
            })}

            {children}

            {player.realm === currentRealm && (
                <Fighter
                    x={player.x - offsetX}
                    y={player.y}
                    width={player.width}
                    height={player.height}
                    facingRight={player.facingRight}
                    anim={getAnim(player)}
                />
            )}

            {otherPlayer && otherPlayer.realm === currentRealm && <div style={{
                position: 'absolute',
                left: otherPlayer.x - offsetX,
                top: otherPlayer.y,
                width: otherPlayer.width,
                height: otherPlayer.height,
                backgroundColor: 'rgba(255,50,50,0.2)',
                border: '2px solid rgba(255,50,50,0.5)'
            }}>
                <span className="absolute -top-6 left-0 text-[10px] text-red-400">
                    P2
                </span>
            </div>}

        </div>
    )
}