import { world, system } from '@minecraft/server'
import Score from '../extension/Score'
import { ModalFormData } from '@minecraft/server-ui';
import OpenUI from '../extension/OpenUI';
import { text } from '../config/text';

/**
 * Minimum perubahan money agar ditampilkan
 */
const THRESHOLD = 5

/**
 * Interval pengecekan
 * 10 tick = 0.5 detik
 */
system.run(function tick() {
    system.runTimeout(tick, 10)
    
    for (const player of world.getPlayers()) {
        
        let actionMessages = []
        
        /* ================= GOLD ================= */
        const gold = Number(Score.get(player, 'gold') ?? 0)
        let goldRaw = Score.get(player, 'goldRaw')
        
        if (goldRaw === undefined || goldRaw === null) {
            Score.set(player, 'goldRaw', gold)
        } else {
            goldRaw = Number(goldRaw)
            
            if (gold !== goldRaw) {
                const diff = gold - goldRaw
                
                if (Math.abs(diff) >= THRESHOLD) {
                    actionMessages.push(
                        diff > 0 ?
                        `§a+${diff} Gold` :
                        `§c-${diff} Gold`
                    )
                }
                
                Score.set(player, 'goldRaw', gold)
            }
        }
        
        /* ================= SILVER ================= */
        const silver = Number(Score.get(player, 'silver') ?? 0)
        let silverRaw = Score.get(player, 'silverRaw')
        
        if (silverRaw === undefined || silverRaw === null) {
            Score.set(player, 'silverRaw', silver)
        } else {
            silverRaw = Number(silverRaw)
            
            if (silver !== silverRaw) {
                const diff = silver - silverRaw
                
                if (Math.abs(diff) >= THRESHOLD) {
                    actionMessages.push(
                        diff > 0 ?
                        `§a+${diff} Silver` :
                        `§c-${diff} Silver`
                    )
                }
                
                Score.set(player, 'silverRaw', silver)
            }
        }
        
        /* ================= ACTION BAR ================= */
        if (actionMessages.length > 0) {
            player.onScreenDisplay.setActionBar(
                actionMessages.join(' §7| ')
            )
        }
    }
})

/* ========================================================= */
/* ===================== SEND GOLD ========================= */
/* ========================================================= */

export function sendGold(player) {
    const players = world.getAllPlayers()
    const names = players.map(p => p.name)
    
    if (names.length <= 1) {
        return player.sendMessage(
            text('Tidak ada player lain yang online').System.fail
        )
    }
    
    const form = new ModalFormData()
        .title('Send Gold')
        .dropdown('Select Player', names)
        .textField('Isi nominal', 'ex: 1000')
        .submitButton('Send')
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled) return
        
        const [select, moneyInput] = r.formValues
        
        const amount = parseInt(moneyInput.trim())
        
        if (!Number.isInteger(amount) || amount <= 0) {
            return player.sendMessage(
                text('Nominal harus berupa angka bulat positif').System.fail
            )
        }
        
        const targetName = names[select]
        
        if (targetName === player.name) {
            return player.sendMessage(
                text('Tidak bisa mengirim gold ke diri sendiri').System.fail
            )
        }
        
        const target = world.getAllPlayers().find(p => p.name === targetName)
        
        if (!target) {
            return player.sendMessage(
                text('Player sudah tidak online').System.fail
            )
        }
        
        const senderMoney = Number(Score.get(player, 'gold') ?? 0)
        
        if (senderMoney < amount) {
            return player.sendMessage(
                text('Gold kamu tidak mencukupi').System.fail
            )
        }
        
        Score.remove(player, 'gold', amount)
        Score.add(target, 'gold', amount)
        
        player.sendMessage(
            text(`Kamu mengirim §e${amount}§a Gold ke §b${target.name}`).System.succ
        )
        
        target.sendMessage(
            text(`Kamu menerima §e${amount}§a Gold dari §b${player.name}`).System.succ
        )
    })
}

/* ========================================================= */
/* ==================== SEND SILVER ======================== */
/* ========================================================= */

export function sendSilver(player) {
    const players = world.getAllPlayers()
    const names = players.map(p => p.name)
    
    if (names.length <= 1) {
        return player.sendMessage(
            text('Tidak ada player lain yang online').System.fail
        )
    }
    
    const form = new ModalFormData()
        .title('Send Silver')
        .dropdown('Select Player', names)
        .textField('Isi nominal', 'ex: 1000')
        .submitButton('Send')
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled) return
        
        const [select, moneyInput] = r.formValues
        
        const amount = parseInt(moneyInput.trim())
        
        if (!Number.isInteger(amount) || amount <= 0) {
            return player.sendMessage(
                text('Nominal harus berupa angka bulat positif').System.fail
            )
        }
        
        const targetName = names[select]
        
        if (targetName === player.name) {
            return player.sendMessage(
                text('Tidak bisa mengirim silver ke diri sendiri').System.fail
            )
        }
        
        const target = world.getAllPlayers().find(p => p.name === targetName)
        
        if (!target) {
            return player.sendMessage(
                text('Player sudah tidak online').System.fail
            )
        }
        
        const senderMoney = Number(Score.get(player, 'silver') ?? 0)
        
        if (senderMoney < amount) {
            return player.sendMessage(
                text('Silver kamu tidak mencukupi').System.fail
            )
        }
        
        Score.remove(player, 'silver', amount)
        Score.add(target, 'silver', amount)
        
        player.sendMessage(
            text(`Kamu mengirim §e${amount}§a Silver ke §b${target.name}`).System.succ
        )
        
        target.sendMessage(
            text(`Kamu menerima §e${amount}§a Silver dari §b${player.name}`).System.succ
        )
    })
}