import { system, world } from "@minecraft/server";
import Score from "../extension/Score";

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        Score.add(player, 'timePlayed', 1)
    }
}, 20) // 20 tick = 1 detik


export function playtime(sec = 0) {
    const d = Math.floor(sec / 86400)
    sec %= 86400
    
    const h = Math.floor(sec / 3600)
    sec %= 3600
    
    const m = Math.floor(sec / 60)
    const s = sec % 60
    
    if (d > 0) {
        return `${d}d ${h}h ${m}m`
    }
    if (h > 0) {
        return `${h}h ${m}m`
    }
    if (m > 0) {
        return `${m}m`
    }
    return `${s}s`
}

function pad(num) {
    return String(num).padStart(2, '0')
}