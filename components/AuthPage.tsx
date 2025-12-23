'use client'

import { createGuestSession, generateRandomUsername, validateAge } from "@/lib/authUtils"
import { AnimatePresence, motion } from "framer-motion"
import { Calendar, Dice5, Lock, User } from "lucide-react"
import React, { useState } from "react"


type AuthMode = 'register' | 'login'

export default function AuthPage({ onAuthComplete }: { onAuthComplete: () => void }) {
    const [mode, setMode] = useState<AuthMode>('register')

    const [username, setUsername] = useState('')
    const [dob, setDob] = useState('')
    const [loginId, setLoginId] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    const [loading, setLoading] = useState(false)

    const handleRandomize = () => {
        setUsername(generateRandomUsername())
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        setError(null)

        if (!username.trim()) {
            setError('Username is required.')
            return

        }

        if (!validateAge(dob)) {
            setError('Access Denied: This game requires age 12+')
            return
        }

        setLoading(true)

        createGuestSession(username)
        setLoading(false)
        onAuthComplete()
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)

        // will auth using api in future

        if (loginId && password) {
            createGuestSession(loginId)
            setLoading(false)
            onAuthComplete()
        } else {
            setLoading(false)
            setError('Invalid Credentials')
        }


    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md bg-[#0f0f1a]/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl"
            >
                <div className="flex border-b border-white/5">
                    <button className={`flex-1 py-4 text-xs font-mono font-bold tracking-widest transition-colors ${mode === 'login' ? 'bg-purple-900/20 text-white border-b-2 border-purple-500' : `text-gray-500 hover:text-gray-300`}`}>
                        NEW IDENTITY
                    </button>

                    <button className={`flex-1 py-4 text-xs font-mono font-bold tracking-widest transition-colors ${mode === 'login' ? 'bg-purple-900/20 text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}>
                        LINK ACCESS
                    </button>
                </div>


                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {mode === 'register' ? (
                            <motion.form
                                key='register'
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                onSubmit={handleRegister}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label htmlFor="" className="text-xs text-purple-300 font-mono tracking-wider">CODENAME</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1 group">
                                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter alias..." className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-all font-mono" maxLength={15} />

                                        </div>
                                        <button type="button" onClick={handleRandomize} className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-purple-400 text-gray-400 transition-colors" title="Randomize">
                                            <Dice5 size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="" className="text-xs text-purple-300 font-mono tracking-wider">DATE OF BIRTH</label>
                                    <div className="relative group">
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />

                                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-all font-mono" />
                                    </div>
                                    <p className="text-[10px] text-gray-600 font-mono text-right">RESTRICTED: 12+</p>
                                </div>


                            </motion.form>
                        ) : (
                            <motion.form>
                                <div className="space-y-2">
                                    <label htmlFor="" className="text-xs text-purple-300 font-mono tracking-wider">USERNAME / EMAIL</label>

                                    <div className="relative group">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />

                                        <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-all font-mono" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="" className="text-xs text-purple-300 font-mono tracking-wider">PASSPHRASE</label>

                                    <div className="relative group">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />

                                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full " />

                                    </div>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

        </div>
    )
}