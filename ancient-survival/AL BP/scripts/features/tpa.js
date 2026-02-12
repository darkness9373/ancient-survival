import { world } from '@minecraft/server'
import { ModalFormData, ActionFormData } from '@minecraft/server-ui'
import { PlayerDatabase } from '../extension/Database'
import OpenUI from '../extension/OpenUI'
import { text } from '../config/text'

const EXPIRE = 120000 // 2 menit

/* ================= UTIL ================= */

const now = () => Date.now()
const isExpired = t => now() - t > EXPIRE

function getOnlinePlayers(except) {
  return world.getPlayers().filter(p => p.id !== except.id)
}

function getArray(db) {
  return JSON.parse(db.get() ?? '[]')
}

function setArray(db, arr) {
  db.set(JSON.stringify(arr))
}

function cleanupArray(arr) {
  return arr.filter(r => !isExpired(r.time))
}

/* ================= SEND ================= */

export function tpaCommand(player) {
  
  const players = getOnlinePlayers(player)
  
  if (!players.length) {
    player.sendMessage(text('Tidak ada player online').System.warn)
    return
  }
  
  const form = new ModalFormData()
    .title('TPA')
    .dropdown('Pilih player', players.map(p => p.name))
  
  OpenUI.force(player, form).then(r => {
    if (r.canceled) return
    sendRequest(player, players[r.formValues[0]])
  })
}

function sendRequest(sender, target) {
  
  if (sender.id === target.id) {
    sender.sendMessage(text('Tidak bisa TPA ke diri sendiri').System.fail)
    return
  }
  
  /* ==== CEK SENDER ==== */
  const sendDB = new PlayerDatabase(sender, 'RequestSend')
  const oldSend = JSON.parse(sendDB.get() ?? 'null')
  
  if (oldSend && !isExpired(oldSend.time)) {
    sender.sendMessage(text('Sudah melakukan request').System.warn)
    return
  }
  
  /* ==== TARGET ARRAY ==== */
  const targetDB = new PlayerDatabase(target, 'Request')
  let list = getArray(targetDB)
  
  list = cleanupArray(list)
  
  if (list.some(r => r.fromId === sender.id)) {
    sender.sendMessage(text('Request sudah dikirim').System.warn)
    return
  }
  
  const data = {
    fromId: sender.id,
    fromName: sender.name,
    time: now()
  }
  
  list.push(data)
  
  setArray(targetDB, list)
  
  sendDB.set(JSON.stringify({
    targetId: target.id,
    time: now()
  }))
  
  sender.sendMessage(
    text(`TPA dikirim ke §e${target.name}`).System.succ
  )
  
  target.sendMessage(
    text(
      `§e${sender.name} §ringin TPA\n` +
      `Gunakan §a/tpaccept §ratau §c/tpdeny`
    ).System.deff
  )
}

/* ================= ACCEPT ================= */

export function tpAcceptCommand(player) {
  
  const db = new PlayerDatabase(player, 'Request')
  let list = cleanupArray(getArray(db))
  
  if (!list.length) {
    player.sendMessage(text('Tidak ada request').System.warn)
    return
  }
  
  setArray(db, list)
  
  if (list.length === 1) {
    return accept(player, list[0])
  }
  
  const form = new ActionFormData()
    .title('TPA Requests')
  
  list.forEach(r => form.button(r.fromName))
  
  OpenUI.force(player, form).then(res => {
    if (res.canceled) return
    accept(player, list[res.selection])
  })
}

function accept(target, data) {
  
  const sender = world.getPlayers()
    .find(p => p.id === data.fromId)
  
  if (!sender) return
  
  sender.tryTeleport(target.location, {
    dimension: target.dimension
  })
  
  removeBoth(target, sender)
  
  sender.sendMessage(
    text(`TPA ke §e${target.name} §aditerima`).System.succ
  )
  
  target.sendMessage(
    text(`Menerima TPA dari §e${sender.name}`).System.succ
  )
}

/* ================= DENY ================= */

export function tpDenyCommand(player) {
  
  const db = new PlayerDatabase(player, 'Request')
  let list = cleanupArray(getArray(db))
  
  if (!list.length) {
    player.sendMessage(text('Tidak ada request').System.warn)
    return
  }
  
  setArray(db, list)
  
  if (list.length === 1) {
    return deny(player, list[0])
  }
  
  const form = new ActionFormData()
    .title('TPA Requests')
  
  list.forEach(r => form.button(r.fromName))
  
  OpenUI.force(player, form).then(res => {
    if (res.canceled) return
    deny(player, list[res.selection])
  })
}

function deny(target, data) {
  
  const sender = world.getPlayers()
    .find(p => p.id === data.fromId)
  
  if (!sender) return
  
  removeBoth(target, sender)
  
  sender.sendMessage(
    text(`TPA ke §e${target.name} §cditolak`).System.fail
  )
  
  target.sendMessage(
    text(`Menolak TPA dari §e${sender.name}`).System.fail
  )
}

/* ================= REMOVE BOTH ================= */

function removeBoth(target, sender) {
  
  /* target array */
  const targetDB = new PlayerDatabase(target, 'Request')
  let list = getArray(targetDB)
  
  list = list.filter(r => r.fromId !== sender.id)
  
  setArray(targetDB, list)
  
  /* sender single */
  new PlayerDatabase(sender, 'RequestSend').delete()
}