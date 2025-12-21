'use client'

import { useRealmStore } from "@/store/realmStore"
import RealmScene from "./RealmScene"
import { realms } from "@/lib/realms"
import { useEffect, useMemo, useRef, useState } from "react"
import { Platform, PlayerState } from "@/types/types"
import { useGameLoop } from "@/hooks/useGameLoop"

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
                // handleRiftToggle or smth
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

    return (
        <div className="flex w-full h-full  relative overflow-hidden">
            <div className="relative h-full transition-all duration-500 ease-out"
                style={{ width: riftOpen ? '50%' : '100%' }}
            >
                {/* <RealmScene realm={realms[0]} /> */}
            </div>


            <div className="relative h-full transition-all duration-500 ease-out"
                style={{
                    width: riftOpen ? '50%' : '0%',
                    opacity: riftOpen ? 1 : 0
                }}
            >
                {/* <RealmScene realm={realms[1]} /> */}
            </div>

        </div>
    )
}