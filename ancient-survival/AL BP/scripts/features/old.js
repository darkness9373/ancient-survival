import { world, system, ItemStack } from "@minecraft/server";
import { PlayerDatabase } from "../extension/Database";
import Score from "../extension/Score";
import { OLD_PLAYERS } from '../config/oldplayers';
import Extra from '../extension/Extra';


/* =========================
   CONFIG REWARD
========================= */
const REWARD = {
    gold: 2000,
    
    items: [
        { id: "diamond", amount: 10 },
        { id: "totem_of_undying", amount: 1 },
        { id: "golden_apple", amount: 5 }
    ]
};

/* =========================
   CHECK PLAYER JOIN
========================= */
world.afterEvents.playerSpawn.subscribe(ev => {
    const player = ev.player;
    
    // hanya saat pertama spawn join world
    if (!ev.initialSpawn) return;
    
    system.run(() => checkReward(player));
});

/* =========================
   MAIN LOGIC
========================= */
function checkReward(player) {
    
    // sudah pernah klaim?
    const claimed = new PlayerDatabase(player, "OldRewardClaimed").get();
    if (claimed) return;
    
    // cocok di list?
    const match = OLD_PLAYERS
        .map(n => n.toLowerCase())
        .includes(player.name.toLowerCase());
    
    if (!match) return;
    
    giveReward(player);
    
    new PlayerDatabase(player, "OldRewardClaimed").set(true);
}

/* =========================
   GIVE REWARD
========================= */
function giveReward(player) {
    
    // tambah score
    if (REWARD.gold) {
        Score.add(player, 'gold', REWARD.gold)
    }
    if (REWARD.silver) {
        Score.add(player, 'silver', REWARD.silver)
    }
    
    // kasih banyak item
    let itemText = "";
    if (REWARD.items) {
        for (const it of REWARD.items) {
            const item = new ItemStack(normalizeId(it.id), 1)
            giveItemSafely(player, item, it.amount)
            
            const name = Extra.formatName(it.id)
            itemText += `\n§b+${it.amount} ${name}`;
        }
    }
    
    // notifikasi
    player.sendMessage(
        `§6[Ancient Reward] §aKamu mendapat reward player lama!\n` +
        `§6+${REWARD.gold} Gold\n` +
        `§7+${REWARD.silver} Silver` +
        itemText
    );
}

function normalizeId(id) {
    return id.includes(':') ? id : `minecraft:${id}`
}

function hasEmptySlot(container) {
    for (let i = 0; i < container.size; i++) {
        if (!container.getItem(i)) return true;
    }
    return false;
}

function giveItemSafely(player, itemStack, amount) {
    const inv = player.getComponent('inventory').container;
    
    // item non-stackable (totem, enchanted book)
    if (itemStack.maxAmount === 1) {
        for (let i = 0; i < amount; i++) {
            const one = itemStack.clone();
            one.amount = 1;
            
            if (!hasEmptySlot(inv)) {
                player.dimension.spawnItem(one, player.location);
            } else {
                inv.addItem(one);
            }
        }
        return;
    }
    
    // item stackable
    let remaining = amount;
    const maxStack = itemStack.maxAmount;
    
    while (remaining > 0) {
        const give = Math.min(maxStack, remaining);
        const stack = itemStack.clone();
        stack.amount = give;
        
        if (!hasEmptySlot(inv)) {
            player.dimension.spawnItem(stack, player.location);
        } else {
            inv.addItem(stack);
        }
        
        remaining -= give;
    }
}