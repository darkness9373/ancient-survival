// unban.js
import { world } from '@minecraft/server';
import { ModalFormData, MessageFormData } from '@minecraft/server-ui';
import OpenUI from '../extension/OpenUI';
import { WorldDatabase } from '../extension/Database';
import { text } from '../config/text';
import { playtime } from './timeplayed';

/**
 * Format durasi (reuse style)
 */
function formatBanDuration(duration) {
  if (!duration) return 'Unknown';
  if (duration.permanent) return 'Permanent';
  const ms = duration.expiresAt - Date.now();
  if (ms <= 0) return 'Expired';
  return playtime(Math.floor(ms / 1000));
}

/**
 * Ambil semua dynamic property world yang terkait ban
 * Return array entry: { key, type: 'id'|'name', id?, name?, label }
 */
function collectBanEntries() {
  const result = [];
  let props = [];
  try {
    props = world.getDynamicPropertyIds() || [];
  } catch (e) {
    console.error('getDynamicPropertyIds failed:', e);
    return result;
  }
  
  for (const key of props) {
    if (typeof key !== 'string') continue;
    
    // Ban by ID: Ban:<id>
    if (key.startsWith('Ban:')) {
      try {
        const db = new WorldDatabase(key);
        const raw = db.get();
        if (!raw) {
          result.push({ key, type: 'id', id: key.replace('Ban:', ''), name: null, label: `${key.replace('Ban:', '')} (ban)` });
          continue;
        }
        const data = JSON.parse(raw);
        const id = data.id ?? key.replace('Ban:', '');
        const name = data.name ?? 'Unknown';
        const reason = data.reason ?? '-';
        const durationLabel = formatBanDuration({ permanent: !!data.permanent, expiresAt: data.expiresAt ?? null });
        const label = `${name} §a(${id})`;
        result.push({ key, type: 'id', id, name, label });
      } catch (e) {
        result.push({ key, type: 'id', id: key.replace('Ban:', ''), name: null, label: `${key.replace('Ban:', '')} (ban)` });
      }
      continue;
    }
    
    // Ban by Name: BanName:<name>
    if (key.startsWith('BanName:')) {
      try {
        const db = new WorldDatabase(key);
        const raw = db.get();
        if (!raw) {
          const name = key.replace('BanName:', '');
          result.push({ key, type: 'name', name, label: `${name} §7(offline ban)` });
          continue;
        }
        const data = JSON.parse(raw);
        const name = data.name ?? key.replace('BanName:', '');
        const reason = data.reason ?? '-';
        const durationLabel = formatBanDuration({ permanent: !!data.permanent, expiresAt: data.expiresAt ?? null });
        const label = `${name} §c(offline)`;
        result.push({ key, type: 'name', name, label });
      } catch (e) {
        const name = key.replace('BanName:', '');
        result.push({ key, type: 'name', name, label: `${name} §7(offline ban)` });
      }
    }
  }
  
  return result;
}

/**
 * Execute actual unban removal for a collected entry
 */
function executeUnbanEntry(entry) {
  let removed = false;
  
  if (entry.type === 'id') {
    // remove Ban:<id>
    const dbId = new WorldDatabase(entry.key);
    const rawId = dbId.get();
    if (rawId) {
      dbId.remove();
      removed = true;
    }
    
    // try also remove BanName:<nameLower>
    if (entry.name) {
      const nameKey = `BanName:${String(entry.name).toLowerCase()}`;
      const dbName = new WorldDatabase(nameKey);
      if (dbName.get()) {
        dbName.remove();
      }
    }
  } else if (entry.type === 'name') {
    const dbName = new WorldDatabase(entry.key);
    const rawName = dbName.get();
    if (rawName) {
      dbName.remove();
      removed = true;
    }
    
    // if offline ban contained an id, try remove Ban:<id>
    try {
      const parsed = JSON.parse(rawName || '{}');
      if (parsed && parsed.id) {
        const idKey = `Ban:${parsed.id}`;
        const dbId2 = new WorldDatabase(idKey);
        if (dbId2.get()) dbId2.remove();
      }
    } catch (e) {
      // ignore parse errors
    }
  }
  
  // fallback: attempt to remove both keys anyway (best-effort)
  try {
    if (!removed) {
      if (entry.type === 'id' && entry.id) {
        new WorldDatabase(`Ban:${entry.id}`).remove();
        if (entry.name) new WorldDatabase(`BanName:${String(entry.name).toLowerCase()}`).remove();
        removed = true;
      } else if (entry.type === 'name' && entry.name) {
        new WorldDatabase(`BanName:${String(entry.name).toLowerCase()}`).remove();
        removed = true;
      }
    }
  } catch (e) {
    // ignore
  }
  
  return removed;
}

/**
 * Open unban menu (dropdown), then show confirmation MessageFormData,
 * and execute unban when confirmed.
 */
export function openUnbanMenu(admin) {
  const list = collectBanEntries();
  
  if (!list.length) {
    admin.sendMessage(text('Tidak ada player yang sedang diban').System.warn);
    return;
  }
  
  const labels = list.map(l => l.label);
  
  const form = new ModalFormData()
    .title('Unban Player')
    .dropdown('Pilih player yang ingin di-unban', labels)
    .submitButton('Next');
  
  OpenUI.force(admin, form).then(res => {
    if (res.canceled) return;
    
    const idx = res.formValues[0];
    const entry = list[idx];
    if (!entry) {
      admin.sendMessage(text('Target tidak valid').System.fail);
      return;
    }
    
    // Read DB data to show nicer detail in confirmation
    let detail = null;
    try {
      const db = new WorldDatabase(entry.key);
      const raw = db.get();
      if (raw) detail = JSON.parse(raw);
    } catch (e) {
      detail = null;
    }
    
    const displayName = entry.name ?? entry.id ?? entry.key;
    const displayId = entry.id ?? (detail && detail.id) ?? '-';
    const reason = (detail && detail.reason) ? detail.reason : '-';
    const durationLabel = detail ? formatBanDuration({ permanent: !!detail.permanent, expiresAt: detail.expiresAt ?? null }) : 'Unknown';
    
    const confirmForm = new MessageFormData()
      .title('Confirm Unban')
      .body(
        `§fNama: §e${displayName}\n` +
        `§fID: §7${displayId}\n\n` +
        `§fAlasan: §e${reason}\n` +
        `§fDurasi: §e${durationLabel}\n\n` +
        `§cTekan "Unban" untuk menghapus ban, atau "Cancel" untuk batal.`
      )
      .button1('Unban')
      .button2('Cancel');
    
    OpenUI.force(admin, confirmForm).then(cr => {
      if (cr.canceled || cr.selection === 1) return;
      
      // execute unban
      let ok = false;
      try {
        ok = executeUnbanEntry(entry);
      } catch (err) {
        console.error('Unban execution failed:', err);
        admin.sendMessage(text('Terjadi error saat meng-unban').System.fail);
        return;
      }
      
      // Inform admin
      if (ok) {
        admin.sendMessage(text(`Player ${displayName} berhasil di-unban`).System.succ);
        // notify online player if present
        try {
          if (entry.name) {
            const online = world.getPlayers().find(p => p.name.toLowerCase() === String(entry.name).toLowerCase());
            if (online) online.sendMessage(text('§aBan kamu telah dicabut oleh admin').System.succ);
          }
        } catch (e) {
          // ignore notifications
        }
      } else {
        // Even if execute reported nothing removed, still inform admin we attempted
        admin.sendMessage(text(`Unban attempt performed for ${displayName} (may have been already removed)`).System.succ);
      }
    });
  });
}