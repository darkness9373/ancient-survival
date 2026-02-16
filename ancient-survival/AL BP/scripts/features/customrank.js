import { system, world, ItemStack } from '@minecraft/server';
import { ModalFormData } from '@minecraft/server-ui'
import OpenUI from '../extension/OpenUI'
import { WorldDatabase, PlayerDatabase } from '../extension/Database.js'
import Score from '../extension/Score'
import { text } from '../config/text'
import { CUSTOM_CONFIG, mcColors } from '../config/system';

export function CustomRankColor(player) {
  const db = new PlayerDatabase(player, 'CustomRank').get()
  if (!db) return player.sendMessage(text('Kamu tidak memiliki Custom Rank').System.fail)
  let color = []
  let showdp = []
  for (const cl of mcColors) {
    color.push(cl.id)
    showdp.push(`${cl.id}${cl.name}§r`)
  }
  const form = new ModalFormData()
  form.title('Change Custom Rank Color')
  form.dropdown('Select Color', showdp)
  OpenUI.force(player, form).then(async r => {
    if (r.canceled) return
    const selected = color[r.formValues[0]]
    new PlayerDatabase(player, 'CustomRankColor').set(selected)
    player.sendMessage(text(`Berhasil mengubah warna rank menjadi ${showdp[r.formValues[0]]}`).System.succ)
  })
}

export function addCustomRankForm(player) {
  
  const form = new ModalFormData()
    .title('Add Player Rank')
    .textField('Player Name', 'ex: Steve')
    .textField('Insert Rank', 'Villain')
  OpenUI.force(player, form).then(r => {
    if (r.canceled) return
    
    const playerName = r.formValues[0]?.trim()
    const rank = r.formValues[1]
    
    if (!playerName) {
      return player.sendMessage(
        text('Nama player tidak valid').System.fail
      )
    }
    
    const db = new WorldDatabase('AddCustomRank')
    const queue = JSON.parse(db.get() ?? '[]')
    
    if (!queue.some(q => q.name === playerName.toLowerCase() && q.rank === rank)) {
      queue.push({ name: playerName.toLowerCase(), rank })
    }
    db.set(JSON.stringify(queue))
    
    player.sendMessage(
      text(
        `Penambahan rank custom diproses:\n§7Name: §b${playerName}\n§7Rank: §6${rank}`
      ).System.succ
    )
  })
}

system.runInterval(() => {
  const addDB = new WorldDatabase('AddCustomRank')
  const queue = JSON.parse(addDB.get() ?? '[]')
  if (!queue.length) return
  
  for (const player of world.getPlayers()) {
    const index = queue.findIndex(q => q.name === player.name.toLowerCase())
    if (index === -1) continue
    
    const { rank } = queue[index]
    
    const ownedDB = new PlayerDatabase(player, 'CustomRank')
    const ownedRank = ownedDB.get()
    
    if (ownedRank) {
      player.sendMessage(
        text(`Kamu sudah memiliki rank custom`).System.fail
      )
    } else {
      ownedDB.set(rank)
      
      applyRank(player, rank)
      
      player.sendMessage(
        text(`Rank Custom: §6${rank} §aberhasil ditambahkan`).System.succ
      )
    }
    
    queue.splice(index, 1)
    addDB.set(JSON.stringify(queue))
  }
}, 200)


function applyRank(player, rank) {
  new PlayerDatabase(player, 'HealCooldown').set(0)
  new PlayerDatabase(player, 'FoodCooldown').set(0)
  system.run(() => player.addTag('customrank'))
  const config = CUSTOM_CONFIG
  
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
  
  giveRandomItem(player, weapon)
  
  player.sendMessage('§aRank Custom benefit berhasil diterapkan!')
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

const weapon = [
  'rex:chaos',
  'rex:darkro',
  'rex:kitsune',
  'rex:steel',
  'rex:straw'
]

system.runInterval(() => {
  world.getPlayers().forEach(player => {
    if (player.hasTag('customrank')) {
      player.addEffect('health_boost', 3, { amplifier: 2 })
      player.addEffect('speed', 3, { amplifier: 1 })
    }
  })
}, 40)