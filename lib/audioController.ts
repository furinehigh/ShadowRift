

export type SountType = 'jump' | 'rift' | 'land' | 'climb' | 'death' | 'punch' | 'kick' | 'damage' | 'fall-death'

export type LoopType = 'run' | 'walk'

class AudioController {
    private music: HTMLAudioElement | null = null
    private sfxPool: Map<string, HTMLAudioElement[]> = new Map()
    private activeLoops: Map<string, HTMLAudioElement> = new Map()

    private masterVolume = 0.75
    private musicVolume = 0.6
    private sfxVolume = 0.9
    private muted = false
    private currentTrackPath = ''

    private initialized = false

    constructor() {
        if (typeof window !== 'undefined') {
            const unlock = () => {
                this.initialized = true
                document.removeEventListener('click', unlock)
                document.removeEventListener('keydown', unlock)
            }
            document.addEventListener('click', unlock)
            document.addEventListener('keydown', unlock)

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.suspendContext()
                } else {
                    this.resumeContext()
                }
            })
        }
    }

    updateVolumeSettings(master: number, music: number, sfx: number, muteOnBlur: boolean) {
        this.masterVolume = master / 100
        this.musicVolume = music / 100
        this.sfxVolume = sfx / 100
        this.muted = muteOnBlur

        if (this.music) {
            this.music.volume = this.masterVolume * this.musicVolume
        }
    }

    // setMuteOnBlure(shouldMute: boolean) {

    // }

    private suspendContext() {
        if (this.music) this.music.pause()
        this.activeLoops.forEach(audio => audio.pause())
    }

    private resumeContext() {
        if (this.music && !this.music.ended) this.music.play().catch(() => {})
    }

    playMusic(filename: string) {
        if (!this.initialized) {
            const wait = () => {
                this.playMusic(filename)
                document.removeEventListener('click', wait)

            }
            
            document.addEventListener('click', wait)
            return
        }

        if (this.currentTrackPath === filename && this.music && !this.music.paused) return

        this.stopMusic()

        this.currentTrackPath = filename
        this.music = new Audio(`/sound/music/${filename}`)
        this.music.loop = true
        this.music.volume = this.masterVolume * this.musicVolume
        this.music.play().catch((e) => console.warn("Music play failed", e))
    } 

    stopMusic() {
        if (this.music) {
            this.music.pause()
            this.music.currentTime = 0
            this.music = null
        }
    }

    playSFX(type: SountType) {
        const effectiveVolume = this.masterVolume * this.sfxVolume
        if (effectiveVolume <= 0) return

        let pool = this.sfxPool.get(type)
        if (!pool) {
            pool = []

            this.sfxPool.set(type, pool)
        }

        let audio = pool.find(a => a.ended || a.paused)
        if (!audio) {
            if (pool.length >= 5) return
            audio = new Audio(`/sound/sfx/${type}.mp3`)
            pool.push(audio)
        }

        audio.volume = effectiveVolume
        audio.currentTime = 0
        audio.play().catch(() => {})
    }


    startLoop(type: LoopType) {
        if (this.activeLoops.has(type)) return    

        const effectiveVolume = this.masterVolume * this.sfxVolume
        if (effectiveVolume <= 0) return

        const audio = new Audio(`/sound/sfx/${type}.mp3`)
        audio.loop = true
        audio.volume = effectiveVolume
        
        audio.play().catch(() => {})


        this.activeLoops.set(type, audio)

    }

    stopLoop(type: LoopType) {
        const audio = this.activeLoops.get(type)

        if (audio) {
            audio.pause()
            audio.currentTime = 0
            this.activeLoops.delete(type)
        }
    }

    stopAllLoops() {
        this.activeLoops.forEach((audio, key) => {
            audio.pause()
            this.activeLoops.delete(key)
        })
    }
}

export const audioController = new AudioController()