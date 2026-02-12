import { world, system } from '@minecraft/server'
import Extra from '../extension/Extra'
import { ActionFormData } from '@minecraft/server-ui'
import { PlayerDatabase } from '../extension/Database'
import OpenUI from '../extension/OpenUI'
import { text } from '../config/text'

world.afterEvents.playerSpawn.subscribe(ev => {
    const player = ev.player
    if (!ev.initialSpawn) return
    system.runTimeout(() => {
        saveLastLocation(player)
        system.runTimeout(() => {
            teleportToLobby(player)
            showCheckpointForm(player)
        }, 10)
    }, 10)
})

function saveLastLocation(player) {
    const db = new PlayerDatabase(player, 'LastLocation')
    const add = {
        x: Math.floor(player.location.x),
        y: Math.floor(player.location.y),
        z: Math.floor(player.location.z),
        dimension: player.dimension.id
    }
    db.set(JSON.stringify(add))
}

function teleportToLobby(player) {
    player.tryTeleport(
    {
        x: LOBBY_POS.x,
        y: LOBBY_POS.y,
        z: LOBBY_POS.z
    },
    {
        dimension: world.getDimension(LOBBY_POS.dimension),
        keepVelocity: false
    })
}

function showCheckpointForm(player) {
    const db = new PlayerDatabase(player, 'LastLocation')
    const lastRaw = db.get() ?? '{}'
    const last = JSON.parse(lastRaw)
    if (!last) return
    
    const form = new ActionFormData()
        .title('Checkpoint')
        .body(
            `Apakah kamu ingin kembali ke koordinat terakhir sebelum offline?\n\n` +
            `Last Coordinate : ${last.x} ${last.y} ${last.z}\n` +
            `Dimension : ${Extra.formatName(last.dimension)}`
        )
        .button('§l§aTeleport')
        .button('§l§cTetap di Lobby')
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled || r.selection === 1) {
            player.sendMessage(
                text('Gunakan §6/checkpoint §6untuk kembali kapan saja.').System.warn
            )
            return
        }
        system.run(() => {
            teleportToCheckpoint(player, last)
        })
    })
}

function teleportToCheckpoint(player, data) {
    try {
        player.tryTeleport({ x: data.x, y: data.y, z: data.z }, { dimension: world.getDimension(data.dimension), keepVelocity: false })
        player.sendMessage(text('Berhasil teleport ke checkpoint!').System.succ)
    } catch {
        player.sendMessage(text('Gagal teleport ke checkpoint.').System.fail)
    }
}


// config/lobby.js
const LOBBY_POS = {
    x: -395,
    y: 71,
    z: -2091,
    dimension: 'overworld'
}

export function checkpointCommand(player) {
    const db = new PlayerDatabase(player, 'LastLocation')
    if (!db.get()) {
        return player.sendMessage(
            text('Checkpoint tidak ditemukan.').System.fail
        )
    }
    showCheckpointForm(player)
}