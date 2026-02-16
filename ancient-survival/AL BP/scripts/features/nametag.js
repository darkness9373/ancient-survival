import { system, world } from "@minecraft/server";
import { PlayerDatabase } from "../extension/Database.js";
import { RANK_CONFIG, PROGRESS_CONFIG } from "../config/system.js";

function updateNameTag(player) {
  try {
    const rank = new PlayerDatabase(player, 'Rank').get() ?? 'Member';
    const progress = new PlayerDatabase(player, 'RankProgress').get() ?? 'Peasant';
    const custom = new PlayerDatabase(player, 'CustomRank').get();
    const clr = new PlayerDatabase(player, 'CustomRankColor').get() ?? '§f';
    
    const rankData = RANK_CONFIG[rank] ?? {};
    const progData = PROGRESS_CONFIG[progress] ?? {};
    
    /* ================= BARIS 1 (RANK) ================= */
    
    let rankPrefix = '';
    
    // Prioritas custom
    if (custom) {
      rankPrefix = `§l${clr}[${custom}]§r`;
    }
    // Rank biasa
    else if (rankData.prefix) {
      rankPrefix = rankData.prefix;
    }
    
    /* ================= BARIS 2 (PROGRESS + HP) ================= */
    
    const progPrefix = progData.prefix ?? '';
    
    const health = player.getComponent("minecraft:health");
    const hp = Math.ceil(health.currentValue);
    
    /* ================= ADMIN OVERRIDE ================= */
    
    if (player.hasTag('admin')) {
      player.nameTag =
        `§l§6[Admin]§r ${player.name}\n${progPrefix} ${hp}`;
      return;
    }
    
    /* ================= FINAL ================= */
    
    player.nameTag =
      `${rankPrefix} ${player.name}\n${progPrefix} ${hp}`;
    
  } catch {}
}

/* ================= LOOP ================= */

system.runInterval(() => {
  for (const p of world.getPlayers()) {
    updateNameTag(p);
  }
}, 10);