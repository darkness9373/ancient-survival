import { world } from "@minecraft/server"
import { PlayerDatabase } from "../extension/Database"
import Tag from "../extension/Tag"
import { getData } from '../config/database'
import { text } from '../config/text'

/* ================= CONFIG ================= */

const ADMIN_SECRET_CODE = 'ancient-admin-26' // GANTI SESUAI MAU KAMU



world.beforeEvents.chatSend.subscribe(data => {
    const player = data.sender
    const msg = data.message
    const prefix = getData(player).chatPrefix
    if (msg.startsWith(prefix)) return;
    data.cancel = true;
    if (msg === ADMIN_SECRET_CODE) {
        if (player.hasTag('admin')) {
            return player.sendMessage(
                text('Kamu sudah menjadi Admin').System.warn
            )
        }
        const used = new PlayerDatabase(player, 'AdminActivated').get()
        if (used) {
            return player.sendMessage(
                text('Kode admin sudah pernah digunakan').System.fail
            )
        }
        Tag.add(player, 'admin')
        new PlayerDatabase(player, 'AdminActivated').set(true)
        return player.sendMessage(
            text('Akses Admin berhasil diaktifkan').System.succ
        )
    }
    const rank = getData(player).rank.get() ?? 'Newbie'
    if (player.hasTag('admin')) {
        world.sendMessage(`§l§e[ADMIN] §r${player.name} §8» §r${msg}`)
        return;
    }
    const color = RANK_COLOR[rank] ?? RANK_COLOR.Default
    world.sendMessage(`§l${color}[${rank.toUpperCase()}] §r${player.name} §8» §r${msg}`)
})




const RANK_COLOR = {
    Default: '§f',
    Rookie: '§n',
    Fighter: '§4',
    Elite: '§2',
    Veteran: '§b',
    Legend: '§6',
    Admin: '§e'
}