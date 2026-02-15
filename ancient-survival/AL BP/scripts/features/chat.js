import { world } from "@minecraft/server"
import { PlayerDatabase, WorldDatabase } from "../extension/Database"
import Tag from "../extension/Tag"
import { text } from '../config/text'
import { RANK_CONFIG, PROGRESS_CONFIG } from '../config/system';

/* ================= CONFIG ================= */

const ADMIN_SECRET_CODE = 'ancient-admin-26' // GANTI SESUAI MAU KAMU



world.beforeEvents.chatSend.subscribe(data => {
    const player = data.sender
    const msg = data.message
    data.cancel = true;
    if (msg === ADMIN_SECRET_CODE) {
        if (player.hasTag('admin')) {
            return player.sendMessage(
                text('Kamu sudah menjadi Admin').System.warn
            )
        }
        Tag.add(player, 'admin')
        return player.sendMessage(
            text('Akses Admin berhasil diaktifkan').System.succ
        )
    }
    const rank = new PlayerDatabase(player, 'Rank').get() ?? undefined
    const progress = new PlayerDatabase(player, 'RankProgress').get() ?? 'Peasant'
    const rankData = RANK_CONFIG[rank]
    const progressData = PROGRESS_CONFIG[progress]
    
    const show = rankData?.prefix ??
        progressData?.prefix ??
        ''
    if (player.hasTag("muted")) {
        return player.sendMessage("§cKamu sedang di-mute")
    }
    if (player.hasTag('admin')) {
        world.sendMessage(`§l§6[ADMIN] §r${player.name}§r §8» §r${msg}`)
        return;
    }
    world.sendMessage(`${show} §r§f${player.name}§r §8» §7${msg}`)
})