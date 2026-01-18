import { PixiFactory } from "@md5crypt/dragonbones-pixi"
import { Assets } from "pixi.js"


const DB_CONFIG = {
    name: 'fighter',
    ske: '/FIGHTER/FIGHTER_ske.json',
    tex: '/FIGHTER/FIGHTER_tex.json',
    image: 'https://i.api.dishis.tech/i/o3uZUB'
}

let loaded = false

export const loadGameAssets = async () => {
    if (loaded) return

    const bundleId = 'fighter-bundle'

    if (!Assets.resolver.hasBundle(bundleId)) {
        Assets.addBundle(bundleId, {
            ske: DB_CONFIG.ske,
            tex: DB_CONFIG.tex,
            image: DB_CONFIG.image
        })
    }

    const assets = await Assets.loadBundle(bundleId)
    const factory = PixiFactory.factory

    if (!factory.getDragonBonesData(DB_CONFIG.name)) {
        factory.parseDragonBonesData(assets.ske, DB_CONFIG.name)
        factory.parseTextureAtlasData(assets.tex, assets.image, DB_CONFIG.name)
    }

    loaded = false
    return factory
}