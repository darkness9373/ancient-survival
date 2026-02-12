import { ActionFormData, ModalFormData, MessageFormData } from '@minecraft/server-ui';
import OpenUI from '../extension/OpenUI';
import { world } from '@minecraft/server';
import { text } from '../config/text';
import { WorldDatabase } from '../extension/Database';
import { playtime } from './timeplayed';

// helper: escape nama supaya aman dimasukkan ke dalam "..."
function escapeNameForCommand(name) {
  return name.replace(/"/g, '\\"');
}

world.afterEvents.playerSpawn.subscribe(ev => {
  if (!ev.initialSpawn) return
  
  const player = ev.player
  
  // cek ban by name (offline ban)
  const nameDb = new WorldDatabase(`BanName:${player.name.toLowerCase()}`)
  const nameData = nameDb.get()
  
  if (nameData) {
    const ban = JSON.parse(nameData)
    
    const idDb = new WorldDatabase(`Ban:${player.id}`)
    idDb.set(JSON.stringify({ ...ban, id: player.id }))
    
    nameDb.remove()
  }
  
  // cek ban by id
  const db = new WorldDatabase(`Ban:${player.id}`)
  const raw = db.get()
  
  if (!raw) return
  
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    db.remove()
    return
  }
  
  // CATATAN: sebelumnya kamu menghapus db kalau pemain punya tag 'admin'.
  // Menghapus db akan otomatis meng-unban admin saat login. Biasanya ini
  // bukan yg diharapkan, jadi di sini aku *tidak* menghapus db — hanya
  // mengizinkan admin login. Kalau memang mau auto-unban admin, ganti
  // `return` dengan `db.remove(); return;`
  if (player.hasTag('admin')) {
    return
  }
  
  // Jika ban temporary & sudah expired → auto unban
  if (!data.permanent && Date.now() >= data.expiresAt) {
    db.remove()
    return
  }
  
  // Hitung sisa waktu
  let durationText = 'Permanent'
  if (!data.permanent) {
    const leftMs = data.expiresAt - Date.now()
    durationText = playtime(Math.floor(leftMs / 1000))
  }
  
  // Kick player — gabungkan jadi 1 baris reason dan escape nama
  try {
    const reason = `§cKamu dibanned! §7Alasan: ${data.reason} §7Durasi: ${durationText}`
    world.getDimension('overworld').runCommand(
      `kick "${escapeNameForCommand(player.name)}" ${reason}`
    )
  } catch (err) {
    // jangan crash; log supaya bisa debug
    console.error('Kick command failed:', err)
  }
})

export function banMenu(player) {
  const form = new ActionFormData()
  form.title('Ban Player')
  form.body('Pilih metode yg akan digunakan')
  form.button('Online Player')
  form.button('Manual Input')
  OpenUI.force(player, form).then(async r => {
    if (r.canceled) return
    if (r.selection === 0) {
      banOnline(player)
    } else {
      banManual(player)
    }
  })
}

function banOnline(player) {
  const players = world.getPlayers().filter(p => p.id !== player.id)
  if (!players.length) return player.sendMessage(text('Tidak ada player yang sedang online').System.fail)
  const names = players.map(p => p.name)
  const form = new ModalFormData()
  form.title('Ban Player')
  form.dropdown('Select Player', names)
  form.textField(
    'Duration\n d = day | h = hour | m = minute\n perm = permanent',
    'ex: 3d 12h'
  )
  form.textField('Reason', 'ex: Griefing')
  OpenUI.force(player, form).then(async r => {
    if (r.canceled) return
    const target = players[r.formValues[0]]
    const durationText = r.formValues[1]
    const reason = r.formValues[2] || 'No Reason'
    
    const duration = parseDurationText(durationText)
    if (!duration || typeof duration !== 'object' || (!duration.permanent && !duration.expiresAt)) {
      return player.sendMessage(text('Format duration tidak valid!').System.fail)
    }
    confirmBan(player, target, duration, reason)
  })
}

