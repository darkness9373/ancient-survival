import { world, Player, system } from "@minecraft/server";
import { WorldDatabase, PlayerDatabase } from "../extension/Database";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import OpenUI from "../extension/OpenUI";
import { getData } from "../config/database";
import { text } from '../config/text';
import { RANK_CONFIG } from "../config/system";

/**
 * @typedef {import("@minecraft/server").Vector3} Vector3
 */


/* ===========================
   MAIN UI
=========================== */

export function warpUI(player) {
    const warp = new ActionFormData()
    const actions = []
    
    warp.title('Warp Menu')
    warp.body('')
    
    /* ===== GLOBAL WARP ===== */
    const globalData = getData(player).warpGlobal
    const globalList = JSON.parse(globalData.get() ?? '[]')
    
    for (const g of globalList) {
        warp.button(`§l§b${g.name}§r\n${g.pos.x} ${g.pos.y} ${g.pos.z}`)
        actions.push(() => runTeleport(player, g.name, g.dimension, g.pos))
    }
    
    if (player.hasTag('admin')) {
        warp.button('§l§a+ Add Global Warp +')
        actions.push(() => globalAddWarp(player))
        
        if (globalList.length > 0) {
            warp.button('§l§c- Remove Global Warp -')
            actions.push(() => globalRemoveWarp(player))
        }
    }
    
    /* ===== SEPARATOR ===== */
    warp.divider()
    
    /* ===== PRIVATE WARP ===== */
    const privateData = new PlayerDatabase(player, 'Warp')
    const privateList = JSON.parse(privateData.get() ?? '[]')
    const rankName = new PlayerDatabase(player, 'Rank').get() ?? 'Member'
    const rankData = RANK_CONFIG[rankName] ?? RANK_CONFIG.Member
    
    let limit = rankData.warpLimit ?? 1
    
    // ADMIN = UNLIMITED
    if (player.hasTag('admin')) {
        limit = Infinity
    }
    const db = new PlayerDatabase(player, 'Warp')
    const list = JSON.parse(db.get() ?? '[]')
    warp.label(
        player.hasTag('admin') ?
        `${list.length}/Unlimited` :
        `${list.length}/${limit}`
    )
    for (const p of privateList) {
        warp.button(`§l§e${p.name}\n§r${p.pos.x} ${p.pos.y} ${p.pos.z}`)
        actions.push(() => runTeleport(player, p.name, p.dimension, p.pos))
    }
    
    warp.button('§l§a+ Add Warp +')
    actions.push(() => privateAddWarp(player))
    
    if (privateList.length > 0) {
        warp.button('§l§c- Remove Warp -')
        actions.push(() => privateRemoveWarp(player))
    }
    
    OpenUI.force(player, warp).then(r => {
        if (r.canceled) return
        actions[r.selection]?.()
    })
}

function privateAddWarp(player) {
    const rankName = new PlayerDatabase(player, 'Rank').get() ?? 'Member'
    const rankData = RANK_CONFIG[rankName] ?? RANK_CONFIG.Member
    
    let limit = rankData.warpLimit ?? 1
    
    // ADMIN = UNLIMITED
    if (player.hasTag('admin')) {
        limit = Infinity
    }
    const db = new PlayerDatabase(player, 'Warp')
    const list = JSON.parse(db.get() ?? '[]')
    
    if (list.length >= limit) return warpLimit(player)
    
    const form = new ModalFormData()
        .title('Add Private Warp')
        .textField('Warp Name', 'House')
        .toggle('Gunakan lokasi player', { defaultValue: true })
        .textField('Input Coordinate (x y z)', '100 64 -200')
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled) return
        
        const [name, usePlayerPos, input] = r.formValues
        if (!name) return player.sendMessage(text('Nama tidak boleh kosong!').System.fail)
        
        if (list.some(w => w.name === name)) {
            return player.sendMessage(
                text('Nama warp sudah digunakan').System.fail
            )
        }
        
        let pos
        if (usePlayerPos) {
            pos = {
                x: Math.floor(player.location.x),
                y: Math.floor(player.location.y),
                z: Math.floor(player.location.z)
            }
        } else {
            pos = parseVector3(input)
            if (!pos) {
                return player.sendMessage(
                    text('Format koordinat tidak valid').System.fail
                )
            }
        }
        
        list.push({
            name,
            pos,
            dimension: player.dimension.id
        })
        
        db.set(JSON.stringify(list))
        player.sendMessage(
            text(`Warp berhasil ditambahkan\n    > Nama : §e${name}\n    §a> Koordinat : §e${pos.x} ${pos.y} ${pos.z}`).System.succ
        )
    })
}

