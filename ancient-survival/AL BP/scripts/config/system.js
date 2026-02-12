export const RANK_CONFIG = {
  Member: {
    level: 0,
    commands: ['warp'],
    warpLimit: 1,
    prefix: '[Member]§r',
    show: 'Member'
  },
  
  Legend: {
    level: 1,
    gold: 350,
    silver: 550,
    show: 'Legend',
    commands: ["warp", "food"],
    prefix: '[Legend]§r',
    warpLimit: 3,
    foodCooldown: 600 // 10 menit (detik)
  },
  
  Mythic: {
    level: 2,
    gold: 450,
    silver: 650,
    show: 'Mythic',
    commands: ["warp", "food", "heal"],
    prefix: '[Mythic]§r',
    warpLimit: 5,
    foodCooldown: 450, // 7.5 menit
    healCooldown: 1080 // 18 menit
  },
  
  Ascended: {
    level: 3,
    gold: 550,
    silver: 800,
    show: 'Ascended',
    commands: ["warp", "food", "heal"],
    prefix: '[Ascended]§r',
    warpLimit: 6,
    foodCooldown: 300, // 5 menit
    healCooldown: 720 // 12 menit
  },
  
  Immortal: {
    level: 4,
    gold: 750,
    silver: 1250,
    show: 'Immortal',
    commands: ["warp", "food", "heal"],
    prefix: '[Immortal]§r',
    warpLimit: 8,
    foodCooldown: 120, // 2 menit
    healCooldown: 300, // 5 menit
    
    exclusiveSpawn: true,
    unlockCustomRank: true
  }
}

export const PROGRESS_CONFIG = {
  Peasant: {
    prefix: '[Peasant]§r',
    show: 'Peasant'
  },
  Wanderer: {
    prefix: '[Wanderer]§r',
    show: 'Wanderer'
  },
  Adventurer: {
    prefix: '[Adventurer]§r',
    show: 'Adventurer'
  },
  Mercenary: {
    prefix: '[Mercenary]§r',
    show: 'Mercenary'
  },
  Warrior: {
    prefix: '[Warrior]§r',
    show: 'Warrior'
  },
  Knight: {
    prefix: '[Knight]§r',
    show: 'Knight'
  },
  Champion: {
    prefix: '[Champion]§r',
    show: 'Champion'
  }
}