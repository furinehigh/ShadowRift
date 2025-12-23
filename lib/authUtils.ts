const ADJECTIVES = ['Shadow', 'Rift', 'Void', 'Neon', 'Cyber', 'Dark', 'Lunar', 'Solar', 'Glitch', 'Prime']
const NOUNS = ['Walker', 'Runner', 'Blade', 'Zero', 'Ghost', 'Spectre', 'Knight', 'Ninja', 'Samurai', 'Viper']


export const generateRandomUsername = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    const num = Math.floor(Math.random() * 999)

    return `${adj}${noun}${num}`
}

export const validateAge = (dobString: string): boolean => {
    if (!dobString) return false

    const today = new Date()

    const birthDate = new Date(dobString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m<0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }

    return age >= 12
}

export const createGuestSession = (username: string) => {
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulated_${btoa(username)}.${Date.now()}`

    document.cookie = `token=${token}; path=/; max-age=31536000; SameSite=Strict`

    if (typeof window !== 'undefined') {
        localStorage.setItem('shadow_rift_token', token)
        localStorage.setItem('shadow_rift_user', username)


    }

    return token
}

export const checkExistingSession = (): boolean => {
    if (typeof window === 'undefined') return false

    const hasCookie = document.cookie.includes('token=')

    const hasLocal = !!localStorage.getItem('shadow_rift_token')

    return hasCookie || hasLocal
}