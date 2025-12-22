import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

function LoadingScreen({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          if (onComplete) setTimeout(onComplete, 200)
          return 100
        }
        return prev + Math.random() * 10
      })
    }, 150)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className='fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f1a]'>
      <div className='relative w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4'>
        <motion.div className='h-full bg-purple-600 shadow-[0_0_10px_#9333ea]' initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
      </div>

      <div className='font-mono text-sm text-purple-200 animate-pulse'>
        {progress < 100 ? `SYNCHRONIZING RIFTS... ${Math.floor(progress)}%` : 'READY'}
      </div>

      <div className='absolute inset-0 pointer-events-none opacity-20'>
        <div className='absolute top-1/4 left-1/4 w-32 h-32 bg-purple-900 rounded-full blur-[50px] animate-pulse' />
        <div className='absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-900 rounded-full blur-[60px] animate-pulse' style={{ animationDelay: '1s' }} />
      </div>
    </div>
  )
}

export default LoadingScreen
