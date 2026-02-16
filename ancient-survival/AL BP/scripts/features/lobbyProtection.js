import { GameMode, Player, system, world } from '@minecraft/server';
import { text } from '../config/text';

const LOBBY1 = { x: -100, y: 190, z: -150 };
const LOBBY2 = { x: 140, y: 320, z: 35 };

function isInLobby(pos) {
  const minX = Math.min(LOBBY1.x, LOBBY2.x)
  const maxX = Math.max(LOBBY1.x, LOBBY2.x)
  
  const minY = Math.min(LOBBY1.y, LOBBY2.y)
  const maxY = Math.max(LOBBY1.y, LOBBY2.y)
  
  const minZ = Math.min(LOBBY1.z, LOBBY2.z)
  const maxZ = Math.max(LOBBY1.z, LOBBY2.z)
  
  return (
    pos.x >= minX && pos.x <= maxX &&
    pos.y >= minY && pos.y <= maxY &&
    pos.z >= minZ && pos.z <= maxZ
  )
}

const GRAVE1 = { x: 13, y: 121, z: -38 };
const GRAVE2 = { x: 35, y: 113, z: -61 };

function isInGrave(pos) {
  const minX = Math.min(GRAVE1.x, GRAVE2.x)
  const maxX = Math.max(GRAVE1.x, GRAVE2.x)
  
  const minY = Math.min(GRAVE1.y, GRAVE2.y)
  const maxY = Math.max(GRAVE1.y, GRAVE2.y)
  
  const minZ = Math.min(GRAVE1.z, GRAVE2.z)
  const maxZ = Math.max(GRAVE1.z, GRAVE2.z)
  
  return (
    pos.x >= minX && pos.x <= maxX &&
    pos.y >= minY && pos.y <= maxY &&
    pos.z >= minZ && pos.z <= maxZ
  )
}

system.runInterval(() => {
  world.getPlayers().forEach(player => {
    const pos = player.location
    if (player.hasTag('admin')) return
    if (isInLobby(pos)) {
      if (player.getGameMode() === GameMode.Survival) {
        player.setGameMode(GameMode.Adventure)
        player.sendMessage(text('Kamu berada di area Lobby....').System.deff)
      }
    } else {
      if (player.getGameMode() === GameMode.Adventure) {
        player.setGameMode(GameMode.Survival)
        player.sendMessage(text('Kamu keluar dari area Lobby....').System.deff)
      }
    }
  })
}, 20)

const ALLOWED_TYPES = [
  "minecraft:player",
  "minecraft:armor_stand",
  "npc:npc_custom",
  "drk:gravestone_item",
  "drk:gacha_armor",
  "drk:gacha_weapon",
  "minecraft:item",
  "add:floating_text"
]

function getLobbyVolume() {
  const minX = Math.min(LOBBY1.x, LOBBY2.x)
  const minY = Math.min(LOBBY1.y, LOBBY2.y)
  const minZ = Math.min(LOBBY1.z, LOBBY2.z)
  
  const sizeX = Math.abs(LOBBY2.x - LOBBY1.x)
  const sizeY = Math.abs(LOBBY2.y - LOBBY1.y)
  const sizeZ = Math.abs(LOBBY2.z - LOBBY1.z)
  
  return {
    location: { x: minX, y: minY, z: minZ },
    volume: { x: sizeX, y: sizeY, z: sizeZ }
  }
}

system.runInterval(() => {
  const dim = world.getDimension("overworld")
  const { location, volume } = getLobbyVolume()
  const entities = dim.getEntities({ location, volume })
  
  for (const e of entities) {
    if (e.typeId === "minecraft:player") continue
    if (ALLOWED_TYPES.includes(e.typeId)) continue
    
    try { e.remove() } catch {}
  }
}, 40)

world.beforeEvents.entityHurt.subscribe(data => {
  const victim = data.hurtEntity
  if (!(victim instanceof Player)) return
  
  if (isInLobby(victim.location)) {
    data.cancel = true
    return
  }
  
  const attacker = data.damageSource.damagingEntity
  if (attacker instanceof Player && isInLobby(attacker.location)) {
    data.cancel = true
  }
  
  if (isInGrave(victim.location)) {
    data.cancel = true
    return
  }
  
  const attacker = data.damageSource.damagingEntity
  if (attacker instanceof Player && isInGrave(attacker.location)) {
    data.cancel = true
  }
})