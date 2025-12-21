'use client'

type Props = {
    src: string
    speed: number
    offset: number
}

export default function ParallaxLayer({src, speed, offset}: Props) {
    return (
        <div style={{
            backgroundImage: `url(${src})`,
            backgroundRepeat: `repeat-x`,
            backgroundPosition: `${-offset * speed}px bottom`,
            backgroundSize: 'auto 100%',
            position: 'absolute',
            inset: 0,
            willChange: 'background-position'
        }} />
    )
}