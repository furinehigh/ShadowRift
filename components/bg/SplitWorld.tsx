'use client'

import { useRealmStore } from "@/store/realmStore"
import RealmScene from "./RealmScene"
import { realms } from "@/lib/realms"
import { useEffect, useMemo, useRef, useState } from "react"
import { Platform, PlayerState } from "@/types/types"
import { useGameLoop } from "@/hooks/useGameLoop"
import MobileControls from "../mobile/MobileControls"

const GRAVITY = 1800
const JUMP_FORCE = -800
const MOVE_SPEED = 400
const RIFT_COOLDOWN = 5000
const PLAYER_SIZE = 64
const GROUND_Y = 600
const BLOCK_COLOR = '#4b4c9d'

const playSound = (type: 'jump' | 'rift' | 'land') => {
    // const audio = new Audio(`/sfx/${type}.mp3`)
    // audio.volume = 0.5
    // audio.play().catch(() => {})
}

export default function SplitWorld() {
    const riftOpen = useRealmStore(s => s.riftOpen)
    const {toggleRift, openRift, closeRift} = useRealmStore()
    const [tick, setTick] = useState(0)

    // player refs
    const p1 = useRef<PlayerState>({
        x: 100, y: 300, vx: 0, vy: 0, isGrounded: false, isDead: false, facingRight: true, realm: 'normal', lastRiftSwitch: 0
    })

    const p2 = useRef<PlayerState>({
        x: 600, y: 300, vx: 0, vy: 0, isGrounded: false, isDead: false, facingRight: false, realm: 'normal', lastRiftSwitch: 0
    })

    const inputs = useRef({left: false, right: false, jump: false, attack: false})

    // platforms check
    const platforms = useMemo(() => {
        const plats: Platform[] = []

        let currentX = 0
        for (let i=0; i< 100; i++) {
            const gap = 100 + Math.random() * 150
            const width = 200 + Math.random() * 400
            const height = 50 + Math.random() * 150

            const yOffset = (Math.random() * 200) - 100

            plats.push({
                id: `p-${i}`,
                x: currentX,
                y: GROUND_Y - height + yOffset,
                width,
                height
            })

            currentX += width + gap
        }

        return plats
    }, [])

    // collisions
    const checkCollision = (p: PlayerState, dt: number) => {
        if (p.y > window.innerHeight + 100) {
            if (!p.isDead) {
                p.isDead = true
                console.log('Player died by falling :(')

                setTimeout(() => {
                    p.x = 100
                    p.y = 300
                    p.vy = 0
                    p.isDead = false
                }, 1000)
            }
            return


        }

        p.isGrounded = false

        const nextX = p.x + p.vx * dt
        const nextY = p.y + p.vy * dt


        for (const plat of platforms) {
            if (
                p.x + PLAYER_SIZE/2 > plat.x &&
                p.x + PLAYER_SIZE/2 < plat.x + plat.width &&
                p.y + PLAYER_SIZE <= plat.y + 10 &&
                nextY + PLAYER_SIZE >= plat.y
            ) {
                if (p.vy > 0) {
                    p.y = plat.y - PLAYER_SIZE
                    p.vy = 0
                    p.isGrounded = true
                    if (p.vy > 500) playSound('land')
                }
            }
        }
    }

    useGameLoop((dt) => {
        if (p1.current.isDead) return;

        p1.current.vx = 0

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
            p1.current.isGrounded = false
            playSound('jump')

            inputs.current.jump = false
        }

        p1.current.vy += GRAVITY * dt
        p1.current.x += p1.current.vx * dt
        p1.current.y += p1.current.vy * dt

        p2.current.vy += GRAVITY * dt
        p2.current.y += p2.current.vy * dt

        checkCollision(p1.current, dt)
        checkCollision(p2.current, dt)

        setTick(t => t+1)
    })

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase()
            if (k === 'a' || k === 'arrowleft') inputs.current.left = true
            if (k === 'd' || k === 'arrowright') inputs.current.right = true
            if (k === ' ' || k === 'w' || k === 'arrowup') inputs.current.jump = true

            if (k === 'r') {
                handleRiftToggle()
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

    const handleRiftToggle = () => {
        const now = Date.now()

        if (now - p1.current.lastRiftSwitch < RIFT_COOLDOWN) return

        p1.current.lastRiftSwitch = now
        playSound('rift')

        p1.current.realm = p1.current.realm === 'normal' ? 'shadow' : 'normal'

        if (p1.current.realm === 'shadow') openRift()
            else closeRift()
    }

    // rendering pos
    const getRenderStyle = (obj: {x: number, y: number, width: number, height: number}) => {
        const cameraX = p1.current.x - (window.innerWidth/2) + (PLAYER_SIZE/2)

        return {
            left: obj.x - cameraX,
            top: obj.y,
            widht: obj.width,
            height: obj.height
        }
    }

    const cameraOffset = p1.current.x

    return (
        <div className="flex w-full h-full  relative overflow-hidden select-none">
            <div className="relative h-full transition-all duration-500 ease-out border-r border-white/10"
                style={{ width: riftOpen ? '50%' : '100%' }}
            >
                <RealmScene realm={realms[0]} cameraOffset={cameraOffset} />

                <GameLayer 
                    p1={p1.current}
                    p2={p2.current}
                    platforms={platforms}
                    cameraX={cameraOffset - (riftOpen ? window.innerWidth / 4 : window.innerWidth / 2)}
                    viewportWidth={riftOpen ? window.innerWidth /2 : window.innerWidth}
                />
            </div>


            <div className="relative h-full transition-all duration-500 ease-out"
                style={{
                    width: riftOpen ? '50%' : '0%',
                    opacity: riftOpen ? 1 : 0
                }}
            >
                <RealmScene realm={realms[1]} cameraOffset={cameraOffset} />
                <GameLayer 
                    p1={p1.current}
                    p2={p2.current}
                    platforms={platforms}
                    cameraX={cameraOffset - window.innerWidth / 4}
                    viewportWidth={window.innerWidth /2}
                    isRift={true}
                />
            </div>

            <MobileControls
                onJump={() => inputs.current.jump = true}
                onLeft={(active) => inputs.current.left = active}
                onRight={(active) => inputs.current.right = active}
                onRift={handleRiftToggle}
                onAttack={() => {}}
            />

        </div>
    )
}

