'use client'

import { useEffect, useRef } from 'react'
import { Application, Assets, Container, Ticker } from 'pixi.js'
import { PixiFactory } from '@md5crypt/dragonbones-pixi'

const CANVAS_SIZE = 400
const SCALE = 0.02

export default function Fighter({ x, y, width, height, facingRight, anim }: { x: number, y: number, width: number, height: number, facingRight: number, anim: string }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)

    const armatureRef = useRef<any>(null)

    const dbConfig = {
        name: 'fighter',
        armatureName: 'Armature',
        ske: '/FIGHTER/FIGHTER_ske.json',
        tex: '/FIGHTER/FIGHTER_tex.json',
        image: '/FIGHTER/FIGHTER_tex.png'
    }

    useEffect(() => {
        let disposed = false

        const init = async () => {
            const app = new Application({
                width: CANVAS_SIZE,
                height: CANVAS_SIZE + 200,
                backgroundAlpha: 0,
                antialias: true
            })

            if (disposed) {
                app.destroy(true)
                return

            }

            if (containerRef.current) {
                containerRef.current.appendChild(app.view as any)

            }

            appRef.current = app

            const bundleId = 'fighter-bundle'

            if (!Assets.cache.has(bundleId)) {
                Assets.addBundle(bundleId, {
                    ske: dbConfig.ske,
                    tex: dbConfig.tex,
                    image: dbConfig.image


                })
            }

            try {
                const assets = await Assets.loadBundle(bundleId)

                if (disposed) return

                const factory = PixiFactory.factory

                if (!factory.getDragonBonesData(dbConfig.name)) {
                    factory.parseDragonBonesData(assets.ske, dbConfig.name)
                    factory.parseTextureAtlasData(assets.tex, assets.image, dbConfig.name)

                }

                const armatureDisplay = factory.buildArmatureDisplay(dbConfig.armatureName)

                if (!armatureDisplay) {
                    console.error(`Failed to build armature "${dbConfig.armatureName}"`)
                    return
                }

                armatureDisplay.x = CANVAS_SIZE / 2
                armatureDisplay.y = CANVAS_SIZE / 1 + (height / 2) + 15

                armatureDisplay.scale.set(SCALE)

                app.stage.addChild(armatureDisplay)
                armatureRef.current = armatureDisplay

                const clock = factory.clock as any

                if (!clock._hooked) {
                    clock._hooked = true
                    Ticker.shared.add((dt) => {
                        clock.advanceTime(dt / 60)
                    })
                }


                armatureDisplay.animation.play('animation0')
            } catch (error) {
                console.error('Error loading Fighter assets: ', error)
            }
        }

        init()


        return () => {
            disposed = true
            armatureRef.current = null
            if (appRef.current) {
                appRef.current.destroy(true)
                appRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        if (!armatureRef.current) return
        const currentScaleX = Math.abs(armatureRef.current.scale.x)
        armatureRef.current.scale.x = facingRight ? currentScaleX : -currentScaleX

    }, [facingRight])

    useEffect(() => {
        if (!armatureRef.current) return

        const armature = armatureRef.current
        const animationName = anim

        if (armature.animation.lastAnimationName === animationName && armature.animation.isPlaying) {
            return
        }

        if (armature.animation.hasAnimation(animationName)) {
            const oneShotAnims = ['JUMP', 'CLIMB', 'PUNCH', 'LEG_ATTACK_1', 'DEATH']

            const attackAnims = ['PUNCH', 'LEG_ATTACK_1']
            const playTimes = oneShotAnims.includes(animationName) ? 1: 0

            const animationState = armature.animation.fadeIn(animationName, 0.1, playTimes)

            if (animationState) {
                if (attackAnims.includes(animationName)) {
                    animationState.timeScale = 1.5
                } else {
                    animationState.timeScale = 1.0
                }
            }
        }

    }, [anim])

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                left: x - (CANVAS_SIZE / 2) + (width / 2),
                top: y - (CANVAS_SIZE * 1.03) + (height / 2),
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                pointerEvents: 'none',
                overflow: 'visible',
                zIndex: 10
            }}
        />
    )
}