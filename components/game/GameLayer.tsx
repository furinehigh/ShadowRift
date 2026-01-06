'use client'

import { useEffect, useRef } from 'react'
import { Application, Assets, ColorMatrixFilter, Container, Ticker } from 'pixi.js'
import { PixiFactory } from '@md5crypt/dragonbones-pixi'
import { GameLayerProps, PlayerState } from '@/types/types'
import { loadGameAssets } from '@/lib/assetLoader'
import { getAnim } from '@/lib/game-utils'

const ONE_SHOT_ANIMS = ['JUMPS', 'CLIMB', 'PUNCH', 'LEG_ATTACK_1', 'DEATH']
const FAST_ANIMS = ['PUNCH', 'LEG_ATTACK_1', 'RUN']

export default function GameLayer({ width, height, cameraX, player, enemies, realm }: GameLayerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)
    const factoryRef = useRef<any>(null)


    const armatureRef = useRef<Map<string, any>>(new Map())
    const stageContainerRef = useRef<Container | null>(null)


    useEffect(() => {
        let disposed = false

        const init = async () => {
            await loadGameAssets()
            if (disposed) return

            factoryRef.current = PixiFactory.factory

            const app = new Application({
                width,
                height,
                backgroundAlpha: 0,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            })
            appRef.current = app

            const worldContainer = new Container()
            stageContainerRef.current = worldContainer
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

        }

        init()


        return () => {
            disposed = true
            armatureRef.current.forEach(arm => arm.dispose())
            armatureRef.current.clear()
            if (appRef.current) {
                appRef.current.destroy(true, {children: true, texture: false})
            }
        }
    }, [])

    useEffect(() => {
        if (appRef.current) {
            appRef.current.renderer.resize(width, height)
        }
    }, [width, height])

    useEffect(() => {
        if (!armatureRef.current || !stageContainerRef.current || !factoryRef.current) return

        const world = stageContainerRef.current

        const offset = cameraX - (width / 2)
        world.position.set(-offset, 0)

        const updateFighter = (id: string, entity: PlayerState | any, isEnemy: boolean) => {
            let armature = armatureRef.current.get(id)

            if (!armature) {
                armature = factoryRef.current.buildArmatureDisplay('Armature')
                armature.scale.set(0.02)
                world.addChild(armature)
                armatureRef.current.set(id, armature)

                if (isEnemy) {
                    const variant = entity.variant
                    if (variant === 'grunt') armature.tint = 0xFF7777
                    else if (variant === 'elite') armature.tint = 0xFFD700
                    else if (variant === 'boss') {
                        armature.tint = 0xAA20FF
                        const filter = new ColorMatrixFilter()
                        filter.brightness(1.1, false)
                        armature.filters = [filter]
                    }
                }
            }

            armature.visible = true

            armature.x = entity.x + (entity.width / 2)
            armature.y = entity.y + entity.height

            const absScale = Math.abs(armature.scale.x)
            armature.scale.x = entity.facingRight ? absScale : -absScale

            const animName = getAnim(entity)
            if (armature.animation.lastAnimationName === animName && armature.animation.isPlaying) {
                return

            }

            if (animName === 'DEATH' && armature.animation.lastAnimationName === 'DEATH' && armature.animation.isCompleted) {
                return
            }

            if (armature.animation.hasAnimation(animName)) {
                const playTimes = ONE_SHOT_ANIMS.includes(animName) ? 1: 0

                const animationState = armature.animation.fadeIn(animName, 0.1, playTimes)

                if (animationState) {
                    if (FAST_ANIMS.includes(animName)) {
                        animationState.timeScale = 1.5
                    } else if (animName === 'DEATH') {
                        animationState.timeScale = 1.0

                        animationState.resetToPose = false
                    } else {
                        animationState.timeScale = 1.0
                    }
                }
            }
        }

        if (player.realm === realm) {
            updateFighter('player', player, false)

        } else {
            const p = armatureRef.current.get('player')
            if (p) p.visible = false
        }

        const activeIds = new Set<string>()
        if (player.realm === realm) activeIds.add('player')

        enemies.forEach(enemy => {
            if (enemy.isDead || enemy.realm !== realm) return

            updateFighter(enemy.id, enemy, true)
            activeIds.add(enemy.id)
        })

        armatureRef.current.forEach((armature, id) => {
            if (!activeIds.has(id)) {
                world.removeChild(armature)
                armature.dispose()
                armatureRef.current.delete(id)
            }
        })

    }, [cameraX, player, enemies, realm, width])

    return (
        <div
            ref={containerRef}
            className='absolute inset-0 pointer-events-none'
        />
    )
}