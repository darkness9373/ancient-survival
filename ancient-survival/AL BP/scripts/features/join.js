import { world, system } from "@minecraft/server";

world.afterEvents.playerSpawn.subscribe((ev) => {
  const player = ev.player;
  
  // hanya saat pertama kali join
  if (!ev.initialSpawn) return;
  if (!player.hasTag('hlock')) {
    try {
      player.runCommand(`give @s protection:lock 1`);
      system.run(() => player.addTag('hlock'))
    } catch (e) {
      player.sendMessage("§cItem Land Lock belum tersedia.");
    }
  } else return;
});