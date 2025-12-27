'use client'

import { useGameLoop } from "@/hooks/useGameLoop"
import { calculateBotInputs } from "@/lib/aiLogic"
import { generateSkyline, getAnim, updatePhysics, useWindowSize } from "@/lib/game-utils"
import { Building, PlayerState } from "@/types/types"
import { useEffect, useRef, useState } from "react"
import RealmScene from "./bg/RealmScene"
import { realms } from "@/lib/realms"
import { GameView } from "./bg/SplitWorld"
import Fighter from "./game/Fighter"



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
        // spawnWave(1)
    })

    const spawnWave = (waveNumber: number) => {
        const count = 2 + Math.floor(waveNumber * 1.5)
        const newEnemies: Enemy[] = []

        for (let i = 0; i < count; i++) {
            const isBoss = i === count - 1 && waveNumber % 3 === 0
            const isElite = Math.random() > 0.7

            newEnemies.push({
                id: `enemy-${waveNumber}-${i}`,
                x: 800 + (i * 100),
                y: 0,
                vx: 0,
                vy: 0,
                width: PLAYER_W,
                height: PLAYER_H,
                isGrounded: false,
                isDead: false, facingRight: false, realm: 'normal', lastRiftSwitch: 0, hp: isBoss ? 500 : (isElite ? 200 : 100), isClimbing: false, climbLockX: null, climbTargetY: null, attackAnim: null, attackUntil: 0,
                variant: isBoss ? 'boss' : (isElite ? 'elite' : 'grunt')
            })


            
        }
        setEnemies(newEnemies)
    }

    useGameLoop((dt) => {
        if (!p1.current) return

        // handlePlayerInputs(p1.current)
        updatePhysics(p1.current, dt, buildings.current, windowHeight)
        cameraX.current = p1.current.x

        setEnemies(prev => {
            const updated = prev.map(enemy => {
                if (enemy.isDead) return enemy

                const botInputs = calculateBotInputs(enemy, p1.current, buildings.current, dt)

                enemy.vx = 0

                if (botInputs.left) {
                    enemy.vx = -MOVE_SPEED
                    enemy.facingRight = false
                }
                if (botInputs.right) {
                    enemy.vx = MOVE_SPEED
                    enemy.facingRight = true

                }
                if (botInputs.jump && enemy.isGrounded) {
                    enemy.vy = JUMP_FORCE
                }

                const now = Date.now()

                if (now > enemy.attackUntil) {
                    if (botInputs.punch) {
                        enemy.attackUntil = now + 500
                        enemy.attackAnim = 'PUNCH'

                        checkAttackHit(enemy, p1.current)
                    }
                }

                updatePhysics(enemy, dt, buildings.current, windowHeight)

                if (enemy.y > windowHeight + 200) enemy.isDead = true
                if (enemy.hp <= 0) enemy.isDead = true

                return {...enemy}
            })

            return updated
        })

        if (enemies.length > 0 && enemies.every(e => e.isDead)) {
            setWave(w => w + 1)
            spawnWave(wave + 1)
        }

    })

    const checkAttackHit = (attacker: any, victim: any) => {
        const range = 60
        const attackX = attacker.facingRight ? attacker.x + PLAYER_W + range : attacker.x - range

        if (
            attackX > victim.x &&
            attackX < victim.x + victim.width &&
            Math.abs(attacker.y - victim.y) < 50
        ) {
            victim.hp -= 10
            victim.vx = attacker.facingRight ? 300 : -300
        }
    }

    return (
        <div>
            <RealmScene realm={realms[0]} cameraOffset={cameraX.current} />

            <div className="absolute inset-0">
                <GameView
                    cameraX={cameraX.current}
                    player={p1.current}
                    otherPlayer={null}
                    buildings={buildings.current}
                    isRift={false}
                    active={true}
                    screenWidthDivider={1}
                    windowWidth={windowWidth}
                    currentRealm='normal'
                >
                    {enemies.filter(e => !e.isDead).map(enemy => (
                        <Fighter
                            key={enemy.id}
                            x={enemy.x - (cameraX.current - windowWidth / 2)}
                            y={enemy.y}
                            width={enemy.width}
                            height={enemy.width}
                            facingRight={enemy.facingRight}
                            anim={getAnim(enemy)}
                            variant={enemy.variant}
                        />
                    ))}
                </GameView>


            </div>

            
        </div>
    )
}