function privateRemoveWarp(player) {
    const db = new PlayerDatabase(player, 'Warp')
    const list = JSON.parse(db.get() ?? '[]')
    
    const form = new ActionFormData()
        .title('Remove Private Warp')
        .body('Pilih warp yang ingin dihapus')
    
    const actions = []
    
    for (const w of list) {
        form.button(`${w.name}\n${w.pos.x} ${w.pos.y} ${w.pos.z}`)
        actions.push(() => {
            const index = list.findIndex(x => x.name === w.name)
            if (index === -1) return
            
            list.splice(index, 1)
            db.set(JSON.stringify(list))
            player.sendMessage(
                text(`Warp §6${w.name} §aberhasil dihapus`).System.succ
            )
        })
    }
    
    form.button('Close')
    actions.push(() => {})
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled) return
        actions[r.selection]?.()
    })
}

function globalAddWarp(player) {
    const form = new ModalFormData()
        .title('Add Global Warp')
        .textField('Warp Name', 'Lobby')
        .toggle('Gunakan lokasi player', { defaultValue: true })
        .textField('Input Coordinate (x y z)', '0 100 0')
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled) return
        
        const [name, usePlayerPos, input] = r.formValues
        const globalData = getData(player).warpGlobal
        const list = JSON.parse(globalData.get() ?? '[]')
        
        if (list.some(w => w.name === name)) {
            return player.sendMessage(
                text('Nama warp sudah ada').System.fail
            )
        }
        
        let pos
        if (usePlayerPos) {
            pos = {
                x: Math.floor(player.location.x),
                y: Math.floor(player.location.y),
                z: Math.floor(player.location.z)
            }
        } else {
            pos = parseVector3(input)
            if (!pos) {
                return player.sendMessage(
                    text('Koordinat tidak valid').System.fail
                )
            }
        }
        
        list.push({
            name,
            pos,
            dimension: player.dimension.id
        })
        
        globalData.set(JSON.stringify(list))
        player.sendMessage(
            text(`Global warp §g${name} §aberhasil ditambahkan`).System.succ
        )
    })
}

function globalRemoveWarp(player) {
    const globalData = getData(player).warpGlobal
    const list = JSON.parse(globalData.get() ?? '[]')
    
    const form = new ActionFormData()
        .title('Remove Global Warp')
        .body('Pilih warp yang ingin dihapus')
    
    const actions = []
    
    for (const w of list) {
        form.button(`${w.name}\n${w.pos.x} ${w.pos.y} ${w.pos.z}`)
        actions.push(() => {
            const index = list.findIndex(x => x.name === w.name)
            if (index === -1) return
            
            list.splice(index, 1)
            globalData.set(JSON.stringify(list))
            player.sendMessage(
                text(`Global warp §g${w.name} §aberhasil dihapus`).System.succ
            )
        })
    }
    
    form.button('Close')
    actions.push(() => {})
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled) return
        actions[r.selection]?.()
    })
}

function runTeleport(player, name, dim, pos) {
    let dimension
    try {
        dimension = world.getDimension(dim)
    } catch {
        return player.sendMessage(
            text('Dimension tidak valid').System.fail
        )
    }
    
    try {
        player.tryTeleport(pos, { dimension })
        player.sendMessage(
            text(`Teleport ke §6${name} §aberhasil`).System.succ
        )
    } catch {
        player.sendMessage(
            text('Gagal melakukan teleport').System.fail
        )
    }
}

function warpLimit(player) {
    player.sendMessage(
        text('Limit warp untuk rank kamu sudah tercapai').System.fail
    )
}

function parseVector3(input) {
    const ps = input.trim().split(/\s+/).map(Number)
    if (ps.length !== 3 || ps.some(isNaN)) return null
    return { x: ps[0], y: ps[1], z: ps[2] }
}