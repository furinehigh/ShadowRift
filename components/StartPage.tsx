'use client'

import React, { useEffect, useState } from 'react'
import SplitWorld from './bg/SplitWorld'
import { GameState } from '@/types/types'
import { AnimatePresence, motion } from 'framer-motion'
import LoadingScreen from './LoadingScreen'
import RealmScene from './bg/RealmScene'
import { realms } from '@/lib/realms'
import { Play, Settings, ShoppingBag } from 'lucide-react'
import SettingsPage from './SettingsPage'


function StartPage() {
  const [gameState, setGameState] = useState<GameState>('loading')
  const [menuScroll, setMenuScroll] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (gameState !== 'menu') return

    let frameId: number
    const animate = () => {
      setMenuScroll(prev => prev + 1)
      frameId = requestAnimationFrame(animate)
    }
    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [gameState])

  const handlePlay = () => {
    setGameState('playing')
  }

  if (gameState === 'playing') {
    return (
      <div className='w-screen h-screen overflow-hidden'>
        <SplitWorld />

        <button className='fixed top-4 right-4 z-60 text-xs text-white/20 hover:text-white' onClick={() => setGameState('menu')}>
          EXIT
        </button>
      </div>
    )
  }
  return (
    <div className='relative w-screen h-screen overflow-hidden bg-[#0f0f1a] font-mono'>
      <AnimatePresence>
        {gameState === 'loading' && (
          <motion.div
            key='loader'
            exit={{ opacity: 0 }}
            className='absolute inset-0 z-50'
          >
            <LoadingScreen onComplete={() => setGameState('menu')} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className='absolute inset-0 opacity-60'>
        <RealmScene realm={realms[0]} cameraOffset={menuScroll} />
      </div>

      <div className='absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a] to-transparent z-10' />

      {gameState === 'menu' && (
        <div className='relative z-20 w-full h-full flex flex-col items-center justify-between py-12'>
          <div className='w-full flex justify-between px-8'>
            <MenuButton icon={<Settings size={40} />} label='SETTINGS' delay={0.2} onClick={() => setShowSettings(true)} />
            <MenuButton icon={<ShoppingBag size={40} />} label='SHOP' delay={0.3} onClick={() => {}} />
          </div>

          <div className='flex-1 flex flex-col items-center justify-center relative'>
            <motion.div
              initial={{ y: 200, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, type: 'spring' }}
              className='relatvie'
            >
              <h1 className='font-custom text-7xl md:text-9xl text-white tracking-tighter text-shadow-glow text-center leading-tight'>
                SHADOW<br />RIFT
              </h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className='text-purple-400 text-xs tracking-[0.5rem] text-center mt-2 uppercase'
              >
                Dual Realm Combat
              </motion.div>
            </motion.div>

            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ delay: 0.2, type: 'spring' }}
              onClick={handlePlay}
              className='mt-12 group relative px-12 py-4 bg-white text-black font-bold text-xl skew-x-[-10deg] border-2 border-transparent hover:border-purple-500 hover:text-purple-600 tranistion-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]'
            >
              <span className='flex items-center gap-2'>
                <Play fill='currentColor' /> PLAY
              </span>
            </motion.button>

          </div>

          <div className='flex gap-4 md:gap-12 items-end justify-center'>
            <BottomNavButton label='MULTIPLAYER' delay={0.2} />
            <BottomNavButton label='FRIENDS' delay={0.3} />
            <BottomNavButton label='PROFILE' delay={0.2} />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSettings && (
          <SettingsPage onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default StartPage


function MenuButton({ icon, label, delay, onClick }: { icon: React.ReactNode, label: string, delay: number, onClick: () => void }) {
  return (
    <motion.button
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.8, ease: 'easeOut' }}
      whileHover='hover'
      whileTap='tap'
      className='relative group'
      onClick={onClick}
    >
      <div className='absolute inset-0 rounded-xl bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

      <motion.div
        variants={{
          hover: { y: -6, rotateZ: -2 },
          tap: { scale: 0.95 }
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className='relative z-10 flex flex-col items-center gap-2 px-4 py-3'
      >
        <motion.div
          variants={{
            hover: { rotate: 12, scale: 1.1 }
          }}
          animate={{
            y: [0, -4, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay
          }}
          className='relative'
        >
          {icon}
          {/* <span className='absolute left-0 top-0 w-full h-0.5 bg-purple-400 opacity-0 group-hover:opacity-100 animate-pulse' /> */}
        </motion.div>

        <span className='text-xs tracking-[0.35em] text-gray-400 group-hover:text-purple-400 transition-colors'>
          {label}
        </span>

        <span className='absolute -bottom-1 w-6 h-0.5 bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left' />


      </motion.div>

    </motion.button>
  )
}

function BottomNavButton({ label, delay }: { label: string, delay: number }) {
  return (
    <motion.button
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={{ y: -5 }}
      whileTap='tap'
      transition={{ delay, type: 'spring' }}
      className='flex flex-col items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors w-24'
    >

      <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-2' />

      <span className='text-sm font-bold tracking-wider'>{label}</span>
    </motion.button>
  )
}