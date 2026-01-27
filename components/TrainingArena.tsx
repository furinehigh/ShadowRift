'use client'

import { useGameLoop } from "@/hooks/useGameLoop"
import { calculateBotInputs } from "@/lib/aiLogic"
import { generateSkyline, getAnim, getSafeSpawn, playSound, updatePhysics, useWindowSize } from "@/lib/game-utils"
import { Building, PlayerState } from "@/types/types"
import { useEffect, useMemo, useRef, useState } from "react"
import RealmScene from "./bg/RealmScene"
import { realms } from "@/lib/realms"
import { GameView } from "./bg/SplitWorld"
import MobileControls from "./mobile/MobileControls"
import { useSettings } from "@/context/SettingsContext"
import { useRealmStore } from "@/store/realmStore"
import { AnimatePresence, motion } from "framer-motion"
import PauseMenu from "./modals/PauseMenu"
import SettingsPage from "./SettingsPage"
import TrainingHUD from "./game/TrainingHud"
import EnemyIndicators from "./game/EnemyIndicators"
import { Skull, Target, Timer, Trophy } from "lucide-react"
import GameLayer from "./game/GameLayer"
import { audioController } from "@/lib/audioController"
import GameOverModal from "./modals/GameOver"
import TutorialOverlay, { TutorialStep } from "./game/TutorialOverlay"


const MAX_AUDIBLE_DISTANCE = 1000

const BASE_ENEMY_SPEED = {
    grunt: 240,
    elite: 300,
    boss: 350
}

const SCORE_VALUES = {
    grunt: 100,
    elite: 300,
    boss: 1000
}

const BASE_ENEMY_DAMAGE = {
    grunt: {
        kick: 2,
        punch: 1
    },
    elite: {
        kick: 3,
        punch: 2
    },
    boss: {
        kick: 6,
        punch: 4
    }
}

const RIFT_COOLDOWN = 5000
const MIN_JUMP_FORCE = -800
const MAX_JUMP_FORCE = -1050
const JUMP_BOOST = 800
const HIGH_JUMP_THRESHOLD = 200

const MOVE_SPEED = 450
const PLAYER_W = 30
const PLAYER_H = 70

const PLAYER_ATTACK_DAMAGE = {
    kick: 10,
    punch: 8
}
const ENEMY_HP_VISIBLE_TIME = 6000
const BASE_SPAWN = 4500
const MIN_SPAWN = 2000

const PLAYER_HEAL_DELAY = 4000
const PLAYER_HEAL_RATE = 10

const ENEMY_WAKE_DISTANCE = 800

const getSpawnDelay = (wave: number) => {
    const difficultyCurve = Math.max(
        MIN_SPAWN,
        BASE_SPAWN - wave * 120
    )

    const chaos = Math.random() * 250

    return difficultyCurve - chaos
}

const getWaveStats = (wave: number) => {
    const speedMult = Math.min(2.5, 1 + (wave * 0.05))

    const damageMult = 1 + (wave * 0.10)

    const aggression = 0.01 + (wave * 0.002)

    return { speedMult, damageMult, aggression }
}


interface Enemy extends PlayerState {
    id: string
    variant: 'grunt' | 'elite' | 'boss'
    maxHp: number
    lastHitTime: number
    deathTime?: number
    isAwake?: boolean
    fadeDone?: boolean
    speed: number
    damageMult: number
    aggression: number
}

interface HighScore {
    score: number
    date: string
}

