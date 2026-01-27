'use client'

import { useEffect, useRef } from 'react'
import { Application, Assets, ColorMatrixFilter, Container, Ticker } from 'pixi.js'
import { PixiFactory } from '@md5crypt/dragonbones-pixi'
import { GameLayerProps, PlayerState } from '@/types/types'
import { loadGameAssets } from '@/lib/assetLoader'
import { applyVariantStyle, getAnim } from '@/lib/game-utils'

const ONE_SHOT_ANIMS = ['JUMPS', 'CLIMB', 'PUNCH', 'LEG_ATTACK_1', 'DEATH', 'BACKWARD_DODGE_ROLL']
const FAST_ANIMS = ['PUNCH', 'LEG_ATTACK_1', 'RUN', 'BACKWARD_DODGE_ROLL']

const DEATH_FADE_SPEED = 0.02

const markCleanup = (armature: any) => {
    armature.__cleanup = true
}

class ArmaturePool {
    private pool: any[] = []
    private factory: any

    constructor(factory: any) {
        this.factory = factory
    }

    get(): any {
        if (this.pool.length > 0) {
            const armature = this.pool.pop()
            armature.visible = true
            armature.alpha = 1
            armature.__cleanup = false
            return armature
        }

        const armature = this.factory.buildArmatureDisplay('Armature')
        armature.scale.set(0.02)
        armature.__cleanup = false
        return armature
    }

    return(armature: any) {
        armature.visible = false
        armature.filters = null
        armature.animation.stop()
        armature.__cleanup = false
        this.pool.push(armature)
    }
}


export default function GameLayer({ width, height, cameraRef, playerRef, enemiesRef, realm }: GameLayerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)
    const factoryRef = useRef<any>(null)

    const gameStateRef = useRef({ playerRef, enemiesRef, cameraRef, realm, width })

    const activeArmatures = useRef<Map<string, any>>(new Map())
    const poolRef = useRef<ArmaturePool | null>(null)

    useEffect(() => {
        gameStateRef.current = { playerRef, enemiesRef, cameraRef, realm, width }
    }, [playerRef, enemiesRef, cameraRef, realm, width])

    useEffect(() => {
        if (appRef.current) {
            appRef.current.renderer.resize(width, height)
        }
    }, [width, height])


    useEffect(() => {
        let disposed = false

        const init = async () => {
            await loadGameAssets()
            if (disposed) return

            factoryRef.current = PixiFactory.factory
            poolRef.current = new ArmaturePool(factoryRef.current)

            const app = new Application({
                width,
                height,
                backgroundAlpha: 0,
                antialias: false,
                resolution: Math.min(window.devicePixelRatio, 2),
                autoDensity: true
            })
            appRef.current = app

            const worldContainer = new Container()
            app.stage.addChild(worldContainer)

            if (containerRef.current) {
                containerRef.current.appendChild(app.view as any)

            }

            const clock = PixiFactory.factory.clock as any

            if (!clock._hooked) {
                clock._hooked = true
                Ticker.shared.add((dt) => {
                    clock.advanceTime(dt / 60)
                })
            }


            const validIds = new Set<string>()

            const renderEntity = (id: string, entity: any, isEnemy: boolean) => {
                validIds.add(id)

                const armatures = activeArmatures.current
                const pool = poolRef.current!
                let armature = armatures.get(id)

                if (!armature) {
                    armature = pool.get()
                    worldContainer.addChild(armature)
                    armatures.set(id, armature)

                    if (isEnemy) {
                        applyVariantStyle(armature, entity.variant)
                    } else {
                        applyVariantStyle(armature)
                    }
                }

                armature.x = entity.x + (entity.width / 2)
                armature.y = entity.y + entity.height

                const baseScale = 0.02
                let scale = baseScale

                if (isEnemy && entity.variant === 'boss') scale = baseScale * 1.15
                const sign = entity.facingRight ? 1 : -1
                
                armature.scale.set(scale * sign, scale)

                const animName = getAnim(entity)

                if (entity.isDead || entity.isDying || getAnim(entity) === 'DEATH') {
                    const animName = 'DEATH'

                    if (armature.animation.lastAnimationName !== animName) {
                        const state = armature.animation.fadeIn(animName, 0.1, 1)

                        if (state) state.resetToPose = false
                    }

                    if (armature.animation.isCompleted) {
                        armature.alpha -= DEATH_FADE_SPEED

                        if (armature.alpha <= 0) {
                            armature.alpha = 0
                            armature.visible = false
                            armature.__cleanup = true

                            if (isEnemy) entity.fadeDone = true
                        }
                    }

                    return
                }
                armature.alpha = 1
                armature.visible = true
                armature.__cleanup = false

                const currentAnim = armature.animation.lastAnimationName
                const isPlaying = armature.animation.isPlaying
                const isCompleted = armature.animation.isCompleted

                if (currentAnim !== animName || (!isPlaying && !isCompleted)) {
                    if (armature.animation.hasAnimation(animName)) {
                        const playTimes = ONE_SHOT_ANIMS.includes(animName) ? 1 : 0
                        const state = armature.animation.fadeIn(animName, 0.1, playTimes)

                        if (state) {
                            if (animName === 'BACKWARD_DODGE_ROLL') {
                                state.timeScale = 5.0
                            } else if (FAST_ANIMS.includes(animName)) {
                                state.timeScale = 1.5
                            }
                            else {
                                state.timeScale = 1.0
                            }

                            if (animName === 'DEATH') state.resetToPose = false
                        }
                    }
                }
            }

            app.ticker.add(() => {
                const { playerRef, enemiesRef, cameraRef, realm, width } = gameStateRef.current

                const enemies = enemiesRef.current
                const player = playerRef.current

                const camX = realm === 'normal' ? cameraRef.current.normal : cameraRef.current.rift

                const offset = camX - (width / 2)
                worldContainer.position.set(-offset, 0)

                validIds.clear()


                if (player.realm === realm) {
                    renderEntity('player', player, false)
                }

                for (let i = 0; i < enemies.length; i++) {
                    const enemy = enemies[i];
                    if (enemy.realm !== realm) continue
                    renderEntity(enemy.id, enemy, true)
                }

                const armatures = activeArmatures.current
                const pool = poolRef.current
                if (!pool) return
                for (const [id, armature] of armatures.entries()) {
                    const shouldRemove = !validIds.has(id) || armature.__cleanup === true
                    if (!shouldRemove) continue
                    
                    worldContainer.removeChild(armature)
                    pool.return(armature)
                    armatures.delete(id)
                }
            })

        }

        init()


        return () => {
            disposed = true
            if (appRef.current) {
                appRef.current.destroy(true, { children: true, texture: false })
                appRef.current = null
            }
            activeArmatures.current.clear()
        }
    }, [])


    return (
        <div
            ref={containerRef}
            className='absolute inset-0 pointer-events-none'
        />
    )
}