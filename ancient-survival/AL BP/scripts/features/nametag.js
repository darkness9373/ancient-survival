import { system, world } from "@minecraft/server";
import { PlayerDatabase } from "../extension/Database.js";
import { RANK_CONFIG, PROGRESS_CONFIG } from "../config/system.js";

function updateNameTag(player) {
  try {
    const rank = new PlayerDatabase(player, 'Rank').get() ?? 'Member';
    const rankProgress = new PlayerDatabase(player, 'RankProgress').get() ?? 'Peasant';
    
    const rankData = RANK_CONFIG[rank] ?? RANK_CONFIG.Member
    const progressData = PROGRESS_CONFIG[rankProgress] ?? PROGRESS_CONFIG.Peasant
    const prefix = rankData.prefix
    const proprefix = progressData.prefix
    
    // Health
    const healthComp = player.getComponent("minecraft:health");
    const hp = Math.ceil(healthComp.currentValue);
    
    if (player.hasTag('admin')) {
      return player.nameTag = `§l§6[Admin]§r ${player.name}\n${proprefix}§r ${hp}`
    }
    
    player.nameTag =
      `${prefix} ${player.name}\n${proprefix}§r ${hp}`;
    
  } catch (e) {
    // biar ga spam error
  }
}

// update berkala
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    updateNameTag(player);
  }
}, 20); // tiap 1 detik