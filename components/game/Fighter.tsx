'use client'

import { useEffect, useRef } from 'react'
import { Application, Assets, Container, Ticker } from 'pixi.js'
import { PixiFactory } from '@md5crypt/dragonbones-pixi'


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
                width,
                height,
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

                armatureDisplay.x = width / 2
                armatureDisplay.y = height

                armatureDisplay.scale.set(0.02)

                app.stage.addChild(armatureDisplay)
                armatureRef.current = armatureDisplay

                const clock = factory.clock as any

                if (!clock._hooked) {
                    clock._hooked = true
                    Ticker.shared.add((dt) => {
                        clock.advanceTime(dt / 60)
                    })
                }


                if (armatureDisplay.animation.hasAnimation(anim)) {
                    armatureDisplay.animation.play(anim)
                } else {
                    armatureDisplay.animation.play(armatureDisplay.animation.animationNames[0])
                }
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
    }, [width, height])

    useEffect(() => {
        if (!armatureRef.current) return
        const currentScaleX = Math.abs(armatureRef.current.scale.x)
        armatureRef.current.scale.x = facingRight ? currentScaleX : -currentScaleX

    }, [facingRight])

    useEffect(() => {
        if (!armatureRef.current) return

        const armature = armatureRef.current

        if (armature.animation.hasAnimation(anim)) {
            armature.animation.fadeIn(anim, 0.1)
        }

    }, [anim])

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width,
                height,
                pointerEvents: 'none',
                overflow: 'visible'
            }}
        />
    )
}