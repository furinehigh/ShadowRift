import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

const BG_ASSETS = [
  '/bg/far.png',
  '/bg/mid.png',
  '/bg/near.png',
  '/FIGHTER/FIGHTER_tex.png'
]

const FONT_ASSETS = [
  {
    name: 'FightingSpirit',
    url: '/fonts/Fighting-Spirit.ttf',
    weight: 'normal',
    style: 'normal'
  }
]

const SOUND_ASSETS = [
  '/sound/music/fight-bg.mp3',
  '/sound/music/city-drums.mp3',
  '/sound/sfx/climb.mp3',
  '/sound/sfx/damage.mp3',
  '/sound/sfx/death.mp3',
  '/sound/sfx/fall-death.mp3',
  '/sound/sfx/jump.mp3',
  '/sound/sfx/kick.mp3',
  '/sound/sfx/land.mp3',
  '/sound/sfx/panting.mp3',
  '/sound/sfx/punch.mp3',
  '/sound/sfx/rift.mp3',
  '/sound/sfx/run.mp3',
  '/sound/sfx/voice-whoa.mp3',
]

function LoadingScreen({ onComplete }: { onComplete?: () => void }) {
  const [loaded, setLoaded] = useState(0)
  const total = BG_ASSETS.length + FONT_ASSETS.length + SOUND_ASSETS.length

  useEffect(() => {
    let cancelled = false


    const tick = () => {
      if (!cancelled) setLoaded(v => v+1)
    }

    FONT_ASSETS.forEach(font => {
      const f = new FontFace(font.name, `url(${font.url})`, {
        weight: font.weight,
        style: font.style
      })

      f.load()
        .then(loadedFont => {
          document.fonts.add(loadedFont)
          tick()
        })
        .catch(tick)
    })

    BG_ASSETS.forEach(src => {
      const img = new Image()
      img.src = src
      img.onload = tick
      img.onerror = tick
    })


    SOUND_ASSETS.forEach(src => {
      const audio = new Audio()

      const handleLoad = () => {
        tick()
        cleanup()
      }

      const handleError = () => {
        tick()
        cleanup()
      }

      const cleanup = () => {
        audio.removeEventListener('canplaythrough', handleLoad)
        audio.removeEventListener('error', handleError)
      }

      audio.addEventListener('canplaythrough', handleLoad)
      audio.addEventListener('error', handleError)

      audio.preload = 'auto'
      audio.src = src
      audio.load()
    })

    return () => {
      cancelled = true
    }
  }, [])

  const progress = Math.min(100, Math.round((loaded / total) * 100))

  useEffect(() => {
    if (progress === 100 && onComplete) {
      const t = setTimeout(onComplete, 250)

      return () => clearTimeout(t)
    }
  }, [progress, onComplete])

  return (
    <div className='fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f1a]'>
      <div className='relative w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4'>
        <motion.div className='h-full bg-purple-600 shadow-[0_0_10px_#9333ea]' initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
      </div>

      <div className='font-mono text-sm text-purple-200 animate-pulse'>
        {progress < 100 ? `SYNCHRONIZING RIFTS... ${Math.floor(progress)}%` : 'RIFT STABLIZED'}
      </div>

      <div className='absolute inset-0 pointer-events-none opacity-20'>
        <div className='absolute top-1/4 left-1/4 w-32 h-32 bg-purple-900 rounded-full blur-[50px] animate-pulse' />
        <div className='absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-900 rounded-full blur-[60px] animate-pulse' style={{ animationDelay: '1s' }} />
      </div>
    </div>
  )
}

export default LoadingScreen
