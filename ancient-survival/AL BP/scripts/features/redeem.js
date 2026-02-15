// redeem.js
import { ItemStack } from '@minecraft/server';
import { ModalFormData } from '@minecraft/server-ui';
import OpenUI from '../extension/OpenUI';
import { WorldDatabase } from '../extension/Database';
import Score from '../extension/Score';
import { text } from '../config/text';

/* ================= Helper ================= */

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

/* ================= MAKE REDEEM ================= */

export async function makeRedeem(player) {
  const form = new ModalFormData()
    .title('Make Redeem')
    .textField('Kode Redeem', 'merdeka123')
    .slider('Jumlah Jenis Item (max 10)', 1, 10, { defaultValue: 1 })
    .slider('Limit Penggunaan (max 1000)', 1, 1000, { defaultValue: 1 })
    .textField('Gold (kosong = 0)', '0')
    .textField('Silver (kosong = 0)', '0')
    .textField('Expire (hari, kosong = tidak expire)', '7');

  const res = await OpenUI.force(player, form);
  if (!res || res.canceled) return;

  let [
    rawCode,
    itemCount,
    limit,
    goldRaw,
    silverRaw,
    expireRaw
  ] = res.formValues;

  const code = normalizeCode(rawCode);
  if (!code) {
    return player.sendMessage(text('Kode tidak valid').System.fail);
  }

  itemCount = Number(itemCount);
  limit = Number(limit);

  const gold = Math.max(0, Number(goldRaw) || 0);
  const silver = Math.max(0, Number(silverRaw) || 0);

  const expireDays = Number(expireRaw) || 0;
  const expireAt =
    expireDays > 0 ? Date.now() + expireDays * 86400000 : null;

  if (itemCount <= 0 || itemCount > 10) {
    return player.sendMessage(
      text('Jumlah jenis item 1-10').System.fail
    );
  }

  if (limit <= 0) {
    return player.sendMessage(
      text('Limit harus > 0').System.fail
    );
  }

  const key = `Redeem_${code}`;
  const db = new WorldDatabase(key);

  if (db.get()) {
    return player.sendMessage(
      text('Kode redeem sudah ada!').System.fail
    );
  }

  /* ===== Input Reward Items ===== */

  const rewards = [];

  for (let i = 0; i < itemCount; i++) {
    const f = new ModalFormData()
      .title(`Reward #${i + 1}`)
      .textField(
        'Item ID',
        'minecraft:diamond'
      )
      .slider(
        'Jumlah item',
        1,
        64,
        { defaultValue: 1 }
      );

    const r = await OpenUI.force(player, f);

    if (!r || r.canceled) {
      player.sendMessage(
        text('Pembuatan dibatalkan').System.warn
      );
      return;
    }

    const [itemRaw, amountRaw] = r.formValues;

    const itemId = itemRaw?.trim();
    const amount = Number(amountRaw) || 0;

    if (!itemId || amount <= 0) {
      return player.sendMessage(
        text(`Reward #${i + 1} tidak valid`).System.fail
      );
    }

    rewards.push({
      item: normalizeId(itemId),
      amount
    });
  }

  /* ===== Save Data ===== */

  const data = {
    code,
    rewards,
    gold,
    silver,
    limit,
    claims: {},
    expireAt,
    createdAt: Date.now()
  };

  db.set(JSON.stringify(data));

  player.sendMessage(
    text(`Redeem berhasil dibuat: §e${code}`).System.succ
  );
}

/* ================= CLAIM REDEEM ================= */

export async function claimRedeem(player) {
  const form = new ModalFormData()
    .title('Claim Redeem')
    .textField('Kode Redeem', 'merdeka123')
    .submitButton('Claim');

  const r = await OpenUI.force(player, form);
  if (!r || r.canceled) return;

  const code = normalizeCode(r.formValues[0]);

  if (!code) {
    return player.sendMessage(
      text('Kode tidak valid').System.fail
    );
  }

  const db = new WorldDatabase(`Redeem_${code}`);
  const raw = db.get();

  if (!raw) {
    return player.sendMessage(
      text('Kode tidak ditemukan').System.fail
    );
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    return player.sendMessage(
      text('Data redeem rusak').System.fail
    );
  }

  /* ===== Expire Check ===== */

  if (data.expireAt && Date.now() > data.expireAt) {
    return player.sendMessage(
      text('Kode redeem expired!').System.fail
    );
  }

  data.claims = data.claims || {};

  /* ===== Already Claimed ===== */

  if (data.claims[player.id]) {
    return player.sendMessage(
      text('Kamu sudah claim!').System.fail
    );
  }

  /* ===== Limit Check ===== */

  if (Object.keys(data.claims).length >= data.limit) {
    return player.sendMessage(
      text('Kode sudah habis!').System.fail
    );
  }

  /* ===== Give Items ===== */

  if (Array.isArray(data.rewards)) {
    for (const rwd of data.rewards) {
      try {
        const item = new ItemStack(
          normalizeId(rwd.item),
          1
        );
        giveItemSafe(
          player,
          item,
          Number(rwd.amount) || 1
        );
      } catch {
        player.sendMessage(
          text(`Item invalid: ${rwd.item}`).System.fail
        );
      }
    }
  }

  /* ===== Give Currency ===== */

  if (data.gold > 0) {
    Score.add(player, 'gold', data.gold);
  }

  if (data.silver > 0) {
    Score.add(player, 'silver', data.silver);
  }

  /* ===== Save Claim ===== */

  data.claims[player.id] = true;
  db.set(JSON.stringify(data));

  player.sendMessage(
    text('Redeem berhasil!').System.succ
  );
}