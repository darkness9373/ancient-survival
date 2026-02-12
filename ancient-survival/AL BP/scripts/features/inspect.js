import { world } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import OpenUI from '../extension/OpenUI';
import Score from '../extension/Score';
import { PlayerDatabase } from '../extension/Database';
import { playtime } from './timeplayed';

export function inspectMenu(player) {
  const players = world.getPlayers().filter(p => p.id !== player.id)
  if (players.length === 0) {
    player.sendMessage(text('Tidak ada player online').System.warn)
    return
  }
  const names = players.map(p => p.name)
  const form = new ModalFormData()
  form.title('Inspect Player')
  form.dropdown('Select Players', names)
  OpenUI.force(player, form).then(async r => {
    if (r.canceled) return
    const selected = r.formValues[0]
    inspectPlayer(player, players[selected])
  })
}

function inspectPlayer(player, target) {
  const money = Score.get(target, 'money') ?? 0
  const sec = Score.get(target, 'timePlayed') ?? 0
  const times = playtime(sec)
  const rank = new PlayerDatabase(target, 'Rank').get() ?? 'Newbie'
  const form = new ActionFormData()
  form.title(`Inspect ${target.name}`)
  form.body(
    `\n > Name : ${target.name}` +
    `\n > ID : ${target.id}` +
    `\n > Coins : ${money}` +
    `\n > Rank : ${rank}` +
    `\n > Time Played : ${times}` +
    `\n\n`
  )
  form.button('Inventory')
  form.button('Close')
  OpenUI.force(player, form).then(async r => {
    if (r.canceled || r.selection === 1) return;
    
    openInventoryList(player, target)
  })
}

function getAllItemsWithEquipment(target) {
  const result = {
    inventory: [],
    equipment: []
  }
  
  const inv = target.getComponent('inventory')?.container
  if (inv) {
    for (let slot = 0; slot < inv.size; slot++) {
      const item = inv.getItem(slot)
      if (!item) continue
      result.inventory.push({
        slot,
        name: item.typeId.replace('minecraft:', ''),
        amount: item.amount
      })
    }
  }
  
  const equip = target.getComponent('equippable')
  if (equip) {
    const equipmentSlots = [
      'Head',
      'Chest',
      'Legs',
      'Feet',
      'Offhand'
    ]
    for (const slot of equipmentSlots) {
      const item = equip.getEquipment(slot)
      if (!item) continue
      result.equipment.push({
        slot,
        name: item.typeId.replace('minecraft:', ''),
        amount: item.amount
      })
    }
  }
  return result
}

function openInventoryList(admin, target) {
  const data = getAllItemsWithEquipment(target)
  const form = new ActionFormData()
  form.title(`Inventory ${target.name}`)
  let body = ''
  body += '§l§b[ EQUIPMENT ]§r\n'
  if (data.equipment.length === 0) {
    body += '§7Kosong\n'
  } else {
    for (const item of data.equipment) {
      body += `§e${item.slot}§r : ${item.name} x${item.amount}\n`
    }
  }
  body += '\n§l§a[ INVENTORY ]§r\n'
  if (data.inventory.length === 0) {
    body += '§7Kosong\n'
  } else {
    for (const item of data.inventory) {
      body += `§7[${item.slot}]§r ${item.name} §ex${item.amount}\n`
    }
  }
  form.body(body)
  form.button('Close')
  OpenUI.force(admin, form)
}