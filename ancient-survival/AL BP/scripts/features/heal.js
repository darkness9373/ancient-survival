import { PlayerDatabase } from '../extension/Database.js'
import { Player, EntityComponentTypes } from '@minecraft/server'
import { text } from '../config/text'
import { RANK_CONFIG } from '../config/system'


/**
 * @param {Player} player
 */
export function healPlayer(player) {
  
  /* ====== CEK STATUS ====== */
  const rank = new PlayerDatabase(player, 'Status').get() ?? 'Member'
  const config = RANK_CONFIG[rank]
  
  if (!config) {
    return player.sendMessage(
      text('Status tidak valid di config').System.fail
    )
  }
  
  if (config.commands && !config.commands.includes('heal')) {
    return player.sendMessage(
      text('Rank kamu saat ini tidak bisa menggunakan §6/heal').System.fail
    )
  }
  
  if (config.healCooldown === undefined) {
    return player.sendMessage(
      text('Rank kamu tidak memiliki akses §6/heal').System.fail
    )
  }
  
  const cooldown = config.healCooldown
  
  /* ====== CEK COOLDOWN ====== */
  const healDB = new PlayerDatabase(player, 'HealCooldown')
  const lastUse = Number(healDB.get() ?? 0)
  const now = Math.floor(Date.now() / 1000)
  const passed = now - lastUse
  
  if (passed < cooldown) {
    const sisa = cooldown - passed
    const menit = Math.floor(sisa / 60)
    const detik = sisa % 60
    
    return player.sendMessage(
      text(`Heal masih cooldown §6${menit}m ${detik}s`).System.fail
    )
  }
  
  /* ====== ISI DARAH ====== */
  try {
    const health = player.getComponent(EntityComponentTypes.Health)
    if (health.currentValue === health.effectiveMax) {
      return player.sendMessage(text('Darah kamu masih penuh').System.warn)
    }
    if (player.hasTag('admin')) {
      health.resetToMaxValue()
      return
    }
    health.resetToMaxValue()
  } catch (err) {
    return player.sendMessage(
      text('Gagal mengisi darah').System.fail
    )
  }
  
  /* ====== SIMPAN COOLDOWN ====== */
  healDB.set(now)
  
  player.sendMessage(
    text('Darah kamu sudah penuh!').System.succ
  )
}