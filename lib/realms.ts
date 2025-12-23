import { RealmConfig } from "@/types/types";

export const realms: RealmConfig[] = [
    {
        id: 'normal',
        direction: -1,
        baseSpeed: 180,
        tint: 'rgba(30,30,40,0.25)',
        layers: [
            {src: './bg/far.png', depth: 0.1},
            {src: './bg/mid.png', depth: 0.35},
            {src: './bg/near.png', depth: 0.7}
        ]
    },
    {
        id: 'rift',
        direction: 1,
        baseSpeed: 220,
        tint: 'rgba(120,40,20,0.8)',
        layers: [
            {src: './bg/far.png', depth: 0.15},
            {src: './bg/mid.png', depth: 0.45},
            {src: './bg/near.png', depth: 0.85}
        ]
    }
]