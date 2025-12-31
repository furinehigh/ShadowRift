'use client'

import { useGameLoop } from "@/hooks/useGameLoop"
import { calculateBotInputs } from "@/lib/aiLogic"
import { generateSkyline, getAnim, getSafeSpawn, playSound, updatePhysics, useWindowSize } from "@/lib/game-utils"
import { Building, PlayerState } from "@/types/types"
import { useEffect, useRef, useState } from "react"
import RealmScene from "./bg/RealmScene"
import { realms } from "@/lib/realms"
import { GameView } from "./bg/SplitWorld"
import Fighter from "./game/Fighter"
import MobileControls from "./mobile/MobileControls"
import { useSettings } from "@/context/SettingsContext"
import { useRealmStore } from "@/store/realmStore"
import { AnimatePresence, motion } from "framer-motion"
import PauseMenu from "./modals/PauseMenu"
import SettingsPage from "./SettingsPage"
import TrainingHUD from "./game/TrainingHud"
import EnemyIndicators from "./game/EnemyIndicators"
import { Skull, Target, Timer, Trophy } from "lucide-react"



const ENEMY_SPEED = {
    grunt: 240,
    elite: 300,
    boss: 350
}

const SCORE_VALUES = {
    grunt: 100,
    elite: 300,
    boss: 1000
}

