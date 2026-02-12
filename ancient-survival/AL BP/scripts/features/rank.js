import { system, world, ItemStack } from '@minecraft/server';
import { ModalFormData } from '@minecraft/server-ui'
import OpenUI from '../extension/OpenUI'
import { WorldDatabase, PlayerDatabase } from '../extension/Database.js'
import Score from '../extension/Score'
import { text } from '../config/text'
import { RANK_CONFIG } from '../config/system';


export function setRank(player) {
  const listRaw = new PlayerDatabase(player, 'RankList').get() ?? '[]'
  const rankList = JSON.parse(listRaw)
  
  if (!rankList.length) {
    return player.sendMessage(
      text('Kamu belum memiliki rank selain Member').System.fail
    )
  }
  
  const form = new ModalFormData()
    .title('Set Your Rank')
    .dropdown('Pilih rank yang kamu miliki:', rankList)
  
  OpenUI.force(player, form).then(r => {
    if (r.canceled) return
    
    const selectedRank = rankList[r.formValues[0]]
    const config = RANK_CONFIG[selectedRank]
    if (!config) return
    
    new PlayerDatabase(player, 'Rank').set(selectedRank)
    new PlayerDatabase(player, 'RankLevel').set(config.level)
    
    player.sendMessage(
      text(`Berhasil mengganti Rank ke ${selectedRank}`).System.succ
    )
  })
}

export function addRankForm(player) {
  const rankNames = Object.keys(RANK_CONFIG)
  
  const form = new ModalFormData()
    .title('Add Player Rank')
    .textField('Player Name', 'ex: Steve')
    .dropdown('Select Rank', rankNames)
  
  OpenUI.force(player, form).then(r => {
    if (r.canceled) return
    
    const playerName = r.formValues[0]?.trim()
    const rank = rankNames[r.formValues[1]]
    
    if (!playerName) {
      return player.sendMessage(
        text('Nama player tidak valid').System.fail
      )
    }
    
    const db = new WorldDatabase('AddRank')
    const queue = JSON.parse(db.get() ?? '[]')
    
    queue.push({ name: playerName, rank })
    db.set(JSON.stringify(queue))
    
    player.sendMessage(
      text(
        `Penambahan rank diproses:\n§7Name: §b${playerName}\n§7Rank: §6${rank}`
      ).System.succ
    )
  })
}

system.runInterval(() => {
  const addDB = new WorldDatabase('AddRank')
  const queue = JSON.parse(addDB.get() ?? '[]')
  if (!queue.length) return
  
  for (const player of world.getPlayers()) {
    const index = queue.findIndex(q => q.name === player.name)
    if (index === -1) continue
    
    const { rank } = queue[index]
    
    const ownedDB = new PlayerDatabase(player, 'RankList')
    const ownedRank = JSON.parse(ownedDB.get() ?? '[]')
    
    if (ownedRank.includes(rank)) {
      player.sendMessage(
        text(`Kamu sudah memiliki rank §6${rank}`).System.fail
      )
    } else {
      ownedRank.push(rank)
      ownedDB.set(JSON.stringify(ownedRank))
      
      applyRank(player, rank)
      
      player.sendMessage(
        text(`Rank §6${rank} berhasil ditambahkan`).System.succ
      )
    }
    
    queue.splice(index, 1)
    addDB.set(JSON.stringify(queue))
  }
}, 100)

function applyRank(player, rank) {
  const config = RANK_CONFIG[rank]
  if (!config) return
  
  new PlayerDatabase(player, 'Rank').set(rank)
  new PlayerDatabase(player, 'RankLevel').set(config.level)
  new PlayerDatabase(player, 'HealCooldown').set(0)
  new PlayerDatabase(player, 'FoodCooldown').set(0)
  
  if (config.gold) {
    Score.add(player, 'gold', config.gold)
  }
  
  if (config.silver) {
    Score.add(player, 'silver', config.silver)
  }
  
  if (config.warpLimit) {
    new PlayerDatabase(player, 'WarpLimit').set(config.warpLimit)
  }
  
  if (config.commands) {
    new PlayerDatabase(player, 'RankCommands')
      .set(JSON.stringify(config.commands))
  }
  
  player.sendMessage('§aRank benefit berhasil diterapkan!')
}

/* =========================
   GIVE RANDOM ITEM
========================= */
function giveRandomItem(player, list) {
  const value = list[Math.floor(Math.random() * list.length)]
  try {
    player.getComponent('inventory').container.addItem(
      new ItemStack(value, 1)
    )
  } catch {
    player.sendMessage(
      text(`ID item tidak valid: ${value}`).System.fail
    )
  }
}