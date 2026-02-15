import { GameMode, Player, system, world } from '@minecraft/server';
import { text } from '../config/text';

const LOBBY1 = { x: -100, y: 190, z: -150 };
const LOBBY2 = { x: 140, y: 320, z: 35 };

function isInLobby(pos) {
  return (
    pos.x >= LOBBY1.x && pos.x <= LOBBY2.x &&
    pos.y >= LOBBY1.y && pos.y <= LOBBY2.y &&
    pos.z >= LOBBY1.z && pos.z <= LOBBY2.z
  )
}

system.runInterval(() => {
  world.getPlayers().forEach(player => {
    const pos = player.location
    if (player.hasTag('admin')) return
    if (isInLobby(pos)) {
        if (player.getGameMode() === GameMode.Survival) {
          player.setGameMode(GameMode.Adventure)
          player.sendMessage(text('Kamu berada di area Lobby, GameMode kamu akan diubah ke mode Adventure').System.deff)
        }
    } else {
      if (player.getGameMode() === GameMode.Adventure) {
        player.sendMessage(text('Kamu keluar dari area Lobby, Gamemode kamu akan kembali ke mode Survival').System.deff)
      }
    }
  })
}, 2)

world.beforeEvents.entityHurt.subscribe(data => {
  const player = data.hurtEntity
  if (!(player instanceof Player)) return
  const pos = player.location
  if (isInLobby(pos)) {
    data.cancel = true;
  }
})