const ENEMY_ATTACK_DAMAGE = {
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
const JUMP_FORCE = -850
const MOVE_SPEED = 450
const PLAYER_W = 30
const PLAYER_H = 70

const PLAYER_ATTACK_DAMAGE = {
    kick: 10,
    punch: 8
}
const ENEMY_HP_VISIBLE_TIME = 6000


interface Enemy extends PlayerState {
    id: string
    variant: 'grunt' | 'elite' | 'boss'
    maxHp: number
    lastHitTime: number
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

    const [enemies, setEnemies] = useState<Enemy[]>([])
    const [wave, setWave] = useState(1)

    const [playerHp, setPlayerHp] = useState(100)

    const [score, setScore] = useState(0)
    const [kills, setKills] = useState(0)
    const [isGameOver, setIsGameOver] = useState(false)

    const [respawnTimer, setRespawnTimer] = useState(5)
    const [highScores, setHighScores] = useState<HighScore[]>([])

    const p1 = useRef<PlayerState>({
        x: 200, y: 300, vx: 0, vy: 0, width: PLAYER_W, height: PLAYER_H, isGrounded: false, isDead: false, facingRight: false, realm: 'normal', lastRiftSwitch: 0, hp: 100, isClimbing: false, climbTargetY: null, climbLockX: null, attackAnim: null, attackUntil: 0
    })

    const normalBuildings = useRef<Building[]>([])
    const riftBuildings = useRef<Building[]>([])

    const cameraX = useRef(0)

    const camera = useRef({normal: 0, rift: 0})
    const inputs = useRef({ left: false, right: false, jump: false, kick: false, punch: false })

    useEffect(() => {
        normalBuildings.current = generateSkyline('normal')
        riftBuildings.current = generateSkyline('rift')
        spawnWave(1)
        loadHighScore()

        setP1Realm('normal')
    }, [])

    useEffect(() => {
        let interval: NodeJS.Timeout
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
        const stored = localStorage.getItem('tranining_highscores')
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

        if (p1.current) {
            const spawn = getSafeSpawn(normalBuildings.current, windowHeight)

            p1.current.x = spawn.x
            p1.current.y = spawn.y
            p1.current.vx = 0
            p1.current.vy = 0
            p1.current.hp = 100
            p1.current.isDead = false
            p1.current.isClimbing = false
            p1.current.realm = 'normal'
            setP1Realm('normal')
        }

        spawnWave(1)
    }

    const handlePlayerDeath = () => {
        if (isGameOver) return

        playSound('death')
        p1.current.isDead = true
        setIsGameOver(true)
        setRespawnTimer(5)
        saveHighScore(score)
    }

    const spawnWave = (waveNumber: number) => {
        const count = 2 + Math.floor(waveNumber * 1.5)
        const newEnemies: Enemy[] = []

        const currentBuildingSet = normalBuildings.current

        const validSpawnPoints = currentBuildingSet.filter(b => b.x > 400 && b.width > 50)

        for (let i = 0; i < count; i++) {
            const isBoss = i === count - 1 && waveNumber % 3 === 0
            const isElite = Math.random() > 0.7

            const targetBuilding = validSpawnPoints[i % validSpawnPoints.length] || currentBuildingSet[0]

            const spawnX = targetBuilding.x + (targetBuilding.width / 2) - (PLAYER_W / 2)
            const groundY = windowHeight - targetBuilding.height
            const spawnY = groundY - PLAYER_H

            const maxHp = isBoss ? 500 : (isElite ? 200 : 100)
            newEnemies.push({
                id: `enemy-${waveNumber}-${i}`,
                x: spawnX,
                y: spawnY,
                vx: 0,
                vy: 0,
                width: PLAYER_W,
                height: PLAYER_H,
                isGrounded: false,
                isDead: false, facingRight: false, realm: 'normal', lastRiftSwitch: 0, hp: maxHp, maxHp, lastHitTime: 0, isClimbing: false, climbLockX: null, climbTargetY: null, attackAnim: null, attackUntil: 0,
                variant: isBoss ? 'boss' : (isElite ? 'elite' : 'grunt')
            })


        }
        setEnemies(newEnemies)
    }

    useGameLoop((dt) => {
        if (!p1.current || isPaused) return

        if (p1.current.isDead) return

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
                inputs.current.jump = false
                playSound('jump')
            }
        }

        const now = Date.now()
        if (now > p1.current.attackUntil) {
            if (inputs.current.punch) {
                p1.current.attackUntil = now + 500
                p1.current.attackAnim = 'PUNCH'
                inputs.current.punch = false

                enemies.forEach(e => !e.isDead && e.realm === p1.current.realm && checkAttackHit(p1.current, e, false, 'punch'))
            } else if (inputs.current.kick) {
                p1.current.attackUntil = now + 500
                p1.current.attackAnim = 'LEG_ATTACK_1'
                inputs.current.kick = false
                enemies.forEach(e => !e.isDead && e.realm === p1.current.realm && checkAttackHit(p1.current, e, false, 'kick'))
            }
        }

        const playerBuildings = p1.current.realm === 'normal' ? normalBuildings.current : riftBuildings.current

        updatePhysics(p1.current, dt, playerBuildings, windowHeight)
        cameraX.current = p1.current.x

        setEnemies(prev => {
            const updated = prev.map(enemy => {
                if (enemy.isDead) return enemy

                const botBuildings = enemy.realm === 'normal' ? normalBuildings.current : riftBuildings.current

                const botInputs = calculateBotInputs(enemy, p1.current, botBuildings, dt)

                const now = Date.now()
                enemy.vx = 0

                if (botInputs.rift) {
                    const canRift = now - enemy.lastRiftSwitch > RIFT_COOLDOWN
                    if (canRift) {
                        enemy.lastRiftSwitch = now
                        enemy.realm = enemy.realm === 'normal' ? 'rift' : 'normal'
                        enemy.isClimbing = false
                        playSound('rift')
                    }
                }

                const speed = ENEMY_SPEED[enemy.variant] || 250

                if (botInputs.left) {
                    enemy.vx = -speed
                    enemy.facingRight = false
                }
                if (botInputs.right) {
                    enemy.vx = speed
                    enemy.facingRight = true

                }
                if (botInputs.jump && enemy.isGrounded) {
                    enemy.vy = JUMP_FORCE
                }


                if (now > enemy.attackUntil) {
                    if (enemy.realm === p1.current.realm) {
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

                const currentBotBuildings = enemy.realm === 'normal' ? normalBuildings.current : riftBuildings.current

                updatePhysics(enemy, dt, currentBotBuildings, windowHeight)

                if (enemy.y > windowHeight + 200) enemy.isDead = true
                if (enemy.hp <= 0) enemy.isDead = true

                return { ...enemy }
            })

            return updated
        })

        if (enemies.length > 0 && enemies.every(e => e.isDead)) {
            setWave(w => w + 1)
            spawnWave(wave + 1)
        }

        if ((p1.current.hp <= 0 || p1.current.y > windowHeight + 200) && !p1.current.isDead) {
            handlePlayerDeath()
        }

        if (p1.current.realm === 'normal') {
            camera.current.normal = p1.current.x
        } else {
            camera.current.rift = p1.current.x
        }

    })

    // const respawnPlayer = (p: PlayerState, buildings: Building[], floorY: number) => {
    //     p.isDead = true

    //     setTimeout(() => {
    //         const spawn = getSafeSpawn(buildings, floorY)

    //         p.x = spawn.x
    //         p.y = spawn.y
    //         p.vx = 0
    //         p.vy = 0

    //         p.hp = 100
    //         setPlayerHp(100)
    //         p.isDead = false
    //         p.isClimbing = false
    //         p.isGrounded = false

    //         playSound('rift')
    //     }, RESPAWN_DELAY)
    // }


    const checkAttackHit = (attacker: any, victim: any, isVictimPlayer: boolean, attackType: 'punch' | 'kick') => {
        if (victim.isDead || isGameOver) return

        if (attacker.realm !== victim.realm) return

        const range = 60
        const hitbox = attacker.facingRight ? { x: attacker.x + attacker.width, y: attacker.y, width: range, height: attacker.height } : { x: attacker.x - range, y: attacker.y, width: range, height: attacker.height }

        const victimBox = {
            x: victim.x,
            y: victim.y,
            width: victim.width,
            height: victim.height
        }

        const overlap = hitbox.x < victimBox.x + victimBox.width && hitbox.x + hitbox.width > victimBox.x && hitbox.y < victimBox.y + victimBox.height && hitbox.y + hitbox.height > victimBox.y

        if (!overlap) return

        let damage = 0
        if (isVictimPlayer) {
            const variant = attacker.variant as keyof typeof ENEMY_ATTACK_DAMAGE
            damage = ENEMY_ATTACK_DAMAGE[variant][attackType]
        } else {
            damage = PLAYER_ATTACK_DAMAGE[attackType]
        }

        victim.hp -= damage
        victim.vx = attacker.facingRight ? 300 : -300

        if (victim.hp <= 0) {
            victim.hp = 0
            // victim.isDead = true

            if (isVictimPlayer) {
                handlePlayerDeath()
            } else {
                if (!victim.isDead) {
                    victim.isDead = true
                    const pts = SCORE_VALUES[victim.variant as keyof typeof SCORE_VALUES] || 100
                    setScore(s => s + pts)
                    setKills(k => k + 1)
                }
            }

            return
        }

        if (isVictimPlayer) {
            setPlayerHp(victim.hp)
        } else {
            victim.lastHitTime = Date.now()
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

    const playerForHud = { ...p1.current, hp: playerHp }


    return (
        <div className="flex w-full h-full relative overflow-hidden select-none bg-white">

            <AnimatePresence>
                {isPaused && !showSettings && !isEditingHud && (
                    <PauseMenu onResume={() => setIsPaused(false)} onSettings={() => setShowSettings(true)} onExit={handleExit} isOnline={false} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isGameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-100 bg-black/80 flex items-center justify-center backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-zinc-900 border-2 border-red-900/50 p-8 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden"
                        >
                            {/* <div className="absolute top-0 left-1/3 opacity-5 pointer-events-none">
                                <Skull size={200} className="text-red-500" />
                            </div> */}

                            <h2 className="text-4xl font-custom text-red-500 mb-2 tracking-tighter uppercase text-center drop-shadow-lg">
                                You Died
                            </h2>

                            <div className="flex justify-center mb-3">
                                <div className="text-zinc-400 text-xs font-mono bg-zinc-950/50 px-3 py-1 rounded">
                                    WAVE {wave} REACHED
                                </div>
                            </div>

                            <div className="flex flex-col items-center mb-6">
                                <div className="flex flex-col items-center">
                                    <span className="text-4xl font-bold text-white">{score}</span>
                                    <span className="text-sm text-zinc-500 uppercase font-bold">Total Score</span>
                                </div>
                                <span className="text-xs text-zinc-500 uppercase font-bold">Killed {kills} enemies</span>

                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2 text-yellow-500">
                                    <Trophy size={20} />
                                    <span className="text-sm font-bold uppercase tracking-wider">High Scores</span>
                                </div>
                                <div className="p-3 space-y-1">
                                    {highScores.length > 0 ? highScores.map((hs, idx) => (
                                        <div key={idx} className={`flex justify-between text-sm ${idx === 0 ? 'text-yellow-400 font-bold' : 'text-zinc-400'}`}>
                                            <span>#{idx + 1} - {hs.date}</span>
                                            <span>{hs.score}</span>
                                        </div>
                                    )) : (
                                        <div className="text-zinc-600 text-xs text-center py-2">
                                            No high scores yet
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center pt-4 border-t border-zinc-800">
                                <span className="text-zinc-500 text-xs uppercase font-bold mb-2">Respawing in <span className="text-white">{respawnTimer}</span> seconds...</span>

                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSettings && (
                    <SettingsPage onClose={() => setShowSettings(false)} />
                )}
            </AnimatePresence>

            <div className="relative h-full overflow-hidden transition-all duration-300 border-r border-white/20" style={{ width: p1Realm === 'normal' ? '100%' : '50%' }}>
                <RealmScene realm={realms[0]} cameraOffset={camera.current.normal} />
                <GameView
                    cameraX={camera.current.normal}
                    player={p1.current}
                    otherPlayer={null}
                    buildings={normalBuildings.current}
                    isRift={false}
                    active={true}
                    screenWidthDivider={p1Realm === 'normal' ? 1 : 2}
                    windowWidth={windowWidth}
                    currentRealm='normal'
                >
                    {enemies.filter(e => !e.isDead && e.realm === 'normal').map(enemy => (
                        <EnemyRenderer key={enemy.id} enemy={enemy} cameraX={camera.current.normal} windowWidth={windowWidth} />
                    ))}
                </GameView>
            </div>


            <div className="relative h-full overflow-hidden transition-all duration-300" style={{ width: p1Realm === 'rift' ? '50%' : '0%', opacity: 1 }}>
                <RealmScene realm={realms[1]} cameraOffset={camera.current.rift} />
                <GameView
                    cameraX={camera.current.rift}
                    player={p1.current}
                    otherPlayer={null}
                    buildings={riftBuildings.current}
                    isRift={true}
                    active={true}
                    screenWidthDivider={2}
                    windowWidth={windowWidth}
                    currentRealm='rift'
                >
                    {enemies.filter(e => !e.isDead && e.realm === 'rift').map(enemy => (
                        <EnemyRenderer key={enemy.id} enemy={enemy} cameraX={camera.current.rift} windowWidth={windowWidth} />
                    ))}
                </GameView>
            </div>


            <TrainingHUD wave={wave} enemies={enemies} player={playerForHud} />
            <EnemyIndicators enemies={enemies} player={p1.current} width={windowWidth} height={windowHeight} />

            <MobileControls
                onJump={() => inputs.current.jump = true}
                onLeft={(a) => inputs.current.left = a}
                onRight={(a) => inputs.current.right = a}
                onAttack={(t: string) => {
                    if (t === 'KICK') {
                        inputs.current.kick = true
                    } else {
                        inputs.current.punch = true
                    }
                }}
                onPause={() => setIsPaused(true)}
                onRift={handleRiftSwitch}
            />
        </div>
    )
}


function EnemyRenderer({ enemy, cameraX, windowWidth }: { enemy: Enemy, cameraX: number, windowWidth: number }): React.ReactNode {
    const showHp = Date.now() - enemy.lastHitTime < ENEMY_HP_VISIBLE_TIME

    return (
        <div className="relative">
            {showHp && (
                <div className="absolute z-20" style={{
                    left: enemy.x - (cameraX - windowWidth / 2) + (PLAYER_W / 2) - 20,
                    top: enemy.y - 15,
                    width: '40px',
                    height: '6px'
                }}>
                    <div className="w-full h-full bg-gray-900 border border-black relative">
                        <div className="h-full bg-red-600 transition-all duration-100" style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }} />
                    </div>
                </div>
            )}

            <Fighter
                x={enemy.x - (cameraX - windowWidth / 2)}
                y={enemy.y}
                width={enemy.width}
                height={enemy.height}
                facingRight={enemy.facingRight}
                anim={getAnim(enemy)}
                variant={enemy.variant}
            />
        </div>
    )
}