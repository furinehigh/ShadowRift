type SountType = 'jump' | 'rift' | 'land' | 'climb' | 'death'

class AudioController {
    private music: HTMLAudioElement | null = null
    private sfxPool: Map<string, HTMLAudioElement[]> = new Map()

    private masterVolume = 0.75
    private musicVolume = 0.6
    private sfxVolume = 0.9
    private muted = false
    private currentTrackPath = ''

    constructor() {
        if (typeof window !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (this.muted) return
                if (document.hidden) {
                    this.suspendContext()
                } else {
                    this.resumeContext()
                }
            })
        }
    }

    updateVolume(master: number, music: number, sfx: number) {
        this.masterVolume = master / 100
        this.musicVolume = music / 100
        this.sfxVolume = sfx / 100

        if (this.music) {
            this.music.volume = this.masterVolume * this.musicVolume
        }
    }

    // setMuteOnBlure(shouldMute: boolean) {

    // }

    private suspendContext() {
        if (this.music) this.music.pause()
    }

    private resumeContext() {
        if (this.music && !this.music.ended) this.music.play().catch(() => {})
    }

    playMusic(filename: string) {
        if (this.currentTrackPath === filename && this.music && !this.music.paused) return

        if (this.music) {
            this.music.pause()
            this.music = null
        }

        this.currentTrackPath = filename
        this.music = new Audio(`/sound/music/${filename}`)
        this.music.loop = true
        this.music.volume = this.masterVolume * this.musicVolume
        this.music.play().catch((e) => console.warn("Audio play failed (user interaction needed)", e))
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
            audio = new Audio(`/sound/sfx/${type}.mp3`)
            pool.push(audio)

            if (pool.length > 5) pool.shift()
        }

        audio.volume = effectiveVolume
        audio.currentTime = 0
        audio.play().catch(() => {})
    }
}

export const audioController = new AudioController()