export const text = (txt) => {
  return {
    System: {
      warn: `§l[§eSystem§r§l] §r§6${txt}`,
      succ: `§l[§eSystem§r§l] §r§a${txt}`,
      fail: `§l[§eSystem§r§l] §r§c${txt}`,
      deff: `§l[§eSystem§r§l] §r${txt}`
    }
  }
}