function GameLayer({p1, p2, platforms, cameraX, viewportWidth, isRift}: any) {
    const offsetX = cameraX

    return (
        <div className="absolute inset-0 pointer-events-none">

            {platforms.map((plat: Platform) => {
                const left = plat.x - offsetX
                if (left < -500 || left > viewportWidth + 500) return null

                return (
                    <div key={plat.id} style={{
                        position: 'absolute',
                        left,
                        top: plat.y,
                        width: plat.width,
                        height: plat.height,
                        backgroundColor: BLOCK_COLOR,
                        borderTop: '2px solid rgba(255, 255, 255, 0.2)'
                    }} />
                )
            })}

            <div style={{
                position: 'absolute',
                left: p1.x - offsetX,
                top: p1.y,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
                backgroundColor: isRift ? '#fff' : '#4b4c9d',
                border: '2px solid white',
                boxShadow: isRift ? '0 0 15px white' : 'none',
                transform: `scaleX(${p1.facingRight ? 1 : -1})`,
                transition: 'background-color 0.2s'
            }}>
                <div className="w-full h-full relative">
                    <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full" />
                </div>
            </div>

            <div style={{
                position: 'absolute',
                left: p2.x - offsetX,
                top: p2.y,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
                backgroundColor: '#ff4444',
                border: '2px solid white'
            }}>
                <div className="absolute -top-6 left-0 text-xs text-white bg-black/50 px-2 rounded">
                    Enemy
                </div>
            </div>

        </div>
    )
}