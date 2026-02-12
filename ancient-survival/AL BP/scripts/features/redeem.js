// redeem.js
import { ItemStack } from '@minecraft/server';
import { ModalFormData } from '@minecraft/server-ui';
import OpenUI from '../extension/OpenUI';
import { WorldDatabase } from '../extension/Database';
import Score from '../extension/Score';
import { text } from '../config/text';

/**
 * Helper
 */
function normalizeId(id) {
  return id.includes(':') ? id : `minecraft:${id}`;
}

function normalizeCode(code) {
  return String(code ?? '').trim().toLowerCase();
}

function giveItemSafe(player, itemStack, amount = 1) {
  const inv = player.getComponent('inventory').container;
  
  // non-stackable
  if (itemStack.maxAmount <= 1) {
    for (let i = 0; i < amount; i++) {
      const one = itemStack.clone();
      one.amount = 1;
      const leftover = inv.addItem(one);
      if (leftover) player.dimension.spawnItem(leftover, player.location);
    }
    return;
  }
  
  // stackable
  let remaining = amount;
  const maxStack = itemStack.maxAmount;
  while (remaining > 0) {
    const give = Math.min(maxStack, remaining);
    const stack = itemStack.clone();
    stack.amount = give;
    const leftover = inv.addItem(stack);
    if (leftover) player.dimension.spawnItem(leftover, player.location);
    remaining -= give;
  }
}

/* ================= makeRedeem ================= */
export async function makeRedeem(player) {
  // Form utama: code, jumlah jenis item, limit, include coins
  const form = new ModalFormData()
    .title('Make Redeem')
    .textField('Kode Redeem', 'merdeka123')
    .slider('Jumlah Jenis Item (max 10)', 1, 10, { defaultValue: 1 })
    .slider('Limit Penggunaan (max 1000)', 1, 1000, { defaultValue: 1 })
    .toggle('Include Coins?', { defaultValue: false });
  
  const res = await OpenUI.force(player, form);
  if (!res || res.canceled) return;
  
  let [rawCode, itemCount, limit, includeCoins] = res.formValues;
  
  const code = normalizeCode(rawCode);
  if (!code) return player.sendMessage(text('Kode tidak valid').System.fail);
  
  // validate
  itemCount = Number(itemCount) || 0;
  limit = Number(limit) || 0;
  if (itemCount <= 0 || itemCount > 10) {
    return player.sendMessage(text('Jumlah jenis item harus antara 1-10').System.fail);
  }
  if (limit <= 0) {
    return player.sendMessage(text('Limit harus lebih besar dari 0').System.fail);
  }
  
  const key = `Redeem_${code}`;
  const db = new WorldDatabase(key);
  if (db.get()) {
    return player.sendMessage(text('Kode redeem sudah ada!').System.fail);
  }
  
  // Kumpulkan rewards — kita gunakan modal berulang agar aman terhadap batas field
  const rewards = [];
  for (let i = 0; i < itemCount; i++) {
    const f = new ModalFormData()
      .title(`Reward #${i + 1}`)
      .textField('Item ID (ex: minecraft:diamond atau diamond)', 'minecraft:diamond')
      .slider('Jumlah item (1-64)', 1, 64, { defaultValue: 1 });
    
    const r = await OpenUI.force(player, f);
    if (!r || r.canceled) {
      player.sendMessage(text('Pembuatan redeem dibatalkan').System.warn);
      return;
    }
    const [itemRaw, amountRaw] = r.formValues;
    const itemId = (itemRaw || '').trim();
    const amount = Number(amountRaw) || 0;
    if (!itemId || amount <= 0) {
      // skip invalid entry (atau batalkan)
      player.sendMessage(text(`Reward #${i + 1} tidak valid, dibatalkan`).System.fail);
      return;
    }
    rewards.push({ item: normalizeId(itemId), amount });
  }
  
  // Jika includeCoins true, tanya jumlah coin
  let coins = 0;
  if (includeCoins) {
    const fcoin = new ModalFormData()
      .title('Include Coins')
      .slider('Jumlah Coins per player (1 - 100000)', 1, 100000, { defaultValue: 1 });
    const rcoin = await OpenUI.force(player, fcoin);
    if (!rcoin || rcoin.canceled) {
      player.sendMessage(text('Pembuatan redeem dibatalkan').System.warn);
      return;
    }
    coins = Number(rcoin.formValues[0]) || 0;
  }
  
  const data = {
    code,
    rewards,
    coins,
    limit,
    claims: [],
    createdAt: Date.now()
  };
  
  db.set(JSON.stringify(data));
  player.sendMessage(text(`Redeem code berhasil dibuat: §e${code}`).System.succ);
}

/* ================= claimRedeem ================= */
export async function claimRedeem(player) {
  const form = new ModalFormData()
    .title('Claim Redeem')
    .textField('Kode Redeem', 'merdeka123')
    .submitButton('Claim');
  
  const r = await OpenUI.force(player, form);
  if (!r || r.canceled) return;
  
  const code = normalizeCode(r.formValues[0]);
  if (!code) return player.sendMessage(text('Kode tidak valid').System.fail);
  
  const key = `Redeem_${code}`;
  const db = new WorldDatabase(key);
  const raw = db.get();
  if (!raw) return player.sendMessage(text('Kode redeem tidak valid').System.fail);
  
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return player.sendMessage(text('Data redeem corrupt').System.fail);
  }
  
  // cek sudah claim
  if (Array.isArray(data.claims) && data.claims.includes(player.id)) {
    return player.sendMessage(text('Kamu sudah claim kode ini!').System.fail);
  }
  
  if (data.claims.length >= data.limit) {
    return player.sendMessage(text('Kode redeem sudah habis!').System.fail);
  }
  
  // Berikan rewards
  if (Array.isArray(data.rewards)) {
    for (const rwd of data.rewards) {
      try {
        const item = new ItemStack(normalizeId(rwd.item), 1);
        giveItemSafe(player, item, Number(rwd.amount) || 1);
      } catch (e) {
        player.sendMessage(text(`Item tidak valid: ${rwd.item}`).System.fail);
      }
    }
  }
  
  // Berikan coins
  if (Number(data.coins) > 0) {
    Score.add(player, 'money', Number(data.coins));
  }
  
  // catat claim
  data.claims = data.claims || [];
  data.claims.push(player.id);
  db.set(JSON.stringify(data));
  
  player.sendMessage(text('Redeem berhasil!').System.succ);
}