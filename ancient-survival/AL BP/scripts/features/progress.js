import { world, system } from '@minecraft/server';
import { PlayerDatabase } from "../extension/Database.js";
import Score from "../extension/Score.js";
import { ItemStack } from "@minecraft/server";
import { text } from '../config/text';
import { DAILY_REWARDS } from '../config/system';

system.runInterval(() => {
    world.getPlayers().forEach(player => {
        checkDailyLogin(player)
    })
}, 600)

const WIB_OFFSET = 7 * 60 * 60 * 1000; // UTC+7

function checkDailyLogin(player) {
    // WIB day index
    const today = Math.floor((Date.now() + WIB_OFFSET) / 86400000);
    
    const lastLoginDB = new PlayerDatabase(player, "LastLoginDay");
    const dayCountDB = new PlayerDatabase(player, "LoginDayCount");
    
    const lastDay = Number(lastLoginDB.get() ?? -1);
    let count = Number(dayCountDB.get() ?? 0);
    
    // sudah login hari ini
    if (lastDay === today) return;
    
    // hari baru → tambah
    count++;
    
    lastLoginDB.set(today);
    dayCountDB.set(count);
    
    player.sendMessage(text(`Daily login ke-${count}!`).System.succ);
    giveDailyReward(player, count);
}

function giveDailyReward(player, day) {
    const reward = DAILY_REWARDS[day];
    if (reward === undefined) return;
    
    // currency
    if (reward.silver)
        Score.add(player, "silver", reward.silver);
    
    if (reward.gold)
        Score.add(player, "gold", reward.gold);
    
    // EXP
    if (reward.exp)
        player.addExperience(reward.exp);
    
    // items
    if (reward.items) {
        for (const item of reward.items) {
            try {
                const stack = new ItemStack(normalizeId(item.id), 1);
                giveItemSafely(player, stack, item.amount);
            } catch (e) {}
        }
    }
    
    // free legend
    if (reward.freeLegend) {
        const db = new PlayerDatabase(player, "RankList");
        const list = JSON.parse(db.get() ?? "[]");
        
        if (!list.includes("Legend")) {
            list.push("Legend");
            db.set(JSON.stringify(list));
        }
    }
    
    // rank progress
    if (reward.rank) {
        const db = new PlayerDatabase(player, "RankProgress");
        const dbL = new PlayerDatabase(player, "RankProgressList");
        
        const list = JSON.parse(dbL.get() ?? "[]");
        
        if (!list.includes(reward.rank)) {
            list.push(reward.rank);
            dbL.set(JSON.stringify(list));
            db.set(reward.rank);
        }
    }
    
    player.sendMessage(text(`Kamu mendapat reward daily login hari ke-${day}!`).System.succ);
}

function giveItemSafely(player, itemStack, amount) {
    const inv = player.getComponent("minecraft:inventory").container;
    
    // non stackable
    if (itemStack.maxAmount === 1) {
        for (let i = 0; i < amount; i++) {
            const one = itemStack.clone();
            one.amount = 1;
            
            if (!hasEmptySlot(inv))
                player.dimension.spawnItem(one, player.location);
            else
                inv.addItem(one);
        }
        return;
    }
    
    // stackable
    let remaining = amount;
    const max = itemStack.maxAmount;
    
    while (remaining > 0) {
        const give = Math.min(max, remaining);
        const stack = itemStack.clone();
        stack.amount = give;
        
        if (!hasEmptySlot(inv))
            player.dimension.spawnItem(stack, player.location);
        else
            inv.addItem(stack);
        
        remaining -= give;
    }
}

function hasEmptySlot(container) {
    for (let i = 0; i < container.size; i++) {
        if (!container.getItem(i)) return true;
    }
    return false;
}

function normalizeId(id) {
    return id.includes(":") ? id : `minecraft:${id}`;
}