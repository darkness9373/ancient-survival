export const RANK_CONFIG = {
  Member: {
    level: 0,
    commands: ['warp'],
    warpLimit: 1,
    prefix: '§b§l[Member]§r',
    show: '§l§bMember§r'
  },
  
  Legend: {
    level: 1,
    gold: 350,
    silver: 550,
    show: '§l§eLegend§r',
    commands: ["warp", "food"],
    prefix: '§e§l[Legend]§r',
    warpLimit: 3,
    foodCooldown: 600 // 10 menit (detik)
  },
  
  Mythic: {
    level: 2,
    gold: 450,
    silver: 650,
    show: '§l§5Mythic§r',
    commands: ["warp", "food", "heal"],
    prefix: '§l§5[Mythic]§r',
    warpLimit: 5,
    foodCooldown: 450, // 7.5 menit
    healCooldown: 1080 // 18 menit
  },
  
  Ascended: {
    level: 3,
    gold: 550,
    silver: 800,
    show: '§l§9Ascended§r',
    commands: ["warp", "food", "heal"],
    prefix: '§l§9[Ascended]§r',
    warpLimit: 6,
    foodCooldown: 300, // 5 menit
    healCooldown: 720 // 12 menit
  },
  
  Immortal: {
    level: 4,
    gold: 750,
    silver: 1250,
    show: '§l§cImmortal§r',
    commands: ["warp", "food", "heal"],
    prefix: '§l§c[Immortal]§r',
    warpLimit: 8,
    foodCooldown: 120, // 2 menit
    healCooldown: 300, // 5 menit
    
    exclusiveSpawn: true,
    unlockCustomRank: true
  }
}

export const PROGRESS_CONFIG = {
  Peasant: {
    prefix: '§l§f[Peasant]§r',
    show: '§l§fPeasant§r'
  },
  Wanderer: {
    prefix: '§l§n[Wanderer]§r',
    show: '§l§nWanderer§r'
  },
  Adventurer: {
    prefix: '§l§2[Adventurer]§r',
    show: '§l§2Adventurer§r'
  },
  Mercenary: {
    prefix: '§l§d[Mercenary]§r',
    show: '§l§dMercenary§r'
  },
  Warrior: {
    prefix: '§l§7[Warrior]§r',
    show: '§l§7Warrior§r'
  },
  Knight: {
    prefix: '§4§l[Knight]§r',
    show: '§4§lKnight§r'
  },
  Champion: {
    prefix: '§p§l[Champion]§r',
    show: '§p§lChampion'
  }
}

export const DAILY_REWARDS = {
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

export const OBJECTIVES = [
  'gold',
  'goldRaw',
  'killMonster',
  'killMob',
  'ping',
  'timePlayed',
  'silver',
  'silverRaw'
]