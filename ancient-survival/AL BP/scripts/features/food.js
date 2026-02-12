import { PlayerDatabase } from '../extension/Database.js'
import { Player, EntityComponentTypes } from '@minecraft/server'
import { text } from '../config/text.js'
import { RANK_CONFIG } from '../config/system.js'


/**
 * @param {Player} player
 */
export function foodPlayer(player) {
  
  /* ====== CEK STATUS ====== */
  const rank = new PlayerDatabase(player, 'Status').get() ?? 'Member'
  const config = RANK_CONFIG[rank]
  
  if (!config) {
    return player.sendMessage(
      text('Rank tidak valid').System.fail
    )
  }
  
  if (config.commands && !config.commands.includes('food')) {
    return player.sendMessage(
      text('Rank kamu saat ini tidak bisa menggunakan §6/food').System.fail
    )
  }
  
  if (config.foodCooldown === undefined) {
    return player.sendMessage(
      text('Rank kamu tidak memiliki akses §6/food').System.fail
    )
  }
  
  const cooldown = config.foodCooldown
  
  /* ====== CEK COOLDOWN ====== */
  const cdDB = new PlayerDatabase(player, 'FoodCooldown')
  const lastUse = Number(cdDB.get() ?? 0)
  const now = Math.floor(Date.now() / 1000)
  const passed = now - lastUse
  
  if (passed < cooldown) {
    const sisa = cooldown - passed
    const menit = Math.floor(sisa / 60)
    const detik = sisa % 60
    
    return player.sendMessage(
      text(`§cFood masih cooldown §6${menit}m ${detik}s`).System.fail
    )
  }
  
  /* ====== ISI HUNGER ====== */
  try {
    const hunger = player.getComponent(EntityComponentTypes.Hunger)
    if (hunger.currentValue === hunger.effectiveMax) {
      return player.sendMessage(text('Hunger kamu masih penuh').System.warn)
    }
    if (player.hasTag('admin')) {
      hunger.resetToMaxValue()
      return
    }
    hunger.resetToMaxValue()
  } catch (err) {
    return player.sendMessage(
      text('Gagal mengisi hunger').System.fail
    )
  }
  
  /* ====== SIMPAN COOLDOWN ====== */
  cdDB.set(now)
  
  player.sendMessage(
    text('Hunger kamu sudah penuh!').System.succ
  )
}