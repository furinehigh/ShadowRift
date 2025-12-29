import { Building, PlayerState } from "@/types/types"
import { useEffect, useState } from "react"

const CLIMB_SPEED = 6
const WALL_SLIDE_SPEED = 50
const GRAVITY = 2000
const PLAYER_W = 30
const PLAYER_H = 70


export const playSound = (type: 'jump' | 'rift' | 'land' | 'climb') => {
    // const audio = new Audio(`/sfx/${type}.mp3`)
    // audio.volume = 0.5
    // audio.play().catch(() => {})
}



// SSR safe
export function useWindowSize() {
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



export function getAnim(p: any) {
    if (p.isDead) return 'DEATH'
    if (p.isClimbing) return 'CLIMB'
    if (Date.now() < p.attackUntil && p.attackAnim) {
        return p.attackAnim
    }
    if (!p.isGrounded && p.vy < 0) return "JUMP"
    if (Math.abs(p.vx) > 350) return 'RUN'
    if (Math.abs(p.vx) > 10) return 'WALK'
    return 'animation0'
}


const getSafeSpawn = (buildings: Building[], floorY: number) => {
    const safe = buildings.filter(b => b.width > PLAYER_W + 20).map(b => ({
        x: b.x + b.width / 2 - PLAYER_W / 2,
        y: floorY - b.height - PLAYER_H
    }))

    return safe[Math.floor(Math.random() * safe.length)]
}

export const updatePhysics = (p: PlayerState, dt: number, buildings: Building[], windowHeight: number) => {
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

    if (p.y + p.height >= floorY && p.vy > 0) {
        p.y = floorY - p.height
        p.vy = 0
        p.isGrounded = true
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

export const generateSkyline = (type: 'normal' | 'rift'): Building[] => {
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

    