export default function TrainingArena() {

    const { p1Realm, setP1Realm } = useRealmStore()
    const { width: windowWidth, height: windowHeight } = useWindowSize()
    const { keybinds, isEditingHud } = useSettings()

    const [isPaused, setIsPaused] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [tutorialStep, setTutorialStep] = useState<TutorialStep>('ASK')

    const [wave, setWave] = useState(1)

    const enemiesRef = useRef<Enemy[]>([])
    const spawnQueue = useRef<Enemy[]>([])
    const lastSpawnTime = useRef(0)
    const currentSpawnDelay = useRef(BASE_SPAWN)

    const [playerHp, setPlayerHp] = useState(100)

    const [score, setScore] = useState(0)
    const [kills, setKills] = useState(0)
    const [isGameOver, setIsGameOver] = useState(false)

    const [respawnTimer, setRespawnTimer] = useState(5)
    const [highScores, setHighScores] = useState<HighScore[]>([])

    const [camUi, setCamUi] = useState({ normal: 0, rift: 0 })
    const lastCamSync = useRef(0)

    const tutorialTimer = useRef(0)
    const normalBuildings = useRef<Building[]>([])
    const riftBuildings = useRef<Building[]>([])

    const p1 = useRef<PlayerState>({
        x: 200, y: 300, vx: 0, vy: 0, width: PLAYER_W, height: PLAYER_H, isGrounded: false, isDead: false, isDying: false, facingRight: false, realm: 'normal', lastRiftSwitch: 0, hp: 100, isClimbing: false, climbTargetY: null, climbLockX: null, attackAnim: null, attackUntil: 0, stunUntil: 0, hitAnim: null, lastHitTime: 0, highJumpTimer: 0, didHighJumpVoice: false
    })

    const cameraX = useRef(0)

    const camera = useRef({ normal: 0, rift: 0 })
    const inputs = useRef({ left: false, right: false, jump: false, kick: false, kickHeld: false, punch: false, punchHeld: false, jumpHeld: false })

    // const lastUiSync = useRef(0)

    const getSpatialVolume = (targetX: number) => {
        if (!p1.current) return 0
        const distance = Math.abs(p1.current.x - targetX)
        const volume = Math.max(0, 1 - (distance / MAX_AUDIBLE_DISTANCE))
        return volume
    }

    useEffect(() => {
        normalBuildings.current = generateSkyline('normal')
        riftBuildings.current = generateSkyline('rift')
        setP1Realm('normal')
        enemiesRef.current = []
        spawnQueue.current = []
        // queueWave(1)
        loadHighScore()

    }, [])

    const skipTutorial = () => {
        setTutorialStep('NONE')
        queueWave(1)
    }

    const startTutorial = () => {
        setTutorialStep('MOVE')

        if (p1.current) {
            const spawn = getSafeSpawn(normalBuildings.current, windowHeight)
            p1.current.x = spawn.x
            p1.current.y = spawn.y
        }
    }

    const spawnTutorialDummy = () => {
        if (!p1.current) return

        const spawnX = p1.current.x + 300
        const spawnY = p1.current.y

        const dummy: Enemy = {
            id: 'tutorial-dummy',
            x: spawnX,
            y: spawnY - 100,
            vx: 0, vy: 0,
            width: PLAYER_W, height: PLAYER_H,
            isGrounded: false, isDead: false, isDying: false, facingRight: false,
            realm: p1.current.realm,
            lastRiftSwitch: 0,
            hp: 50, maxHp: 50,
            lastHitTime: 0, isClimbing: false, climbLockX: null, climbTargetY: null,
            attackAnim: null, attackUntil: 0, stunUntil: 0, hitAnim: null,
            variant: 'grunt',
            isAwake: true,
            speed: 50,
            damageMult: 0,
            aggression: 0
        }

        enemiesRef.current.push(dummy)
        playSound('rift', 1.0)
    }

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined
        if (isGameOver && respawnTimer > 0) {
            interval = setInterval(() => {
                setRespawnTimer(prev => prev - 1)
            }, 1000)
        } else if (isGameOver && respawnTimer === 0) {
            resetGame()
        }

        return () => clearInterval(interval)
    }, [isGameOver, respawnTimer])

    const loadHighScore = () => {
        const stored = localStorage.getItem('training_highscores')
        if (stored) {
            setHighScores(JSON.parse(stored))
        }
    }

    const saveHighScore = (finalScore: number) => {
        const newScore = { score: finalScore, date: new Date().toLocaleDateString() }
        const updated = [...highScores, newScore].sort((a, b) => b.score - a.score).slice(0, 5)

        setHighScores(updated)
        localStorage.setItem('training_highscores', JSON.stringify(updated))
    }


    const resetGame = () => {
        setIsGameOver(false)
        setRespawnTimer(5)
        setScore(0)
        setKills(0)
        setWave(1)
        setPlayerHp(100)

        enemiesRef.current = []
        spawnQueue.current = []

        if (p1.current) {
            const spawn = getSafeSpawn(normalBuildings.current, windowHeight)

            p1.current.x = spawn.x
            p1.current.y = spawn.y
            p1.current.vx = 0
            p1.current.vy = 0
            p1.current.hp = 100
            p1.current.isDead = false
            p1.current.isDying = false
            p1.current.isClimbing = false
            p1.current.realm = 'normal'
            p1.current.stunUntil = 0
            p1.current.lastHitTime = Date.now()
            setP1Realm('normal')
        }

        queueWave(1)
    }

    const handlePlayerDeath = (fall?: boolean) => {
        if (isGameOver) return

        if (fall) {
            playSound('fall-death')
        } else {

            playSound('death')
        }

        p1.current.isDying = true
        setIsGameOver(true)
        setRespawnTimer(5)
        saveHighScore(score)
    }

    const queueWave = (waveNumber: number) => {
        const { speedMult, damageMult, aggression } = getWaveStats(waveNumber)

        const count = 2 + Math.floor(waveNumber * 1.5)
        // const newEnemies: Enemy[] = []
        currentSpawnDelay.current = getSpawnDelay(waveNumber)

        const currentBuildingSet = normalBuildings.current


        for (let i = 0; i < count; i++) {
            const isBoss = i === count - 1 && waveNumber % 3 === 0
            const isElite = !isBoss && (Math.random() > (0.7 - (waveNumber * 0.01)))

            const spawn = getSafeSpawn(currentBuildingSet, windowHeight)

            const randomOffsetX = (Math.random() * 40) - 20

            const hpMult = 1 + (waveNumber * 0.05)
            const baseHp = isBoss ? 500 : (isElite ? 200 : 100)

            const maxHp = Math.floor(baseHp * hpMult)

            const baseSpeed = BASE_ENEMY_SPEED[isBoss ? 'boss' : (isElite ? 'elite' : 'grunt')]
            const finalSpeed = baseSpeed * speedMult

            spawnQueue.current.push({
                id: crypto.randomUUID(),
                x: spawn.x + randomOffsetX,
                y: spawn.y,
                vx: 0,
                vy: 0,
                width: PLAYER_W,
                height: PLAYER_H,
                isGrounded: false,
                isDead: false, isDying: false, facingRight: false, realm: 'normal', lastRiftSwitch: 0, hp: maxHp, maxHp, lastHitTime: 0, isClimbing: false, climbLockX: null, climbTargetY: null, attackAnim: null, attackUntil: 0, stunUntil: 0, hitAnim: null,
                variant: isBoss ? 'boss' : (isElite ? 'elite' : 'grunt'), isAwake: false,
                speed: finalSpeed,
                damageMult,
                aggression
            })


        }
    }

    useGameLoop((dt) => {
        if (!p1.current || isPaused) {
            audioController.stopLoop('run')
            audioController.stopLoop('walk')

            return
        }
        const now = Date.now()

        if (tutorialStep === 'NONE') {
            if (spawnQueue.current.length > 0 && now - lastSpawnTime.current > currentSpawnDelay.current) {
                const newEnemy = spawnQueue.current.shift()

                if (newEnemy) {
                    enemiesRef.current.push(newEnemy)
                    lastSpawnTime.current = now
                    currentSpawnDelay.current = getSpawnDelay(wave)

                    const enemyVol = getSpatialVolume(newEnemy.x)
                    playSound('rift', enemyVol)
                }
            }
        }


        const player = p1.current
        const isStunned = now < p1.current.stunUntil
        const playerBuildings = p1.current.realm === 'normal' ? normalBuildings.current : riftBuildings.current

        if (!player.isDead && !player.isDying) {

            p1.current.vx = 0

            if (!p1.current.isClimbing && !isStunned) {
                if (inputs.current.left) {
                    p1.current.vx = -MOVE_SPEED
                    p1.current.facingRight = false
                }

                if (inputs.current.right) {
                    p1.current.vx = MOVE_SPEED
                    p1.current.facingRight = true
                }
                if (inputs.current.jump && p1.current.isGrounded) {
                    p1.current.vy = MIN_JUMP_FORCE
                    p1.current.highJumpTimer = 0
                    p1.current.didHighJumpVoice = false
                    inputs.current.jump = false
                    playSound('jump', 1.0)
                }

                if (p1.current.vy < 0 && inputs.current.jumpHeld && !p1.current.isGrounded) {
                    p1.current.vy -= JUMP_BOOST * dt

                    if (p1.current.vy < MAX_JUMP_FORCE) p1.current.vy = MAX_JUMP_FORCE

                    p1.current.highJumpTimer! += dt * 1000
                    if (p1.current.highJumpTimer! > HIGH_JUMP_THRESHOLD && !p1.current.didHighJumpVoice) {
                        playSound('voice-whoa', 0.4)

                        p1.current.didHighJumpVoice = true
                    }
                }
            } else if (p1.current.isClimbing && !isStunned) {
                if (inputs.current.jump) {
                    p1.current.vy = MIN_JUMP_FORCE
                    p1.current.vx = p1.current.facingRight ? -MOVE_SPEED : MOVE_SPEED

                    p1.current.isClimbing = false
                    inputs.current.jump = false
                    playSound('jump', 1.0)
                }
            }

            if (!isStunned && now > player.attackUntil) {
                if (inputs.current.punch) {
                    p1.current.attackUntil = now + 500
                    p1.current.attackAnim = 'PUNCH'
                    inputs.current.punch = false

                    const arr = enemiesRef.current
                    for (let i = 0; i < arr.length; i++) {
                        const e = arr[i];
                        if (!e.isDead && e.realm === p1.current.realm) checkAttackHit(p1.current, e, false, 'punch')
                    }
                    playSound('punch', 1.0)
                } else if (inputs.current.kick) {
                    p1.current.attackUntil = now + 500
                    p1.current.attackAnim = 'LEG_ATTACK_1'
                    inputs.current.kick = false
                    const arr = enemiesRef.current
                    for (let i = 0; i < arr.length; i++) {
                        const e = arr[i];
                        if (!e.isDead && e.realm === p1.current.realm) checkAttackHit(p1.current, e, false, 'kick')
                    }
                    playSound('kick', 1.0)
                }
            }
        }

        const speed = Math.abs(player.vx)
        const isMoving = speed > 10

        if (player.isGrounded && !player.isDead && !player.isClimbing && !isStunned && isMoving) {
            if (speed > 300) {
                audioController.stopLoop('walk')
                audioController.startLoop('run')
            } else {
                audioController.stopLoop('run')
                audioController.startLoop('walk')
            }
        } else {
            audioController.stopLoop('run')
            audioController.stopLoop('walk')
        }

        if (!p1.current.isDead && !p1.current.isDying) {
            const timeSinceHit = now - p1.current.lastHitTime

            if (timeSinceHit > PLAYER_HEAL_DELAY && p1.current.hp < 100) {
                const healAmount = PLAYER_HEAL_RATE * dt

                const newHp = Math.min(100, p1.current.hp + healAmount)

                p1.current.hp = newHp

                setPlayerHp(newHp)
            }
        }


        updatePhysics(p1.current, dt, playerBuildings, windowHeight, 1.0)

        cameraX.current = p1.current.x

        if (player.realm === 'normal') camera.current.normal = player.x
        else camera.current.rift = player.x

        if (tutorialStep !== "NONE" && tutorialStep !== 'ASK' && tutorialStep !== 'COMPLETE') {
            const p = p1.current

            switch (tutorialStep) {
                case 'MOVE':
                    if (Math.abs(p.vx) > 100) {
                        tutorialTimer.current += dt
                        if (tutorialTimer.current > 1.5) {
                            setTutorialStep('JUMP')
                            tutorialTimer.current = 0
                            playSound('land')
                        }
                    }
                    break;

                case "JUMP":
                    if (!p.isGrounded && p.vy < -100) {
                        setTutorialStep('HIGH_JUMP')
                        tutorialTimer.current = 0
                    }
                    break;

                case 'HIGH_JUMP':
                    if (inputs.current.jumpHeld && p.highJumpTimer! > 100) {
                        if (p.isGrounded) {
                            setTutorialStep('RIFT')
                        }
                    }
                    break;

                case 'RIFT':
                    if (now - p.lastRiftSwitch < 500) {
                        tutorialTimer.current += dt
                        if (tutorialTimer.current > 1.0) {
                            spawnTutorialDummy()
                            setTutorialStep('COMBAT')
                        }
                    }
                    break

                case 'COMBAT':
                    if (enemiesRef.current.length === 0 && enemiesRef.current.every(e => e.isDead || e.fadeDone)) {
                        setTutorialStep('COMPLETE')
                        setTimeout(() => {
                            setTutorialStep('NONE')
                            resetGame()
                            queueWave(1)
                        }, 3000)
                    }
                    break
            }
        }

        const arr = enemiesRef.current

        for (let i = 0; i < arr.length; i++) {
            const enemy = arr[i];
            if (enemy.fadeDone) {
                arr.splice(i, 1)
                continue
            }

            const enemyVol = getSpatialVolume(enemy.x)

            const botBuildings = enemy.realm === 'normal' ? normalBuildings.current : riftBuildings.current

            if (enemy.isDying) {
                updatePhysics(enemy, dt, botBuildings, windowHeight, enemyVol)
                if (enemy.y > windowHeight + 500) {
                    arr.splice(i, 1)
                }

                continue
            }

            if (!enemy.isDead && !enemy.isDying && enemy.hp < enemy.maxHp) {
                const timeSinceHit = now - enemy.lastHitTime
                if (timeSinceHit > 4000) {
                    enemy.hp = Math.min(enemy.maxHp, enemy.hp + (10 * dt))
                }
            }

            const dx = Math.abs(enemy.x - player.x)
            if (!enemy.isAwake) {
                if (dx < ENEMY_WAKE_DISTANCE && enemy.realm === player.realm) enemy.isAwake = true
                else continue
            } else {
                if (dx > ENEMY_WAKE_DISTANCE) {
                    enemy.vx = 0
                    enemy.isAwake = false
                    continue
                }
            }

            if (now < enemy.stunUntil) {
                enemy.vx = 0
                updatePhysics(enemy, dt, botBuildings, windowHeight, enemyVol)
                continue
            }

            const botInputs = calculateBotInputs(enemy, p1.current, botBuildings, dt, enemy.aggression)

            enemy.vx = 0

            if (botInputs.rift) {
                const canRift = now - enemy.lastRiftSwitch > RIFT_COOLDOWN
                if (canRift) {
                    enemy.lastRiftSwitch = now
                    enemy.realm = enemy.realm === 'normal' ? 'rift' : 'normal'
                    enemy.isClimbing = false
                    const enemyVol = getSpatialVolume(enemy.x)
                    playSound('rift', enemyVol)
                }
            }

            const speed = enemy.speed

            if (!enemy.isClimbing) {

                if (botInputs.left) {
                    enemy.vx = -speed
                    enemy.facingRight = false
                }
                if (botInputs.right) {
                    enemy.vx = speed
                    enemy.facingRight = true

                }
                if (botInputs.jump && enemy.isGrounded) {
                    enemy.vy = MIN_JUMP_FORCE
                    const enemyVol = getSpatialVolume(enemy.x)
                    playSound('jump', enemyVol)
                }
            }



            if (now > enemy.attackUntil) {
                if (enemy.realm === p1.current.realm && !p1.current.isDying && !p1.current.isDead) {
                    if (botInputs.punch) {
                        enemy.attackUntil = now + 500
                        enemy.attackAnim = 'PUNCH'

                        checkAttackHit(enemy, p1.current, true, 'punch')
                    } else if (botInputs.kick) {
                        enemy.attackUntil = now + 500
                        enemy.attackAnim = 'LEG_ATTACK_1'

                        checkAttackHit(enemy, p1.current, true, 'kick')

                    }
                }
            }

            updatePhysics(enemy, dt, botBuildings, windowHeight)

            if (enemy.y > windowHeight + 200) enemy.isDead = true
            if (enemy.hp <= 0 && !enemy.isDying) enemy.isDying = true
        }

        const allEnemiesDefeated = arr.length > 0 && arr.every(e => e.isDying || e.isDead)

        if (allEnemiesDefeated && spawnQueue.current.length === 0) {
            const next = wave + 1
            setWave(next)
            queueWave(next)
        }

        if ((p1.current.hp <= 0 || p1.current.y > windowHeight + 200) && !p1.current.isDying && !p1.current.isDead) {
            handlePlayerDeath(true)
        }

        if (now - lastCamSync.current > 10) {
            lastCamSync.current = now
            setCamUi({
                normal: camera.current.normal,
                rift: camera.current.rift
            })
        }

    })


    const checkAttackHit = (attacker: any, victim: any, isVictimPlayer: boolean, attackType: 'punch' | 'kick') => {
        if (victim.isDead || isGameOver || victim.isDying) return

        if (attacker.realm !== victim.realm) return

        // playSound('damage')

        const range = 30
        const hitbox = attacker.facingRight ? { x: attacker.x + attacker.width, y: attacker.y, width: range, height: attacker.height } : { x: attacker.x - range, y: attacker.y, width: range, height: attacker.height }

        const victimBox = {
            x: victim.x,
            y: victim.y,
            width: victim.width,
            height: victim.height
        }

        const overlap = hitbox.x < victimBox.x + victimBox.width && hitbox.x + hitbox.width > victimBox.x && hitbox.y < victimBox.y + victimBox.height && hitbox.y + hitbox.height > victimBox.y

        if (!overlap) return

        const hitVol = isVictimPlayer ? 1.0 : getSpatialVolume(victim.x)
        playSound('damage', hitVol)

        let damage = 0
        if (isVictimPlayer) {
            const variant = attacker.variant as keyof typeof BASE_ENEMY_DAMAGE
            const baseDmg = BASE_ENEMY_DAMAGE[variant][attackType]

            damage = baseDmg * (attacker.damageMult || 1)
        } else {
            damage = PLAYER_ATTACK_DAMAGE[attackType]
        }

        victim.hp -= Math.ceil(damage)

        const now = Date.now()
        victim.stunUntil = now + (isVictimPlayer ? 300 : 800)
        victim.hitAnim = attackType === 'kick' ? 'KICK_EFFECT_COUNTER' : 'PUNCH_EFFECT'

        victim.vx = attacker.facingRight ? 300 : -300
        if (victim.isClimbing) victim.isClimbing = false

        if (victim.hp <= 0) {
            victim.hp = 0
            victim.isDying = true

            if (isVictimPlayer) {
                handlePlayerDeath()
            } else {
                playSound('death', hitVol)
                const pts = SCORE_VALUES[victim.variant as keyof typeof SCORE_VALUES] || 100
                setScore(s => s + pts)
                setKills(k => k + 1)
            }

            return
        }

        if (isVictimPlayer) {
            setPlayerHp(victim.hp)
            p1.current.lastHitTime = Date.now()
            playSound('land', 1.0)
        } else {
            victim.lastHitTime = Date.now()
            playSound('land', hitVol)
        }
    }


    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (isGameOver) return
            const k = e.key.toLowerCase()

            if (k === 'escape') {
                setIsPaused(prev => !prev)
            }

            if (k === keybinds.left || k === 'arrowleft') inputs.current.left = true
            if (k === keybinds.right || k === 'arrowright') inputs.current.right = true


            if (k === keybinds.jump || k === 'arrowup') {
                if (!inputs.current.jumpHeld) inputs.current.jump = true
                inputs.current.jumpHeld = true
            }
            if (k === keybinds.kick) {
                if (!inputs.current.kickHeld) inputs.current.kick = true
                inputs.current.kickHeld = true
            }
            if (k === keybinds.punch) {
                if (!inputs.current.punchHeld) inputs.current.punch = true
                inputs.current.punchHeld = true
            }

            if (k === keybinds.rift) {
                handleRiftSwitch()
            }
        }

        const onKeyUp = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase()
            if (k === keybinds.left || k === 'arrowleft') inputs.current.left = false
            if (k === keybinds.right || k === 'arrowright') inputs.current.right = false
            if (k === keybinds.jump || k === 'arrowup') inputs.current.jumpHeld = false
            if (k === keybinds.kick) inputs.current.kickHeld = false
            if (k === keybinds.punch) inputs.current.punchHeld = false
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

    const playerForHud = useMemo(() => ({ ...p1.current, hp: playerHp }), [playerHp])


    return (
        <div className="flex w-full h-full relative overflow-hidden select-none bg-white">

            <TutorialOverlay step={tutorialStep} onAccept={startTutorial} onDecline={skipTutorial} />

            <AnimatePresence>
                {isPaused && !showSettings && !isEditingHud && (
                    <PauseMenu onResume={() => setIsPaused(false)} onSettings={() => setShowSettings(true)} onExit={handleExit} isOnline={false} />
                )}
            </AnimatePresence>

            <GameOverModal isGameOver={isGameOver} wave={wave} score={score} kills={kills} highScores={highScores} respawnTimer={respawnTimer} />

            <AnimatePresence>
                {showSettings && (
                    <SettingsPage onClose={() => setShowSettings(false)} />
                )}
            </AnimatePresence>

            <div className="relative h-full overflow-hidden transition-all duration-300 border-r border-white/20" style={{ width: p1Realm === 'normal' ? '100%' : '50%' }}>
                <RealmScene realm={realms[0]} cameraOffset={camUi.normal} />
                <GameView
                    cameraX={camUi.normal}
                    buildings={normalBuildings.current}
                    isRift={false}
                    active={true}
                    screenWidthDivider={p1Realm === 'normal' ? 1 : 2}
                    windowWidth={windowWidth}
                >
                    {enemiesRef.current.filter(e => !e.isDead && e.realm === 'normal').map(enemy => (
                        <EnemyHpBar key={enemy.id} enemy={enemy} cameraX={camUi.normal} windowWidth={windowWidth} screenWidthDivider={p1Realm === 'normal' ? 1 : 2} />
                    ))}
                </GameView>

                <GameLayer
                    width={p1Realm === 'normal' ? windowWidth : windowWidth / 2}
                    height={windowHeight}
                    cameraRef={camera}
                    playerRef={p1}
                    enemiesRef={enemiesRef}
                    realm="normal"
                />
            </div>


            <div className="relative h-full overflow-hidden transition-all duration-300" style={{ width: p1Realm === 'rift' ? '50%' : '0%', opacity: 1 }}>
                <RealmScene realm={realms[1]} cameraOffset={camUi.rift} />
                <GameView
                    cameraX={camUi.rift}
                    buildings={riftBuildings.current}
                    isRift={true}
                    active={true}
                    screenWidthDivider={2}
                    windowWidth={windowWidth}
                />

                <GameLayer
                    width={windowWidth / 2}
                    height={windowHeight}
                    cameraRef={camera}
                    playerRef={p1}
                    enemiesRef={enemiesRef}
                    realm="rift"
                />
            </div>


            <TrainingHUD wave={wave} enemiesRef={enemiesRef} player={playerForHud} />
            <EnemyIndicators enemiesRef={enemiesRef} player={p1.current} width={windowWidth} height={windowHeight} />

            {tutorialStep !== 'ASK' &&
                <MobileControls
                    onJump={(pressed) => {
                        if (pressed) {
                            if (!inputs.current.jumpHeld) inputs.current.jump = true
                            inputs.current.jumpHeld = true
                        } else {
                            inputs.current.jumpHeld = false
                        }
                    }}
                    onLeft={(a) => inputs.current.left = a}
                    onRight={(a) => inputs.current.right = a}
                    onAttack={(t: string, pressed: boolean) => {
                        if (t === 'KICK') {
                            if (pressed) {
                                if (!inputs.current.kickHeld) inputs.current.kick = true
                                inputs.current.kickHeld = true
                            } else {
                                inputs.current.kickHeld = false
                            }
                        } else {
                            if (pressed) {

                                if (!inputs.current.punchHeld) inputs.current.punch = true
                                inputs.current.punchHeld = true
                            } else {
                                inputs.current.punchHeld = false
                            }
                        }
                    }}
                    onPause={() => setIsPaused(true)}
                    onRift={handleRiftSwitch}
                />
            }
        </div>
    )
}


function EnemyHpBar({ enemy, cameraX, windowWidth, screenWidthDivider = 1 }: { enemy: Enemy, cameraX: number, windowWidth: number, screenWidthDivider?: number }): React.ReactNode {

    const offset = cameraX - (windowWidth / screenWidthDivider) / 2
    const relativeX = enemy.x - offset
    const showHp = !enemy.isDying && !enemy.isDead && Date.now() - enemy.lastHitTime < ENEMY_HP_VISIBLE_TIME

    return (
        <div className="relative">
            {showHp && (
                <div className="absolute z-20" style={{
                    left: relativeX + (PLAYER_W / 2) - 20,
                    top: enemy.y - 15,
                    width: '40px',
                    height: '6px'
                }}>
                    <div className="w-full h-full bg-gray-900 border border-black relative">
                        <div className="h-full bg-red-600 transition-all duration-100" style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }} />
                    </div>
                </div>
            )}
        </div>
    )
}