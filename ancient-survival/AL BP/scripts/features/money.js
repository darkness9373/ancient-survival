import { world, system } from '@minecraft/server'
import Score from '../extension/Score'
import { ModalFormData, ActionFormData } from '@minecraft/server-ui';
import OpenUI from '../extension/OpenUI';
import { text } from '../config/text';

/**
 * Minimum perubahan money agar ditampilkan
 * (anti spam)
 */
const THRESHOLD = 5

/**
 * Interval pengecekan
 * 10 tick = 0.5 detik
 */
system.run(function tick() {
    system.runTimeout(tick, 10)
    
    for (const player of world.getPlayers()) {
        const money = Number(Score.get(player, 'money') ?? 0)
        
        let moneyRaw = Score.get(player, 'moneyRaw')
        
        // Inisialisasi pertama kali
        if (moneyRaw === undefined || moneyRaw === null) {
            Score.set(player, 'moneyRaw', money)
            continue
        }
        
        moneyRaw = Number(moneyRaw)
        
        if (money === moneyRaw) continue
        
        const diff = money - moneyRaw
        
        // Threshold check
        if (Math.abs(diff) < THRESHOLD) {
            Score.set(player, 'moneyRaw', money)
            continue
        }
        
        // ActionBar feedback
        player.onScreenDisplay.setActionBar(
            diff > 0 ?
            `§a+${diff} Coins` :
            `§c${diff} Coins`
        )
        
        // Update snapshot
        Score.set(player, 'moneyRaw', money)
    }
})


export function sendMoney(player) {
    const players = world.getAllPlayers()
    const names = players.map(p => p.name)
    
    if (names.length <= 1) {
        return player.sendMessage(
            text('Tidak ada player lain yang online').System.fail
        )
    }
    
    const form = new ModalFormData()
        .title('Send Coins')
        .dropdown('Select Player', names)
        .textField('Isi nominal', 'ex: 1000')
        .submitButton('Kirim')
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled) return
        
        const [select, moneyInput] = r.formValues
        
        /* ===== VALIDASI NOMINAL ===== */
        const amount = Number(moneyInput)
        if (!Number.isInteger(amount) || amount <= 0) {
            return player.sendMessage(
                text('Nominal harus berupa angka bulat positif').System.fail
            )
        }
        
        const targetName = names[select]
        
        if (targetName === player.name) {
            return player.sendMessage(
                text('Tidak bisa mengirim uang ke diri sendiri').System.fail
            )
        }
        
        const target = world.getAllPlayers().find(p => p.name === targetName)
        if (!target) {
            return player.sendMessage(
                text('Player sudah tidak online').System.fail
            )
        }
        
        /* ===== SALDO ===== */
        const senderMoney = Number(Score.get(player, 'money') ?? 0)
        
        if (senderMoney < amount) {
            return player.sendMessage(
                text('Coin kamu tidak mencukupi').System.fail
            )
        }
        
        /* ===== TRANSAKSI ===== */
        Score.set(player, 'money', senderMoney - amount)
        
        const targetMoney = Number(Score.get(target, 'money') ?? 0)
        Score.set(target, 'money', targetMoney + amount)
        
        /* ===== FEEDBACK ===== */
        player.sendMessage(
            text(`Kamu mengirim §e${amount}§a Coins ke §b${target.name}`).System.succ
        )
        
        target.sendMessage(
            text(`Kamu menerima §e${amount}§a Coins dari §b${player.name}`).System.succ
        )
    })
}