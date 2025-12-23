'use client'

import { useRealmStore } from "@/store/realmStore"
import RealmScene from "./RealmScene"
import { realms } from "@/lib/realms"
import { useEffect, useMemo, useRef, useState } from "react"
import { Building, Platform, PlayerState } from "@/types/types"
import { useGameLoop } from "@/hooks/useGameLoop"
import MobileControls from "../mobile/MobileControls"

const GRAVITY = 2000
const JUMP_FORCE = -850
const MOVE_SPEED = 450
const CLIMB_SPEED = 6
const WALL_SLIDE_SPEED = 50
const RIFT_COOLDOWN = 5000
const PLAYER_W = 40
const PLAYER_H = 60


const playSound = (type: 'jump' | 'rift' | 'land' | 'climb') => {
    // const audio = new Audio(`/sfx/${type}.mp3`)
    // audio.volume = 0.5
    // audio.play().catch(() => {})
}

// SSR safe
function useWindowSize() {
    const [size, setSize] = useState({ width: 1200, height: 800 })

    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        const handleResize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight })

        }
        handleResize()

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return { ...size, isClient }

}

interface ExtendedPlayerState extends PlayerState {
    isClimbing: boolean
    climbTargetY: number | null
    climbLockX: number | null
}

export default function SplitWorld() {
    const { p1Realm, p2Realm, setP1Realm } = useRealmStore()
    const { width: windowWidth, height: windowHeight, isClient } = useWindowSize()
    const [, setTick] = useState(0)

    const generateSkyline = (type: 'normal' | 'rift'): Building[] => {
        const buildings: Building[] = []
        let currentX = 0
        const count = 50

        for (let i = 0; i < count; i++) {
            const isGap = Math.random() > 0.8
            const gapSize = isGap ? 100 + Math.random() * 100 : 0

            if (isGap) {
                currentX += gapSize
            }

            const width = 100 + Math.random() * 200
            const height = 100 + Math.random() * 300

            const tint = type === 'rift' ? `hsl(${260 + Math.random() * 40}, 70%, ${40 + Math.random() * 20}%)` : `hsl(${230 + Math.random() * 10}, 40%, ${30 + Math.random() * 20}%)`

            buildings.push({
                id: `${type}-${i}`,
                x: currentX,
                y: 0,
                width,
                height,
                type,
                color: tint
            })

            currentX += width + (Math.random() * 20)
        }

        return buildings
    }

    // player refs
    const p1 = useRef<ExtendedPlayerState>({
        x: 100, y: 300, vx: 0, vy: 0, width: PLAYER_W, height: PLAYER_H, isGrounded: false, isDead: false, facingRight: true, realm: 'normal', lastRiftSwitch: 0, hp: 100, isClimbing: false, climbTargetY: null, climbLockX: null
    })

    const p2 = useRef<ExtendedPlayerState>({
        x: 600, y: 300, vx: 0, vy: 0, width: PLAYER_W, height: PLAYER_H, isGrounded: false, isDead: false, facingRight: false, realm: 'normal', lastRiftSwitch: 0, hp: 100, isClimbing: false, climbTargetY: null, climbLockX: null
    })

    const cameras = useRef({ normal: 100, rift: 600 })

    const normalBuildings = useRef<Building[]>(generateSkyline('normal'))
    const riftBuildings = useRef<Building[]>(generateSkyline('rift'))

    const inputs = useRef({ left: false, right: false, jump: false, attack: false })


    const updatePhysics = (p: ExtendedPlayerState, dt: number, buildings: Building[]) => {
        if (p.isDead) return

        if (p.isClimbing && p.climbTargetY !== null) {
            console.log('player is climbing', p.isClimbing)

            p.y += (p.climbTargetY - p.y) * CLIMB_SPEED * dt

            if (Math.abs(p.y - p.climbTargetY!) < 2) {
                p.y = p.climbTargetY!

                p.isClimbing = false
                p.isGrounded = true

                p.vy = 0
                p.climbTargetY = null

                p.climbLockX = null
            }

            return
        }

        const floorY = windowHeight

        p.x += p.vx * dt
        p.vy += GRAVITY * dt
        p.y += p.vy * dt

        let touchingWall = false

        for (const b of buildings) {
            const bTop = floorY - b.height

            const overlap = p.x < b.x + b.width && p.x + p.width > b.x && p.y + p.height > bTop

            if (!overlap) continue

            const headNearLedge = p.y + p.height >= bTop - 10 && p.y + p.height <= bTop + 60
            const nearLeftEdge = Math.abs((p.x + p.width) - b.x) < 12
            const nearRightEdge = Math.abs(p.x - (b.x + b.width)) < 12

            const isAtEdge = nearLeftEdge || nearRightEdge

            const wallX = nearLeftEdge ? b.x - p.width : b.x + b.width

            if (
                headNearLedge &&
                isAtEdge &&
                !p.isGrounded &&
                !p.isClimbing
            ) {
                p.isClimbing = true
                p.vx = 0
                p.vy = 0

                p.climbTargetY = bTop - p.height
                p.climbLockX = wallX

                p.x = wallX

                playSound('climb')
                return
            }

            if (p.y + p.height > bTop + 10 && (nearLeftEdge || nearRightEdge)) {

                touchingWall = true
                p.vx = 0
                p.x = wallX
            }

        }

        if (touchingWall && p.vy > WALL_SLIDE_SPEED) {
            p.vy = WALL_SLIDE_SPEED
        }

        // landing on bulding ground
        p.isGrounded = false

        for (const b of buildings) {

            const bTop = floorY - b.height

            if (p.x + p.width > b.x + 2 &&
                p.x < b.x + b.width - 2 &&
                p.y + p.height >= bTop &&
                p.y + p.height < bTop + 40 &&
                p.vy >= 0
            ) {

                p.y = bTop - p.height
                p.vy = 0
                p.isGrounded = true

            }
        }

        if (p.y > floorY + 200) {
            p.isDead = true

            
            setTimeout(() => {
                const spawn = getSafeSpawn(buildings, floorY)

                p.x = spawn.x
                p.y = spawn.y
                p.vy = 0
                p.vx = 0
                p.isDead = false
                p.isClimbing = false
                playSound('rift')
            }, 300)
        }
    }

    const getSafeSpawn = (buildings: Building[], floorY: number) => {
        const safe = buildings.filter(b => b.width > PLAYER_W + 20).map(b => ({
            x: b.x + b.width / 2 - PLAYER_W / 2,
            y: floorY - b.height - PLAYER_H
        }))

        return safe[Math.floor(Math.random() * safe.length)]
    }


    useGameLoop((dt) => {

        if (!isClient) return

        p1.current.vx = 0

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


        if (inputs.current.attack) {
            const targetArray = p1.current.realm === 'normal' ? normalBuildings.current : riftBuildings.current

            const attackX = p1.current.facingRight ? p1.current.x + PLAYER_W + 20 : p1.current.x - 20

            const hit = targetArray.find(b => attackX > b.x && attackX < b.x + b.width && Math.abs((windowHeight - b.height) - p1.current.y) < 100)

            if (hit) {
                hit.shakeUntil = Date.now() + 120
            }

            inputs.current.attack = false
        }

        updatePhysics(p1.current, dt, p1.current.realm === 'normal' ? normalBuildings.current : riftBuildings.current)
        updatePhysics(p2.current, dt, p2.current.realm === 'normal' ? normalBuildings.current : riftBuildings.current)

        if (p1.current.realm === 'normal') {
            cameras.current.normal = p1.current.x
        }
        if (p1.current.realm === 'rift') {
            cameras.current.rift = p1.current.x
        }


        setTick(t => t + 1)
    })

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase()
            if (k === 'a' || k === 'arrowleft') inputs.current.left = true
            if (k === 'd' || k === 'arrowright') inputs.current.right = true
            if (k === ' ' || k === 'w' || k === 'arrowup') inputs.current.jump = true
            if (k === 'z' || k === 'k') inputs.current.attack = true

            if (k === 'r') {
                handleRiftSwitch()
            }
        }

        const onKeyUp = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase()
            if (k === 'a' || k === 'arrowleft') inputs.current.left = false
            if (k === 'd' || k === 'arrowright') inputs.current.right = false
            if (k === ' ' || k === 'w' || k === 'arrowup') inputs.current.jump = false
        }




        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [])

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


    const isSplit = p1Realm !== p2Realm

    if (!isClient) return <div className="w-full h-full bg-black"></div>

    return (
        <div className="flex w-full h-full  relative overflow-hidden select-none font-mono bg-white">
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
                onAttack={() => inputs.current.attack = true}
            />

            <div className="absolute top-4 left-4 text-white font-bold text-shadow pointer-events-none z-50">
                P1: {p1Realm.toUpperCase()}
            </div>

        </div>
    )
}

function GameView({ cameraX, player, otherPlayer, buildings, isRift, active, screenWidthDivider, windowWidth, currentRealm }: any) {
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

            {player.realm === currentRealm && <div style={{
                position: 'absolute',
                left: player.x - offsetX,
                top: player.y,
                width: player.width,
                height: player.height,
                backgroundColor: isRift ? '#fff' : '#4b4c9d',
                boxShadow: isRift ? '0 0 15px white' : 'none',
                transform: player.isDead ? 'scale(0) rotate(180deg)' : (player.isClimbing ? 'scaleX(0.9)' : 'none'),
                transition: 'transform 0.25s ease-out'
            }}>
                <div className="absolute top-2 right-2 w-2 h-2 bg-white" style={{
                    right: player.facingRight ? 4 : 'auto',
                    left: player.facingRight ? 'auto' : 4
                }} />
                {player.isClimbing && (
                    <div className="absolute -top-4 w-full text-center text-[10px] text-white font-bold animate-pulse">
                        CLIMB!
                    </div>
                )}
            </div>}

            {otherPlayer.realm === currentRealm && <div style={{
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