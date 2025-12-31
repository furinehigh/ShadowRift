import { BotInputs, Building, PlayerState } from "@/types/types"


const SIGHT_RANGE = 800
const ATTACK_RANGE = 40

export const calculateBotInputs = (
    me: PlayerState,
    target: PlayerState,
    buildings: Building[],
    dt: number
): BotInputs => {
    const inputs: BotInputs = {left: false, right: false, jump: false, punch: false, kick: false}

    if (me.isDead || target.isDead) return inputs

    // slow downnn
    if (me.attackUntil && Date.now() < me.attackUntil) {
        return inputs
    }

    const dx = target.x - me.x
    const dy = target.y - me.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > SIGHT_RANGE) return inputs

    if (Math.abs(dx) < ATTACK_RANGE && Math.abs(dy) < 50) {
        if (me.isGrounded) {

            if (Math.random() > 0.99) inputs.punch = true
            else if (Math.random() > 0.99) inputs.kick = true
            
        }
        if (dx > 10 && !me.facingRight) inputs.right = true
        if (dx < -10 && me.facingRight) inputs.left = true

        return inputs
    }

    // const isStuck = me.vx === 0 && !me.isGrounded && !me.isClimbing

    if (dx > 30) {
        inputs.right = true

    } else if (dx < -30) {
        inputs.left = true
    }

    // env awareness (jump/climb)
    const lookAheadX = me.facingRight ? me.x + me.width + 20 : me.x - 20

    const wallAhead = buildings.some(b => lookAheadX > b.x && lookAheadX < b.x + b.width && me.y + me.height > window.innerHeight - b.height)


    const floorY = window.innerHeight

    const platformAhead = buildings.some(b => {
        const top = floorY - b.height

        const withinX = lookAheadX > b.x && lookAheadX < b.x + b.width

        const nearSameHeight = Math.abs((me.y + me.height) - top) < 25

        return withinX && nearSameHeight
    })

    if (me.isGrounded) {
        if (!platformAhead) {
            inputs.jump = true
            
        }
        else if (wallAhead && dy > 50) {
            inputs.jump = true

        }
        else if (Math.random() > 0.995) {
            inputs.jump = true
        }
    }

    if (me.isClimbing) {
        if (dy < 0) {
            // as climbing is automatic for all :)
        }

        if (dy > 100) {
            inputs.jump = true
        }
    }

    return inputs
}