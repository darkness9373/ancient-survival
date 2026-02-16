import { world, system } from "@minecraft/server";
import Score from "../extension/Score";
import { WorldDatabase } from "../extension/Database";
import { ModalFormData } from '@minecraft/server-ui';
import OpenUI from '../extension/OpenUI';
import { text } from '../config/text';


export function topupUI(player) {
  const form = new ModalFormData()
  form.title('TopUp Gold')
  form.textField('Player Name', 'ex: Darkness')
  form.textField('Nominal', 'ex: 1000')
  OpenUI.force(player, form).then(async r => {
    if (r.canceled) return
    const [name, goldRaw] = r.formValues
    const playerName = name.trim()
    const gold = Number(goldRaw)
    if (isNaN(gold)) return player.sendMessage(text('Nominal harus angka').System.fail)
    const db = new WorldDatabase('AddTopUp')
    const queue = JSON.parse(db.get() ?? '[]')
    const add = {
      name: playerName.toLowerCase(),
      amount: gold
    }
    queue.push(add)
    db.set(JSON.stringify(queue))
    player.sendMessage(
      text(`Topup disimpan:\n§e${playerName} = ${gold} gold`).succ
    );
  })
}

/* =========================
   AUTO CLAIM SYSTEM
========================= */

function checkTopup(player) {
  const db = new WorldDatabase("AddTopUp");
  const raw = db.get();
  if (!raw) return;
  
  let queue;
  try {
    queue = JSON.parse(raw);
  } catch {
    queue = [];
  }
  
  if (!Array.isArray(queue) || queue.length === 0) return;
  
  const name = player.name.toLowerCase();
  
  let changed = false;
  
  // cari semua topup milik player ini
  const remaining = [];
  
  for (const data of queue) {
    if (data.name === name) {
      // kasih gold
      Score.add(player, "gold", data.amount);
      
      player.sendMessage(
        text(`[TOPUP] §a+${data.amount} gold berhasil masuk!`).warn
      );
      
      changed = true;
    } else {
      remaining.push(data);
    }
  }
  
  // simpan ulang queue tanpa data yg sudah di-claim
  if (changed) {
    db.set(JSON.stringify(remaining));
  }
}

// cek tiap 3 detik
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    checkTopup(player);
  }
}, 60);