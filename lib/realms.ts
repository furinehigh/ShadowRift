import { RealConfig } from "@/types/types";

export const realms: RealConfig[] = [
    {
        id: 'shadow',
        direction: -1,
        baseSpeed: 180,
        tint: 'rgba(30,30,40,0.85)',
        layers: [
            {src: '/shadow/far.png', depth: 0.1},
            {src: '/shadown/mid.png', depth: 0.35},
            {src: '/shadow/near.png', depth: 0.7}
        ]
    },
    {
        id: 'rift',
        direction: 1,
        baseSpeed: 220,
        tint: 'rgba(120,40,20,0.8)',
        layers: [
            {src: '/rift/far.png', depth: 0.15},
            {src: '/rift/mid.png', depth: 0.45},
            {src: '/rift/near.png', depth: 0.85}
        ]
    }
]