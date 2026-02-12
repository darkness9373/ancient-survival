import { world, system } from '@minecraft/server';
import { PlayerDatabase } from "../extension/Database.js";
import Score from "../extension/Score.js";
import { ItemStack } from "@minecraft/server";

system.runInterval(() => {
    world.getPlayers().forEach(player => {
        checkDailyLogin(player)
    })
}, 1200)

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
    
    player.sendMessage(`§aDaily login ke-${count}!`);
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
    
    player.sendMessage(`§eKamu mendapat reward daily login hari ke-${day}!`);
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

const DAILY_REWARDS = {
    1: {
        rank: "Peasant",
        items: [
            { id: "cooked_beef", amount: 32 },
            { id: "stone_pickaxe", amount: 1 },
            { id: "stone_axe", amount: 1 },
            { id: "stone_shovel", amount: 1 },
            { id: "stone_sword", amount: 1 }
        ]
    },
    
    3: {
        silver: 50,
        exp: 150,
        items: [{ id: "cooked_beef", amount: 64 }],
        rank: "Wanderer"
    },
    
    6: {
        exp: 200,
        silver: 75,
        items: [{ id: "iron_ingot", amount: 20 }],
        rank: "Adventurer"
    },
    
    9: {
        exp: 300,
        silver: 100,
        items: [
            { id: "gold_ingot", amount: 25 },
            { id: "iron_ingot", amount: 40 }
        ],
        rank: "Mercenary"
    },
    
    12: {
        exp: 350,
        silver: 125,
        gold: 20,
        items: [
            { id: "gold_ingot", amount: 35 },
            { id: "iron_ingot", amount: 50 }
        ],
        rank: "Warrior"
    },
    
    15: {
        exp: 500,
        silver: 150,
        gold: 30,
        items: [
            { id: "diamond", amount: 25 },
            { id: "iron_ingot", amount: 64 }
        ],
        rank: "Knight"
    },
    
    18: {
        exp: 750,
        silver: 175,
        gold: 75,
        items: [
            { id: "diamond", amount: 35 },
            { id: "iron_ingot", amount: 64 }
        ],
        freeLegend: true,
        rank: "Champion"
    }
};