import { AlertTriangle, ChevronDown, Skull } from "lucide-react"

export default function EnemyIndicators({enemiesRef, player, width, height}: any) {
    const offScreenEnemies = enemiesRef.current.filter((e: any) => !e.isDead && !e.isDying && Math.abs(e.x - player.x) > width / 2)

    return (
        <div>

            <div className={`absolute left-1/2 ${player.facingRight ? '-translate-x-1' : 'translate-x-full'} transition-opacity duration-300 flex flex-col items-center $`} style={{top: Math.max(20, player.y - 30)}}>
                <div className="flex flex-col items-center animate-bounce">
                    <span className="text-[10px] font-black text-shadow-purple-400 tracking-widest uppercase -mb-1 shadow-black drop-shadow-md">
                        P1
                    </span>
                    <ChevronDown size={12} className="text-purple-400 fill-purple-400/50 " strokeWidth={3} />
                </div>
            </div>
            {offScreenEnemies.map((e: any) => {
                const isRight = e.x > player.x
                const dx = Math.abs(e.x - player.x)

                if (dx > 3000) return null

                return (
                    <div className={`absolute top-1/2 flex items-center gap-2 transition-all duration-300 ${isRight ? 'right-4 flex-row' : 'left-4 flex-row-reverse'}`} key={e.id} style={{marginTop: (e.y - player.y) * 0.5}}>
                        <div className={`p-2 rounded-full border-2 ${e.variant === 'boss' ? 'bg-purple-900 border-purple-500' : 'bg-gray-900 border-gray-500'} animate-pulse`}>
                            {e.variant === 'boss' ? <AlertTriangle size={20} className="text-white" /> : <Skull size={16} className="text-white" />}
                        </div>
                        <div className="bg-black-80 px-2 py-1 rounded text-[10px] text-white font-mono border border-white/20">
                            {Math.floor(dx / 10)}m
                        </div>
                    </div>
                )
            })}
        </div>
    )
}