function banManual(player) {
  const form = new ModalFormData()
  form.title('Ban Player (Manual)')
  form.textField('Player Name', 'ex: Steve')
  form.textField(
    'Duration\n d = day | h = hour | m = minute\n perm = permanent',
    'ex: 3d 12h'
  )
  form.textField('Reason', 'ex: Griefing')
  
  OpenUI.force(player, form).then(async r => {
    if (r.canceled) return
    
    const name = r.formValues[0]?.trim()
    const durationText = r.formValues[1]
    const reason = r.formValues[2] || 'No Reason'
    
    if (!name) {
      player.sendMessage(text('Nama player tidak boleh kosong').System.fail)
      return
    }
    
    const duration = parseDurationText(durationText)
    if (!duration || typeof duration !== 'object' || (!duration.permanent && !duration.expiresAt)) {
      return player.sendMessage(text('Format duration tidak valid!').System.fail)
    }
    
    confirmBanManual(player, name, duration, reason)
  })
}

function banPlayer(player, target, duration, reason) {
  const db = new WorldDatabase(`Ban:${target.id}`)
  const data = {
    name: target.name,
    id: target.id,
    reason,
    bannedBy: player.name,
    bannedAt: Date.now(),
    expiresAt: duration.expiresAt,
    permanent: duration.permanent
  }
  db.set(JSON.stringify(data))
  try {
    const safeName = escapeNameForCommand(target.name)
    const kickReason = `§cKamu dibanned! §7Alasan: ${reason}`
    world.getDimension('overworld').runCommand(
      `kick "${safeName}" ${kickReason}`
    )
  } catch (err) {
    console.error('Kick command failed:', err)
  }
  player.sendMessage(text(`${target.name} berhasil diban`).System.succ)
}

function banOffline(admin, name, duration, reason) {
  const db = new WorldDatabase(`BanName:${name.toLowerCase()}`)
  
  const data = {
    name,
    reason,
    bannedBy: admin.name,
    bannedAt: Date.now(),
    expiresAt: duration.expiresAt,
    permanent: duration.permanent
  }
  
  db.set(JSON.stringify(data))
  
  admin.sendMessage(
    text(`${name} berhasil diban (offline)`).System.succ
  )
}

function confirmBan(admin, target, duration, reason) {
  const form = new MessageFormData()
    .title('Confirm Ban')
    .body(
      `§fNama: §e${target.name}\n` +
      `§fID: §7${target.id}\n\n` +
      `§fDurasi: §c${formatBanDuration(duration)}\n` +
      `§fAlasan: §6${reason}\n\n` +
      `§cYakin ingin memban player ini?`
    )
    .button1('Ban')
    .button2('Cancel')
  
  OpenUI.force(admin, form).then(async r => {
    if (r.canceled || r.selection === 1) return
    banPlayer(admin, target, duration, reason)
  })
};

function confirmBanManual(admin, name, duration, reason) {
  const form = new MessageFormData()
  form.title('Confirm Ban')
  form.body(
    `§fNama: §e${name}\n` +
    `§fID: §7-\n` +
    `§fDurasi: §c${formatBanDuration(duration)}\n` +
    `§fAlasan: §6${reason}\n\n` +
    `§cYakin ingin memban player ini?`
  )
  form.button1('Ban')
  form.button2('Cancel')
  
  OpenUI.force(admin, form).then(async r => {
    if (r.canceled || r.selection === 1) return
    banOffline(admin, name, duration, reason)
  })
}

function parseDurationText(input) {
  if (!input) return null
  const str = input.toLowerCase().trim()
  if (str === 'perm' || str === 'permanent') {
    return { permanent: true, expiresAt: null }
  }
  const regex = /(\d+)\s*(d|h|m)/g
  let match
  let totalMs = 0
  while ((match = regex.exec(str)) !== null) {
    const value = parseInt(match[1])
    const unit = match[2]
    switch (unit) {
      case 'd':
        totalMs += value * 86400000;
        break
      case 'h':
        totalMs += value * 3600000;
        break
      case 'm':
        totalMs += value * 60000;
        break
    }
  }
  if (totalMs <= 0) return null
  return {
    permanent: false,
    expiresAt: Date.now() + totalMs
  }
}

function formatBanDuration(duration) {
  if (duration.permanent) return 'Permanent'
  const ms = duration.expiresAt - Date.now()
  return playtime(Math.floor(ms / 1000))
}