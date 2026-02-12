import { world, system } from '@minecraft/server'
import { text } from '../config/text';

/* ================= CONFIG ================= */
const CLEAR_INTERVAL = 10 * 60 // menit → detik (contoh 5 menit)
const CLEAR_ENTITIES = [
  'minecraft:item',
  'minecraft:xp_orb'
]

/* ================= STATE ================= */
let timer = CLEAR_INTERVAL

/* ================= LOOP ================= */
system.runInterval(() => {
  timer--
  
  // WARNING 30 DETIK (CHAT)
  if (timer === 30) {
    world.sendMessage(
      text('Item & XP akan dibersihkan dalam §e30 §adetik!').System.succ
    )
  }
  
  // COUNTDOWN 10 DETIK (ACTIONBAR)
  if (timer <= 15 && timer > 0) {
    for (const player of world.getPlayers()) {
      player.onScreenDisplay.setActionBar(
        `§eClear Lag dalam §a${timer} §edetik`
      )
      if (timer <= 10) {
        player.playSound('random.click')
      }
    }
  }
  
  // EXECUTE CLEAR
  if (timer <= 0) {
    runClearLag()
    timer = CLEAR_INTERVAL
  }
  
}, 20) // 20 tick = 1 detik

/* ================= FUNCTIONS ================= */
function runClearLag() {
  let total = 0
  
  for (const dim of [
    world.getDimension('overworld'),
    world.getDimension('nether'),
    world.getDimension('the_end')
  ]) {
    for (const entity of dim.getEntities()) {
      if (entity.typeId === 'minecraft:player') continue
      if (!CLEAR_ENTITIES.includes(entity.typeId)) continue
      
      entity.remove()
      total++
    }
  }
  for (const player of world.getPlayers()) {
    player.playSound('random.levelup')
  }
  world.sendMessage(
    text(`Berhasil membersihkan §e${total} §aentity`).System.succ
  )
}