'use client'

import { generateSkyline, useWindowSize } from "@/lib/game-utils"
import { Building, PlayerState } from "@/types/types"
import { useEffect, useRef, useState } from "react"



const GRAVITY = 2000
const JUMP_FORCE = -850
const MOVE_SPEED = 450
const PLAYER_W = 30
const PLAYER_H = 70

interface Enemy extends PlayerState {
    id: string
    variant: 'grunt' | 'elite' | 'boss'
}

export default function TrainingArena() {
    const {width: windowWidth, height: windowHeight} = useWindowSize()

    const [enemies, setEnemies]= useState<Enemy[]>([])
    const [wave, setWave] = useState(1)

    const p1 = useRef<PlayerState>({
        x: 200, y: 300, vx: 0, vy: 0, width: PLAYER_W, height: PLAYER_H, isGrounded: false, isDead: false, facingRight: false, realm: 'normal', lastRiftSwitch: 0, hp: 100, isClimbing: false, climbTargetY: null, climbLockX: null, attackAnim: null, attackUntil: 0
    })

    const buildings = useRef<Building[]>([])
    const cameraX = useRef(0)
    const inputs = useRef({left: false, right: false, jump: false, punch: false, kick: false})

    useEffect(() => {
        buildings.current = generateSkyline('normal')
    })
}