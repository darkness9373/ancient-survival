import { system, world } from '@minecraft/server';

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
    
    if (isInLobby(pos)) {
      
    }
  })
}, 20)