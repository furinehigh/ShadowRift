import { Building, PlayerState } from "@/types/types"
import { useEffect, useState } from "react"
import { audioController, SountType } from "./audioController"
import { ColorMatrixFilter } from "pixi.js"

const CLIMB_SPEED = 6
const WALL_SLIDE_SPEED = 50
const GRAVITY = 2000
const PLAYER_W = 30
const PLAYER_H = 70


export const playSound = (type: SountType, volume: number = 1.0) => {
    audioController.playSFX(type, volume)
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



export function getAnim(p: PlayerState) {
    if (p.isDying || (p.hp <= 0 && !p.isDead)) return 'DEATH'

    if (p.isClimbing) return 'CLIMB'
    if (Date.now() < p.stunUntil && p.hitAnim) {
        return p.hitAnim
    }


    if (Date.now() < p.attackUntil && p.attackAnim) {
        return p.attackAnim
    }
    if (!p.isGrounded && p.vy < 0) return "JUMP"
    // if (!p.isGrounded && p.vy > 0) return 'FALL'

    if (Math.abs(p.vx) > 350) return 'RUN'
    if (Math.abs(p.vx) > 10) return 'WALK'
    return 'IDLE'
}


export const getSafeSpawn = (buildings: Building[], floorY: number) => {
    const safe = buildings.filter(b => b.width > PLAYER_W + 20).map(b => ({
        x: b.x + b.width / 2 - PLAYER_W / 2,
        y: floorY - b.height - PLAYER_H
    }))

    return safe[Math.floor(Math.random() * safe.length)]
}

export const updatePhysics = (p: PlayerState, dt: number, buildings: Building[], windowHeight: number, soundVolume: number = 1.0) => {

    const isFallingOff = p.y > windowHeight

    if ((p.isDead || p.isDying) && !isFallingOff) return

    const isStunned = Date.now() < p.stunUntil

    const floorY = windowHeight

    // const prevX = p.x
    const prevY = p.y

    if (p.isClimbing && p.climbTargetY !== null && !isStunned) {
        // console.log('player is climbing', p.isClimbing)

        p.y += (p.climbTargetY - p.y) * CLIMB_SPEED * dt

        if (Math.abs(p.y - p.climbTargetY!) < 2) {
            p.y = p.climbTargetY


            p.vy = 0
            p.isClimbing = false
            p.isGrounded = true
            p.climbTargetY = null

            p.climbLockX = null
        }

        return
    }


    p.x += p.vx * dt

    let touchingWall = false

    for (const b of buildings) {
        const bTop = floorY - b.height

        const overlap = p.x < b.x + b.width && p.x + p.width > b.x && p.y + p.height > bTop && p.y < floorY

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
            !p.isClimbing &&
            !isStunned &&
            !p.isDying
        ) {
            p.isClimbing = true
            p.vx = 0
            p.vy = 0

            p.climbTargetY = bTop - p.height
            p.climbLockX = wallX

            p.x = wallX

            playSound('climb', soundVolume)
            return
        }

        if ((nearLeftEdge || nearRightEdge)) {

            touchingWall = true
            p.vx = 0
            p.x = wallX
        }

    }

    p.vy += GRAVITY * dt

    if (touchingWall && p.vy > WALL_SLIDE_SPEED) {
        p.vy = WALL_SLIDE_SPEED
    }
    p.y += p.vy * dt

    // landing on bulding ground
    p.isGrounded = false

    for (const b of buildings) {

        const bTop = floorY - b.height

        if (p.x + p.width > b.x + 2 &&
            p.x < b.x + b.width - 2 &&
            prevY + p.height <= bTop &&
            p.y + p.height >= bTop &&
            p.vy >= 0
        ) {

            p.y = bTop - p.height
            p.vy = 0
            p.isGrounded = true

        }
    }

    // if (p.y + p.height >= floorY && p.vy > 0) {
    //     p.y = floorY - p.height
    //     p.vy = 0
    //     p.isGrounded = true
    // }

    // if (p.y > floorY + 200) {
    //     p.isDead = true


    //     setTimeout(() => {
    //         const spawn = getSafeSpawn(buildings, floorY)

    //         p.x = spawn.x
    //         p.y = spawn.y
    //         p.vy = 0
    //         p.vx = 0
    //         p.isDead = false
    //         p.isClimbing = false
    //         playSound('rift')
    //     }, 300)
    // }
}

export const generateSkyline = (type: 'normal' | 'rift'): Building[] => {
    const buildings: Building[] = []
    let currentX = 0
    const count = 50


    buildings.push({
        id: `start-plat`,
        x: 100,
        y: 0,
        width: 400,
        height: 200,
        type,
        color: type === "rift" ? '#4a1d96' : '#2d3748'
    })

    currentX = 500

    for (let i = 0; i < count; i++) {
        const isGap = Math.random() > 0.8
        const gapSize = isGap ? 40 + Math.random() * 40 : 0

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

export const applyVariantStyle = (armature: any, variant?: string) => {
    const children = armature.children || []

    for (let i = 0; i < children.length; i++) {
        const c: any = children[i];
        if (c && typeof c.tint !== 'undefined') c.tint = 0xFFFFFF
    }

    armature.filters = null

    if (!variant) return

    if (variant === 'grunt') {
        for (let i = 0; i < children.length; i++) {
            const c: any = children[i];
            if (c && typeof c.tint !== 'undefined') c.tint = 0xFF7777
        }
        return
    }

    if (variant === 'elite') {
        for (let i = 0; i < children.length; i++) {
            const c: any = children[i];
            if (c && typeof c.tint !== 'undefined') c.tint = 0xFFD700
        }
        return

    }

    if (variant === 'boss') {
        for (let i = 0; i < children.length; i++) {
            const c: any = children[i];
            if (c && typeof c.tint !== 'undefined') c.tint = 0xAA20FF
        }

        const filter = new ColorMatrixFilter()
        filter.brightness(1.15, false)
        armature.filters = [filter]
    }
}